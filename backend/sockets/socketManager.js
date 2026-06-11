const Document = require('../models/Document');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/webpush');

// In-memory huddle state: documentId -> Map<userId, {userId, userName, socketId}>
const activeHuddles = new Map();

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    // ─── Identify user and join their private notification room ──────────────
    socket.on('identify-user', (userId) => {
      if (!userId) return;
      // Leave any existing user rooms (session isolation)
      socket.rooms.forEach(room => {
        if (room.startsWith('user_') && room !== `user_${userId}`) {
          socket.leave(room);
        }
      });
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} identified as user ${userId}`);
    });

    // ─── Document Collaboration ───────────────────────────────────────────────
    socket.on('join-document', async (documentId, userId) => {
      socket.join(documentId);
      console.log(`User ${userId} joined document ${documentId}`);
      // Notify others
      socket.to(documentId).emit('user-joined', userId);
    });

    socket.on('leave-document', (documentId) => {
      socket.leave(documentId);
    });

    socket.on('send-changes', (documentId, delta) => {
      socket.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async (documentId, content) => {
      try {
        await Document.findByIdAndUpdate(documentId, { content });
      } catch (err) {
        console.error('Error saving document', err);
      }
    });

    // ─── Team Chat ────────────────────────────────────────────────────────────
    socket.on('send-message', async (data) => {
      try {
        const { documentId, senderId, message, senderName } = data;

        // Save to DB
        const newMessage = new Message({
          documentId,
          senderId,
          message
        });
        await newMessage.save();

        // Broadcast to document room
        io.to(documentId).emit('receive-message', {
          _id: newMessage._id,
          documentId,
          senderId: { _id: senderId, name: senderName },
          message,
          createdAt: newMessage.createdAt
        });

        // ── Real-time Notifications ──────────────────────────────────────────
        const doc = await Document.findById(documentId).populate('collaborators.userId', 'name');
        if (doc) {
          const recipients = [];

          // Owner is a recipient if they aren't the sender
          if (doc.owner.toString() !== senderId) {
            recipients.push(doc.owner.toString());
          }

          // All collaborators are recipients if they aren't the sender
          doc.collaborators.forEach(c => {
            const collabId = c.userId._id.toString();
            if (collabId !== senderId && !recipients.includes(collabId)) {
              recipients.push(collabId);
            }
          });

          // Emit targeted notifications only (no global broadcast)
          for (const recipientId of recipients) {
            const notif = new Notification({
              userId: recipientId,
              type: 'message',
              title: `New Message in ${doc.title}`,
              message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
              documentId: documentId,
              fromUser: senderId
            });
            await notif.save();
            io.to(`user_${recipientId}`).emit('new-notification', notif);

            // Send Native Web Push for offline devices
            const recipientUser = await User.findById(recipientId);
            if (recipientUser) {
              await sendPushNotification(recipientUser, {
                title: notif.title,
                message: notif.message,
                url: `/editor/${documentId}?tab=chat`
              });
            }
          }
        }
      } catch (err) {
        console.error('Error in send-message notification', err);
      }
    });

    socket.on('typing-start', (documentId, userName) => {
      socket.to(documentId).emit('user-typing', userName);
    });

    socket.on('typing-end', (documentId) => {
      socket.to(documentId).emit('user-stopped-typing');
    });

    // ─── Cursor Presence ──────────────────────────────────────────────────────
    socket.on('cursor-move', ({ documentId, userId, userName, x, y, color }) => {
      socket.to(documentId).emit('cursor-updated', { userId, userName, x, y, color });
    });

    socket.on('cursor-leave', ({ documentId, userId }) => {
      socket.to(documentId).emit('cursor-removed', { userId });
    });

    // ─── Spotlight ────────────────────────────────────────────────────────────
    socket.on('spotlight-activate', ({ documentId, userId, userName, color }) => {
      socket.to(documentId).emit('spotlight-on', { userId, userName, color });
    });

    socket.on('spotlight-move', ({ documentId, userId, x, y }) => {
      socket.to(documentId).emit('spotlight-moved', { userId, x, y });
    });

    socket.on('spotlight-deactivate', ({ documentId, userId }) => {
      socket.to(documentId).emit('spotlight-off', { userId });
    });

    // ─── Huddle (Voice/Video) ─────────────────────────────────────────────────
    socket.on('huddle-start', ({ documentId, userId, userName }) => {
      if (!activeHuddles.has(documentId)) {
        activeHuddles.set(documentId, new Map());
      }
      const huddle = activeHuddles.get(documentId);
      huddle.set(userId, { userId, userName, socketId: socket.id });
      io.to(documentId).emit('huddle-started', {
        initiatorId: userId,
        initiatorName: userName,
        documentId
      });
    });

    socket.on('huddle-join', ({ documentId, userId, userName }) => {
      if (!activeHuddles.has(documentId)) {
        activeHuddles.set(documentId, new Map());
      }
      const huddle = activeHuddles.get(documentId);
      const existingPeers = Array.from(huddle.values());
      huddle.set(userId, { userId, userName, socketId: socket.id });
      // Tell the joining user who is already in the huddle
      socket.emit('peer-joined', { peers: existingPeers });
      // Tell existing peers that someone new joined
      socket.to(documentId).emit('new-peer', { userId, userName, socketId: socket.id });
    });

    socket.on('huddle-leave', ({ documentId, userId }) => {
      if (activeHuddles.has(documentId)) {
        const huddle = activeHuddles.get(documentId);
        huddle.delete(userId);
        io.to(documentId).emit('peer-left', { userId });
        if (huddle.size === 0) {
          activeHuddles.delete(documentId);
          io.to(documentId).emit('huddle-ended');
        }
      }
    });

    // ─── WebRTC Signalling ────────────────────────────────────────────────────
    socket.on('webrtc-offer', ({ to, offer, from }) => {
      io.to(`user_${to}`).emit('webrtc-offer', { offer, from });
    });

    socket.on('webrtc-answer', ({ to, answer, from }) => {
      io.to(`user_${to}`).emit('webrtc-answer', { answer, from });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate, from }) => {
      io.to(`user_${to}`).emit('webrtc-ice-candidate', { candidate, from });
    });

    socket.on('huddle-speaking', ({ documentId, userId, isSpeaking }) => {
      socket.to(documentId).emit('peer-speaking', { userId, isSpeaking });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);

      // Clean up any huddle this socket was part of
      activeHuddles.forEach((huddle, documentId) => {
        huddle.forEach((participant, userId) => {
          if (participant.socketId === socket.id) {
            huddle.delete(userId);
            io.to(documentId).emit('peer-left', { userId });
            if (huddle.size === 0) {
              activeHuddles.delete(documentId);
              io.to(documentId).emit('huddle-ended');
            }
          }
        });
      });
    });
  });
};
