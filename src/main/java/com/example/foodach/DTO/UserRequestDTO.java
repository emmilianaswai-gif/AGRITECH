package com.example.foodach.DTO;

public record UserRequestDTO(
        String fullName,
        String email,
        String password,
        String phoneNumber,
        String address,
        String location,
        String role
) {
}