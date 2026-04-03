/**
 * WebSocket Game Handler — equivalent to GameController.java
 * 
 * STOMP Destinations (exact parity):
 *   /app/join    — Join a room (JoinRoomMessage)
 *   /app/start   — Start the game (payload: { roomId })
 *   /app/submit  — Submit code (SubmitCodeMessage)
 * 
 * Broadcast topics:
 *   /topic/room/{roomId}                — Room-wide events
 *   /topic/room/{roomId}/team/{teamId}  — Team-specific events
 * 
 * Event types (ServerEvent): GAME_START, QUESTION_DATA, RESULT, GAME_END,
 *   PARTICIPANT_LIST, JOIN_OK, ERROR, TEAM_PROGRESS, TEAM_FINISHED
 */

const gameManager = require('../services/gameManager');
const codeEvaluator = require('../services/codeEvaluator');
const { participantRepo } = require('../db/database');

/**
 * Initialize the STOMP game handler.
 * @param {object} stompServer — instance of stomp-broker-js
 */
function init(stompServer) {

  stompServer.on('subscribe', () => {
    // Client subscribed — no action needed, mirrors Spring behavior
  });

  stompServer.on('send', (rawMsg) => {
    try {
      const dest = rawMsg.dest || rawMsg.topic;
      const body = typeof rawMsg.body === 'string' ? JSON.parse(rawMsg.body) : rawMsg.body;

      if (dest === '/app/join') {
        handleJoin(stompServer, body);
      } else if (dest === '/app/start') {
        handleStart(stompServer, body);
      } else if (dest === '/app/submit') {
        handleSubmit(stompServer, body);
      }
    } catch (err) {
      console.error('STOMP message handling error:', err.message);
    }
  });
}

// ─── /app/join — mirrors GameController.joinRoom() ───────────────────────────

function handleJoin(stompServer, msg) {
  const { roomId, teamId } = msg;

  if (!gameManager.roomExists(roomId)) {
    sendToTeam(stompServer, roomId, teamId, 'ERROR', { message: 'Room not found' });
    return;
  }

  if (gameManager.getRoomState(roomId) !== 'WAITING') {
    sendToTeam(stompServer, roomId, teamId, 'ERROR', { message: 'Game in progress' });
    return;
  }

  if (!participantRepo.existsByTeamIdAndRoomId(teamId, roomId)) {
    if (!gameManager.addParticipant(roomId, teamId)) {
      sendToTeam(stompServer, roomId, teamId, 'ERROR', { message: 'Team name taken' });
      return;
    }
    participantRepo.save(teamId, roomId);
  }

  sendToTeam(stompServer, roomId, teamId, 'JOIN_OK', { teamId, roomId });

  const participants = gameManager.getParticipants(roomId);
  broadcastToRoom(stompServer, roomId, 'PARTICIPANT_LIST', {
    participants,
    count: participants.length,
  });
}

// ─── /app/start — mirrors GameController.startGame() ─────────────────────────

function handleStart(stompServer, payload) {
  const { roomId } = payload;

  if (!gameManager.roomExists(roomId)) return;
  if (!gameManager.startGame(roomId)) return;

  broadcastToRoom(stompServer, roomId, 'GAME_START', { message: 'Compete. Solve. Win.' });

  const stage1 = codeEvaluator.STAGES[0];
  broadcastToRoom(stompServer, roomId, 'QUESTION_DATA', {
    stage: 1,
    riddle: stage1.riddleText,
    template: '// write your code here',
    totalStages: codeEvaluator.STAGES.length,
  });
}

// ─── /app/submit — mirrors GameController.submitCode() ───────────────────────

function handleSubmit(stompServer, msg) {
  const { roomId, teamId, code, stage, language } = msg;

  if (!gameManager.roomExists(roomId)) return;
  if (gameManager.getRoomState(roomId) !== 'STARTED') return;

  // Try evaluation (mirrors Java: try compile, fallback to heuristic)
  let passed = false;
  try {
    passed = codeEvaluator.evaluate(stage, code);
    if (!passed) {
      passed = codeEvaluator.heuristicEvaluate(stage, code);
    }
  } catch (e) {
    passed = codeEvaluator.heuristicEvaluate(stage, code);
  }

  if (passed) {
    const digit = codeEvaluator.STAGES[stage - 1].digit;
    gameManager.recordDigit(roomId, teamId, stage, digit);

    sendToTeam(stompServer, roomId, teamId, 'RESULT', {
      teamId,
      stage,
      passed: true,
      digit,
    });

    broadcastToRoom(stompServer, roomId, 'TEAM_PROGRESS', { teamId, stage });

    const nextStageIdx = stage;
    if (nextStageIdx < codeEvaluator.STAGES.length) {
      const next = codeEvaluator.STAGES[nextStageIdx];
      sendToTeam(stompServer, roomId, teamId, 'QUESTION_DATA', {
        stage: nextStageIdx + 1,
        riddle: next.riddleText,
        template: '// write your code here',
        totalStages: codeEvaluator.STAGES.length,
      });
    } else {
      const digits = gameManager.getDigits(roomId, teamId);
      sendToTeam(stompServer, roomId, teamId, 'GAME_END', {
        teamId,
        values: { X: digits[0], Y: digits[1] },
      });
      broadcastToRoom(stompServer, roomId, 'TEAM_FINISHED', { teamId });
    }
  } else {
    sendToTeam(stompServer, roomId, teamId, 'RESULT', {
      teamId,
      stage,
      passed: false,
      message: 'Logic mismatch. Examine the riddle closely.',
    });
  }
}

// ─── Helpers — mirror GameController private methods ─────────────────────────

function broadcastToRoom(stompServer, roomId, type, payload) {
  const dest = `/topic/room/${roomId}`;
  stompServer.send(dest, {}, JSON.stringify({ type, payload }));
}

function sendToTeam(stompServer, roomId, teamId, type, payload) {
  const dest = `/topic/room/${roomId}/team/${teamId}`;
  stompServer.send(dest, {}, JSON.stringify({ type, payload }));
}

module.exports = { init };
