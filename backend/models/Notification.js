const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['message', 'share', 'edit'], default: 'message' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
