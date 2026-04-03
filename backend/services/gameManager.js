/**
 * GameManagerService — In-memory room state management
 * 
 * Direct port of GameManagerService.java.
 * Uses JS Map instead of ConcurrentHashMap (Node.js is single-threaded).
 * 
 * State maps:
 *   roomParticipants: roomId -> [teamId, ...]
 *   roomStates:       roomId -> 'WAITING' | 'STARTED' | 'ENDED'
 *   roomOrganizers:   roomId -> organizer username
 *   roomResults:      roomId -> { teamId: [digit1, digit2] }
 */

// roomId -> list of teamIds
const roomParticipants = new Map();
// roomId -> game state
const roomStates = new Map();
// roomId -> organizer username
const roomOrganizers = new Map();
// roomId -> { teamId -> [digit1, digit2] }
const roomResults = new Map();

function createRoom(roomId, organizer) {
  if (roomParticipants.has(roomId)) return false;
  roomParticipants.set(roomId, []);
  roomStates.set(roomId, 'WAITING');
  roomOrganizers.set(roomId, organizer);
  roomResults.set(roomId, new Map());
  return true;
}

function roomExists(roomId) {
  return roomParticipants.has(roomId);
}

function getRoomState(roomId) {
  return roomStates.get(roomId) || 'UNKNOWN';
}

function addParticipant(roomId, teamId) {
  if (!roomParticipants.has(roomId)) return false;
  const teams = roomParticipants.get(roomId);
  if (teams.includes(teamId)) return false;
  if (roomStates.get(roomId) !== 'WAITING') return false;
  teams.push(teamId);
  teams.sort(); // String::compareTo equivalent
  return true;
}

function getParticipants(roomId) {
  return roomParticipants.get(roomId) || [];
}

function startGame(roomId) {
  if (roomStates.get(roomId) !== 'WAITING') return false;
  roomStates.set(roomId, 'STARTED');
  return true;
}

function recordDigit(roomId, teamId, stage, digit) {
  const results = roomResults.get(roomId);
  if (!results) return;
  if (!results.has(teamId)) {
    results.set(teamId, [null, null]);
  }
  results.get(teamId)[stage - 1] = digit;
}

function getDigits(roomId, teamId) {
  const results = roomResults.get(roomId);
  if (!results) return [];
  return results.get(teamId) || [];
}

function endRoom(roomId) {
  roomStates.set(roomId, 'ENDED');
}

module.exports = {
  createRoom,
  roomExists,
  getRoomState,
  addParticipant,
  getParticipants,
  startGame,
  recordDigit,
  getDigits,
  endRoom,
};
