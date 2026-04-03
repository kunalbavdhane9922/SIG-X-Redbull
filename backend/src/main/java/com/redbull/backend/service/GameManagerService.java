package com.redbull.backend.service;

import com.redbull.backend.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameManagerService {

    // roomId -> list of teamIds
    private final Map<String, List<String>> roomParticipants = new ConcurrentHashMap<>();
    // roomId -> game state (WAITING, STARTED, ENDED)
    private final Map<String, String> roomStates = new ConcurrentHashMap<>();
    // roomId -> organizer username
    private final Map<String, String> roomOrganizers = new ConcurrentHashMap<>();
    // roomId -> stage results per team: teamId -> [digit1, digit2]
    private final Map<String, Map<String, List<Integer>>> roomResults = new ConcurrentHashMap<>();

    public boolean createRoom(String roomId, String organizer) {
        if (roomParticipants.containsKey(roomId)) return false;
        roomParticipants.put(roomId, new ArrayList<>());
        roomStates.put(roomId, "WAITING");
        roomOrganizers.put(roomId, organizer);
        roomResults.put(roomId, new ConcurrentHashMap<>());
        return true;
    }

    public boolean roomExists(String roomId) {
        return roomParticipants.containsKey(roomId);
    }

    public String getRoomState(String roomId) {
        return roomStates.getOrDefault(roomId, "UNKNOWN");
    }

    public boolean addParticipant(String roomId, String teamId) {
        if (!roomParticipants.containsKey(roomId)) return false;
        List<String> teams = roomParticipants.get(roomId);
        if (teams.contains(teamId)) return false;
        if (!"WAITING".equals(roomStates.get(roomId))) return false;
        teams.add(teamId);
        teams.sort(String::compareTo);
        return true;
    }

    public List<String> getParticipants(String roomId) {
        return roomParticipants.getOrDefault(roomId, new ArrayList<>());
    }

    public boolean startGame(String roomId) {
        if (!"WAITING".equals(roomStates.get(roomId))) return false;
        roomStates.put(roomId, "STARTED");
        return true;
    }

    public void recordDigit(String roomId, String teamId, int stage, int digit) {
        Map<String, List<Integer>> results = roomResults.get(roomId);
        if (results == null) return;
        results.computeIfAbsent(teamId, k -> new ArrayList<>(Arrays.asList(null, null)));
        results.get(teamId).set(stage - 1, digit);
    }

    public List<Integer> getDigits(String roomId, String teamId) {
        Map<String, List<Integer>> results = roomResults.get(roomId);
        if (results == null) return List.of();
        return results.getOrDefault(teamId, new ArrayList<>());
    }

    public void endRoom(String roomId) {
        roomStates.put(roomId, "ENDED");
    }
}
