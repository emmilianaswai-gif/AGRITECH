package com.example.foodach.DTO;

public record ConversationDTO(
        String partnerId,
        String partnerName,
        String partnerRole,
        String lastMessage,
        String lastTime
) {
}