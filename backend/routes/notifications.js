const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.getNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.post('/subscribe', auth, notificationController.subscribe);
router.get('/vapid-key', notificationController.getVapidKey);

module.exports = router;
