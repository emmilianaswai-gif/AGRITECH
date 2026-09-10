package com.example.foodach.DTO;

public record TechnicalSupportRequest(
        String name,
        String contact,
        String phone,
        String email,
        String category,
        String description,
        String role,
        String userId
) {
}