const Document = require('../models/Document');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/webpush');
module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    // Identify user and join their private notification room
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

    // Document Collaboration
    socket.on('join-document', async (documentId, userId) => {
      socket.join(documentId);
      console.log(`User ${userId} joined document ${documentId}`);

      // Notify others
      socket.to(documentId).emit('user-joined', userId);

      // Save user to a local memory presence list if needed
    });

    socket.on('send-changes', (documentId, delta) => {
      // delta is the content change
      socket.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async (documentId, content) => {
      try {
        await Document.findByIdAndUpdate(documentId, { content });
      } catch (err) {
        console.error('Error saving document', err);
      }
    });

    // Team Chat
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

        // --- REAL-TIME NOTIFICATIONS ---

        // Find document to get collaborators and owner
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

          // NUCLEAR OPTION: Global broadcast to ensure delivery (EXCLUDING SENDER)
          socket.broadcast.emit('new-notification', {
            _id: `temp_${Date.now()}`,
            title: `New Message in ${doc.title}`,
            message: `${senderName}: ${message.substring(0, 50)}...`,
            documentId: documentId,
            fromUser: { _id: senderId, name: senderName },
            createdAt: new Date().toISOString(),
            read: false
          });

          // Also do the private ones for persistence
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

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      // emit user-left if we track which rooms they were in
    });
  });
};
