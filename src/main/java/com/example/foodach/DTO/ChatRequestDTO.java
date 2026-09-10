package com.example.foodach.DTO;

import java.util.List;

public record ChatRequestDTO(
        String model,
        List<ChatMessageDTO> messages
) {
}