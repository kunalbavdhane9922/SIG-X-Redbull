package com.redbull.backend.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServerEvent {
    private String type;       // GAME_START, QUESTION_DATA, RESULT, GAME_END, PARTICIPANT_LIST
    private Object payload;
}
