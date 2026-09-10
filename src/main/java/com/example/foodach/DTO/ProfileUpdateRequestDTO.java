package com.example.foodach.DTO;

public record ProfileUpdateRequestDTO(
        String fullName,
        String email,
        String phoneNumber,
        String address,
        String location
) {
}