package com.redbull.backend.dto;

import lombok.Data;

@Data
public class SubmitCodeMessage {
    private String teamId;
    private String roomId;
    private String code;
    private int stage;
    private String language; // 'java' or 'cpp'
}
