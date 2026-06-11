const Document = require('../models/Document');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Team = require('../models/Team');
const { sendPushNotification } = require('../utils/webpush');

exports.createDocument = async (req, res) => {
  try {
    const newDoc = new Document({
      title: req.body.title || 'Untitled Document',
      content: req.body.content || '',
      owner: req.user.id
    });
    const doc = await newDoc.save();
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const userTeams = await Team.find({
      $or: [{ owner: req.user.id }, { 'members.userId': req.user.id }]
    }).select('_id');
    const teamIds = userTeams.map(t => t._id);

    const docs = await Document.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.userId': req.user.id },
        { teamId: { $in: teamIds } }
      ]
    })
      .populate('owner', 'name email')
      .populate('collaborators.userId', 'name email')
      .sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.userId', 'name email');
    
    if (!doc) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    let isTeamMember = false;
    if (doc.teamId) {
      const team = await Team.findById(doc.teamId);
      if (team && (team.owner.toString() === req.user.id || team.members.some(m => m.userId.toString() === req.user.id))) {
        isTeamMember = true;
      }
    }

    const isOwner = doc.owner._id.toString() === req.user.id;
    const isCollab = doc.collaborators.some(c => c.userId._id.toString() === req.user.id);

    if (!isOwner && !isCollab && !isTeamMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    let docObj = doc.toObject();
    docObj.isTeamMember = isTeamMember;
    res.json(docObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.status(500).send('Server Error');
  }
};

exports.updateDocument = async (req, res) => {
  try {
    let doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    let isTeamMember = false;
    if (doc.teamId) {
      const team = await Team.findById(doc.teamId);
      if (team && (team.owner.toString() === req.user.id || team.members.some(m => m.userId.toString() === req.user.id))) {
        isTeamMember = true;
      }
    }

    const isOwner = doc.owner.toString() === req.user.id;
    const collab = doc.collaborators.find(c => c.userId.toString() === req.user.id);
    const isEditor = collab && collab.role === 'editor';

    if (!isOwner && !isEditor && !isTeamMember) {
      return res.status(401).json({ msg: 'Not authorized to edit' });
    }

    const { title, content } = req.body;
    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });
    if (doc.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only owner can delete this document' });
    }
    await Document.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });
    if (doc.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only owner can add collaborators' });
    }

    const { email, role } = req.body;
    
    // Lookup user by email
    const collabUser = await User.findOne({ email });
    if (!collabUser) return res.status(404).json({ msg: 'User with this email not found' });
    
    const userId = collabUser._id;

    // Check if user already collaborator
    const exists = doc.collaborators.find(c => c.userId && c.userId.toString() === userId.toString());
    if (exists) {
      exists.role = role; // update role
    } else {
      doc.collaborators.push({ userId, role });
    }
    await doc.save();

    // --- REAL-TIME NOTIFICATIONS ---
    const sender = await User.findById(req.user.id);
    const notif = new Notification({
      userId: userId,
      type: 'share',
      title: 'Shared a Document',
      message: `${sender.name} shared "${doc.title}" with you as ${role}`,
      documentId: doc._id,
      fromUser: req.user.id
    });
    await notif.save();

    // Emit to recipient's private room
    const io = req.app.get('io');
    if (io) {
      const roomName = `user_${userId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      const numClients = room ? room.size : 0;
      console.log(`Emitting share notification to ${roomName} (${numClients} clients online)`);
      
      io.to(roomName).emit('new-notification', {
        ...notif.toObject(),
        fromUser: { _id: sender._id, name: sender.name }
      });
    }

    // Send Native Web Push for offline devices
    await sendPushNotification(collabUser, {
      title: notif.title,
      message: notif.message,
      url: `/editor/${doc._id}`
    });
    
    // Return populated doc
    const updatedDoc = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.userId', 'name email');
      
    res.json(updatedDoc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.leaveDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });

    // Owner cannot "leave" — they must delete the document instead
    if (doc.owner.toString() === req.user.id) {
      return res.status(400).json({ msg: 'You are the owner. Delete the document instead.' });
    }

    const before = doc.collaborators.length;
    doc.collaborators = doc.collaborators.filter(
      c => c.userId.toString() !== req.user.id
    );

    if (doc.collaborators.length === before) {
      return res.status(400).json({ msg: 'You are not a collaborator on this document.' });
    }

    await doc.save();
    res.json({ msg: 'You have left the document.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
