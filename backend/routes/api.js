/**
 * REST API Routes — equivalent to RoomController.java
 * 
 * Endpoints (exact parity):
 *   POST /api/login          — Organizer login
 *   POST /api/rooms/create   — Create a new game room
 *   GET  /api/rooms/:roomId  — Check if room exists (participant validation)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { userRepo, roomRepo } = require('../db/database');
const gameManager = require('../services/gameManager');

const router = express.Router();

/**
 * POST /api/login
 * Request:  { username, password }
 * Response: { success: true, username } | { success: false, message }
 * 
 * Mirrors: RoomController.login()
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = userRepo.findByUsernameAndPassword(username, password);

  if (user) {
    return res.status(200).json({ success: true, username: user.username });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

/**
 * POST /api/rooms/create
 * Request:  { organizer }
 * Response: { success: true, roomId } | { success: false, message }
 * 
 * Mirrors: RoomController.createRoom()
 */
router.post('/rooms/create', (req, res) => {
  const organizer = req.body.organizer || 'admin';
  const roomId = uuidv4().substring(0, 6).toUpperCase();

  const created = gameManager.createRoom(roomId, organizer);
  if (!created) {
    return res.status(400).json({ success: false, message: 'Could not create room' });
  }

  roomRepo.save(roomId, organizer);
  return res.status(200).json({ success: true, roomId });
});

/**
 * GET /api/rooms/:roomId
 * Response: { exists: true, state, participants } | { exists: false }
 * 
 * Mirrors: RoomController.getRoom()
 */
router.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;

  if (!gameManager.roomExists(roomId)) {
    return res.status(404).json({ exists: false });
  }

  return res.status(200).json({
    exists: true,
    state: gameManager.getRoomState(roomId),
    participants: gameManager.getParticipants(roomId),
  });
});

module.exports = router;
