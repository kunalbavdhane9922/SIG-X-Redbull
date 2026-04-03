package com.redbull.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private String teamId;

    @Column(name = "room_id", nullable = false)
    private String roomId;
}
