package com.redbull.backend.controller;

import com.redbull.backend.dto.*;
import com.redbull.backend.model.Participant;
import com.redbull.backend.repository.ParticipantRepository;
import com.redbull.backend.service.CodeEvaluatorService;
import com.redbull.backend.service.GameManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.*;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final SimpMessagingTemplate messaging;
    private final GameManagerService gameManager;
    private final CodeEvaluatorService codeEvaluator;
    private final ParticipantRepository participantRepo;

    @MessageMapping("/join")
    public void joinRoom(JoinRoomMessage msg) {
        String roomId = msg.getRoomId();
        String teamId = msg.getTeamId();

        if (!gameManager.roomExists(roomId)) {
            sendToTeam(roomId, teamId, "ERROR", Map.of("message", "Room not found"));
            return;
        }

        if (!"WAITING".equals(gameManager.getRoomState(roomId))) {
            sendToTeam(roomId, teamId, "ERROR", Map.of("message", "Game in progress"));
            return;
        }

        if (!participantRepo.existsByTeamIdAndRoomId(teamId, roomId)) {
            if (!gameManager.addParticipant(roomId, teamId)) {
                sendToTeam(roomId, teamId, "ERROR", Map.of("message", "Team name taken"));
                return;
            }
            participantRepo.save(new Participant(null, teamId, roomId));
        }

        sendToTeam(roomId, teamId, "JOIN_OK", Map.of("teamId", teamId, "roomId", roomId));

        List<String> participants = gameManager.getParticipants(roomId);
        broadcastToRoom(roomId, "PARTICIPANT_LIST", Map.of(
            "participants", participants,
            "count", participants.size()
        ));
    }

    @MessageMapping("/start")
    public void startGame(@Payload Map<String, String> payload) {
        String roomId = payload.get("roomId");

        if (!gameManager.roomExists(roomId)) return;
        if (!gameManager.startGame(roomId)) return;

        broadcastToRoom(roomId, "GAME_START", Map.of("message", "Compete. Solve. Win."));

        CodeEvaluatorService.StageConfig stage1 = CodeEvaluatorService.STAGES.get(0);
        broadcastToRoom(roomId, "QUESTION_DATA", Map.of(
            "stage", 1,
            "riddle", stage1.riddleText(),
            "template", "// write your code here", // No function signature as requested
            "totalStages", CodeEvaluatorService.STAGES.size()
        ));
    }

    @MessageMapping("/submit")
    public void submitCode(SubmitCodeMessage msg) {
        String roomId = msg.getRoomId();
        String teamId = msg.getTeamId();
        int stage = msg.getStage();
        String code = msg.getCode();
        String lang = msg.getLanguage(); // Handle Java/C++ choice

        if (!gameManager.roomExists(roomId)) return;
        if (!"STARTED".equals(gameManager.getRoomState(roomId))) return;

        // Try evaluation
        boolean passed = false;
        try {
            // If it's Java, we can try to compile but we need a method signature.
            // If the user didn't write it, compilation will fail.
            // We then fallback to heuristic validation which always works for both.
            passed = codeEvaluator.evaluate(stage, code); 
            if (!passed) {
                passed = codeEvaluator.heuristicEvaluate(stage, code);
            }
        } catch (Exception e) {
            passed = codeEvaluator.heuristicEvaluate(stage, code);
        }

        if (passed) {
            int digit = CodeEvaluatorService.STAGES.get(stage - 1).digit();
            gameManager.recordDigit(roomId, teamId, stage, digit);

            sendToTeam(roomId, teamId, "RESULT", Map.of(
                "teamId", teamId,
                "stage", stage,
                "passed", true,
                "digit", digit
            ));

            broadcastToRoom(roomId, "TEAM_PROGRESS", Map.of("teamId", teamId, "stage", stage));

            int nextStageIdx = stage;
            if (nextStageIdx < CodeEvaluatorService.STAGES.size()) {
                CodeEvaluatorService.StageConfig next = CodeEvaluatorService.STAGES.get(nextStageIdx);
                sendToTeam(roomId, teamId, "QUESTION_DATA", Map.of(
                    "stage", nextStageIdx + 1,
                    "riddle", next.riddleText(),
                    "template", "// write your code here",
                    "totalStages", CodeEvaluatorService.STAGES.size()
                ));
            } else {
                List<Integer> digits = gameManager.getDigits(roomId, teamId);
                sendToTeam(roomId, teamId, "GAME_END", Map.of(
                    "teamId", teamId,
                    "values", Map.of("X", digits.get(0), "Y", digits.get(1))
                ));
                broadcastToRoom(roomId, "TEAM_FINISHED", Map.of("teamId", teamId));
            }
        } else {
            sendToTeam(roomId, teamId, "RESULT", Map.of(
                "teamId", teamId,
                "stage", stage,
                "passed", false,
                "message", "Logic mismatch. Examine the riddle closely."
            ));
        }
    }

    private void broadcastToRoom(String roomId, String type, Object payload) {
        messaging.convertAndSend("/topic/room/" + roomId, new ServerEvent(type, payload));
    }

    private void sendToTeam(String roomId, String teamId, String type, Object payload) {
        messaging.convertAndSend("/topic/room/" + roomId + "/team/" + teamId, new ServerEvent(type, payload));
    }
}
