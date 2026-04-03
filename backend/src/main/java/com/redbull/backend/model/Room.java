package com.redbull.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @Column(name = "room_id")
    private String roomId;

    @Column(name = "created_by")
    private String createdBy;
}
