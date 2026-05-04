const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.get('/:documentId/messages', auth, chatController.getMessages);

module.exports = router;
