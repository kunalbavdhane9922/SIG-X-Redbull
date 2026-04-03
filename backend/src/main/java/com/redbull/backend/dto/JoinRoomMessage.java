package com.redbull.backend.dto;

import lombok.Data;

@Data
public class JoinRoomMessage {
    private String teamId;
    private String roomId;
}
