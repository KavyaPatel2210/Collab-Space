const Team = require('../models/Team');
const User = require('../models/User');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

// POST /api/teams
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    const team = new Team({
      name,
      description: description || '',
      owner: ownerId,
      members: [{ userId: ownerId, role: 'admin' }]
    });

    await team.save();
    res.status(201).json(team);
  } catch (err) {
    console.error('createTeam error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// GET /api/teams
exports.getTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await Team.find({
      $or: [
        { owner: userId },
        { 'members.userId': userId }
      ]
    }).populate('members.userId', 'name email');

    res.json(teams);
  } catch (err) {
    console.error('getTeams error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// GET /api/teams/:id
exports.getTeamById = async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findById(req.params.id).populate('members.userId', 'name email');

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    const isMember = team.members.some(
      m => m.userId && m.userId._id.toString() === userId
    ) || team.owner.toString() === userId;

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(team);
  } catch (err) {
    console.error('getTeamById error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// PUT /api/teams/:id
exports.updateTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    const isOwner = team.owner.toString() === userId;
    const isAdmin = team.members.some(
      m => m.userId && m.userId.toString() === userId && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: 'Only admin or owner can update team' });
    }

    const { name, description } = req.body;
    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();
    res.json(team);
  } catch (err) {
    console.error('updateTeam error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// DELETE /api/teams/:id
exports.deleteTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    if (team.owner.toString() !== userId) {
      return res.status(403).json({ msg: 'Only owner can delete team' });
    }

    // Delete all documents belonging to this team
    await Document.deleteMany({ teamId: team._id });

    await Team.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Team and associated documents deleted' });
  } catch (err) {
    console.error('deleteTeam error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// POST /api/teams/:id/members
exports.inviteMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, role } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    const isOwner = team.owner.toString() === userId;
    const isAdmin = team.members.some(
      m => m.userId && m.userId.toString() === userId && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: 'Only admin or owner can invite members' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ msg: 'User with that email not found' });
    }

    const alreadyMember = team.members.some(
      m => m.userId && m.userId.toString() === invitedUser._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ msg: 'User is already a member of this team' });
    }

    team.members.push({ userId: invitedUser._id, role: role || 'member' });
    await team.save();

    // Create notification
    const notif = new Notification({
      userId: invitedUser._id,
      type: 'share',
      title: 'Team Invitation',
      message: `You have been invited to join team: ${team.name}`,
      fromUser: userId
    });
    await notif.save();

    // Emit via socket
    const io = req.app.get('io');
    io.to(`user_${invitedUser._id}`).emit('new-notification', notif);

    const updatedTeam = await Team.findById(team._id).populate('members.userId', 'name email');
    res.json(updatedTeam);
  } catch (err) {
    console.error('inviteMember error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// DELETE /api/teams/:id/members/me
exports.removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    if (team.owner.toString() === userId) {
      return res.status(400).json({ msg: 'Owner cannot leave the team. Transfer ownership or delete the team instead.' });
    }

    team.members = team.members.filter(
      m => !m.userId || m.userId.toString() !== userId
    );

    await team.save();
    res.json({ msg: 'You have left the team' });
  } catch (err) {
    console.error('removeMember error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// GET /api/teams/:id/documents
exports.getTeamDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    const isMember = team.members.some(
      m => m.userId && m.userId.toString() === userId
    ) || team.owner.toString() === userId;

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const documents = await Document.find({ teamId: req.params.id }).populate('owner', 'name');
    res.json(documents);
  } catch (err) {
    console.error('getTeamDocuments error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// POST /api/teams/:id/documents
exports.createTeamDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    const isMember = team.members.some(
      m => m.userId && m.userId.toString() === userId
    ) || team.owner.toString() === userId;

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const document = new Document({
      title: req.body.title || 'Untitled Document',
      content: '',
      owner: userId,
      collaborators: [],
      teamId: req.params.id
    });

    await document.save();
    res.status(201).json(document);
  } catch (err) {
    console.error('createTeamDocument error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
