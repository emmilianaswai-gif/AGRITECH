package com.example.foodach.DTO;

public record MessageRequestDTO(
        String senderId,
        String receiverId,
        String content
) {
}