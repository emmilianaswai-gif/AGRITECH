package com.example.foodach.DTO;

public record PaymentRequestDTO(
        Double amount,
        String provider,
        String phone,
        String accountNumber,
        String accountName
) {
}