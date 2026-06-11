const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  inviteMember,
  removeMember,
  getTeamDocuments,
  createTeamDocument
} = require('../controllers/teamController');

router.use(auth);

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/members', inviteMember);
router.delete('/:id/members/me', removeMember);
router.get('/:id/documents', getTeamDocuments);
router.post('/:id/documents', createTeamDocument);

module.exports = router;
