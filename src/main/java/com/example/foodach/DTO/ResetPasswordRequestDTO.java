package com.example.foodach.DTO;

public record ResetPasswordRequestDTO(
        String identifier,
        String code,
        String newPassword
) {
}