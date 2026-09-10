package com.example.foodach.DTO;

public record MessageResponseDTO(
        String id,
        String senderId,
        String receiverId,
        String senderName,
        String receiverName,
        String content,
        String createdAt
) {
}