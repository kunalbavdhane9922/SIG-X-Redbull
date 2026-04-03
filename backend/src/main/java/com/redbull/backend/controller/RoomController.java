package com.redbull.backend.controller;

import com.redbull.backend.model.Room;
import com.redbull.backend.repository.RoomRepository;
import com.redbull.backend.repository.UserRepository;
import com.redbull.backend.service.GameManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepo;
    private final UserRepository userRepo;
    private final GameManagerService gameManager;

    // Organizer login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        return userRepo.findByUsernameAndPassword(username, password)
            .map(u -> ResponseEntity.ok(Map.of("success", true, "username", u.getUsername())))
            .orElse(ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials")));
    }

    // Create room
    @PostMapping("/rooms/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> body) {
        String organizer = body.getOrDefault("organizer", "admin");
        String roomId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        boolean created = gameManager.createRoom(roomId, organizer);
        if (!created) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Could not create room"));
        }
        roomRepo.save(new Room(roomId, organizer));
        return ResponseEntity.ok(Map.of("success", true, "roomId", roomId));
    }

    // Check room exists (for participant validation)
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<?> getRoom(@PathVariable String roomId) {
        if (!gameManager.roomExists(roomId)) {
            return ResponseEntity.status(404).body(Map.of("exists", false));
        }
        return ResponseEntity.ok(Map.of(
            "exists", true,
            "state", gameManager.getRoomState(roomId),
            "participants", gameManager.getParticipants(roomId)
        ));
    }
}
