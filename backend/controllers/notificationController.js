const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('fromUser', 'name email');
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ msg: 'Notification not found' });
    if (notif.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    notif.read = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const User = require('../models/User');

exports.subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Check if subscription already exists
    const exists = user.pushSubscriptions?.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      if (!user.pushSubscriptions) user.pushSubscriptions = [];
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    
    res.status(201).json({ msg: 'Subscribed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getVapidKey = (req, res) => {
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY || 'BCatzCjIlpC2K98QvdBL8K6lBl8If7SEFaaUkqh4jp-v5EzOvYbTHjzgaZf9Q37uqFpgMLs-i_h7E6sNuEpE4u0';
  res.json({ publicKey: publicVapidKey });
};
