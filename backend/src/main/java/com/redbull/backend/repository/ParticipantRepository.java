package com.redbull.backend.repository;

import com.redbull.backend.model.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    List<Participant> findByRoomId(String roomId);
    Optional<Participant> findByTeamIdAndRoomId(String teamId, String roomId);
    boolean existsByTeamIdAndRoomId(String teamId, String roomId);
}
