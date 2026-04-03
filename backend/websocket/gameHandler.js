/**
 * Socket.IO Game Handler
 * 
 * Client → Server events:
 *   join-room    { roomId, teamId, role }
 *   start-game   { roomId }
 *   submit-code  { roomId, teamId, code, stage, language }
 * 
 * Server → Client events:
 *   room-event   { type, payload }   — broadcast to everyone in the room
 *   team-event   { type, payload }   — sent directly to the sender socket
 */

const gameManager = require('../services/gameManager');
const codeEvaluator = require('../services/codeEvaluator');
const { participantRepo } = require('../db/database');

/**
 * Initialize Socket.IO game handler.
 * @param {import('socket.io').Server} io — Socket.IO server instance
 */
function init(io) {

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // ─── join-room ────────────────────────────────────────────────────────
    socket.on('join-room', (msg) => {
      try {
        const { roomId, teamId, role } = msg;

        // ALWAYS join the Socket.IO room so broadcasts reach this client
        socket.join(roomId);

        // Organizers just observe — no participant logic needed
        if (role === 'organizer') {
          console.log(`[WS] Organizer joined room ${roomId}`);
          // Send current participant list immediately so the organizer is up to date
          const participants = gameManager.getParticipants(roomId);
          socket.emit('room-event', {
            type: 'PARTICIPANT_LIST',
            payload: { participants, count: participants.length },
          });
          return;
        }

        // ── Participant join logic ──
        if (!gameManager.roomExists(roomId)) {
          socket.emit('team-event', { type: 'ERROR', payload: { message: 'Room not found' } });
          return;
        }

        if (gameManager.getRoomState(roomId) !== 'WAITING') {
          socket.emit('team-event', { type: 'ERROR', payload: { message: 'Game in progress' } });
          return;
        }

        if (!participantRepo.existsByTeamIdAndRoomId(teamId, roomId)) {
          if (!gameManager.addParticipant(roomId, teamId)) {
            socket.emit('team-event', { type: 'ERROR', payload: { message: 'Team name taken' } });
            return;
          }
          participantRepo.save(teamId, roomId);
        }

        // Store teamId on the socket for later use
        socket.data.teamId = teamId;
        socket.data.roomId = roomId;

        // Confirm join to the participant
        socket.emit('team-event', { type: 'JOIN_OK', payload: { teamId, roomId } });

        // Broadcast updated participant list to EVERYONE in the room (including organizer)
        const participants = gameManager.getParticipants(roomId);
        io.to(roomId).emit('room-event', {
          type: 'PARTICIPANT_LIST',
          payload: { participants, count: participants.length },
        });

        console.log(`[WS] Team "${teamId}" joined room ${roomId} (${participants.length} total)`);

      } catch (err) {
        console.error('[WS] join-room error:', err.message);
      }
    });

    // ─── start-game ───────────────────────────────────────────────────────
    socket.on('start-game', (msg) => {
      try {
        const { roomId } = msg;

        if (!gameManager.roomExists(roomId)) return;
        if (!gameManager.startGame(roomId)) return;

        // Broadcast GAME_START to the entire room
        io.to(roomId).emit('room-event', {
          type: 'GAME_START',
          payload: { message: 'Compete. Solve. Win.' },
        });

        // Broadcast first question to the entire room
        const stage1 = codeEvaluator.STAGES[0];
        io.to(roomId).emit('room-event', {
          type: 'QUESTION_DATA',
          payload: {
            stage: 1,
            riddle: stage1.riddleText,
            template: '// write your code here',
            totalStages: codeEvaluator.STAGES.length,
          },
        });

        console.log(`[WS] Game started in room ${roomId}`);

      } catch (err) {
        console.error('[WS] start-game error:', err.message);
      }
    });

    // ─── submit-code ──────────────────────────────────────────────────────
    socket.on('submit-code', (msg) => {
      try {
        const { roomId, teamId, code, stage, language } = msg;

        if (!gameManager.roomExists(roomId)) return;
        if (gameManager.getRoomState(roomId) !== 'STARTED') return;

        // Evaluate the submitted code
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

          // Send result to the submitting team
          socket.emit('team-event', {
            type: 'RESULT',
            payload: { teamId, stage, passed: true, digit },
          });

          // Broadcast progress to the room (organizer sees this)
          io.to(roomId).emit('room-event', {
            type: 'TEAM_PROGRESS',
            payload: { teamId, stage },
          });

          // Check if there's a next stage
          const nextStageIdx = stage;
          if (nextStageIdx < codeEvaluator.STAGES.length) {
            const next = codeEvaluator.STAGES[nextStageIdx];
            socket.emit('team-event', {
              type: 'QUESTION_DATA',
              payload: {
                stage: nextStageIdx + 1,
                riddle: next.riddleText,
                template: '// write your code here',
                totalStages: codeEvaluator.STAGES.length,
              },
            });
          } else {
            // All stages done
            const digits = gameManager.getDigits(roomId, teamId);
            socket.emit('team-event', {
              type: 'GAME_END',
              payload: { teamId, values: { X: digits[0], Y: digits[1] } },
            });
            io.to(roomId).emit('room-event', {
              type: 'TEAM_FINISHED',
              payload: { teamId },
            });
          }

          console.log(`[WS] Team "${teamId}" passed stage ${stage} in room ${roomId}`);

        } else {
          socket.emit('team-event', {
            type: 'RESULT',
            payload: {
              teamId,
              stage,
              passed: false,
              message: 'Logic mismatch. Examine the riddle closely.',
            },
          });
        }

      } catch (err) {
        console.error('[WS] submit-code error:', err.message);
      }
    });

    // ─── disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id} (${reason})`);
    });
  });
}

module.exports = { init };
