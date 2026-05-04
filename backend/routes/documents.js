const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');

router.post('/', auth, documentController.createDocument);
router.get('/', auth, documentController.getDocuments);
router.get('/:id', auth, documentController.getDocumentById);
router.put('/:id', auth, documentController.updateDocument);
router.delete('/:id', auth, documentController.deleteDocument);
router.post('/:id/collaborators', auth, documentController.addCollaborator);

module.exports = router;
