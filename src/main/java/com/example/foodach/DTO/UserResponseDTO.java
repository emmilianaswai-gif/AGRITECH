package com.example.foodach.DTO;

public record UserResponseDTO(
        String id,
        String fullName,
        String email,
        String password,
        String phoneNumber,
        String address,
        String location,
        String role,
        Boolean mustChangePassword
) {}