package com.example.foodach.DTO;

public record WithdrawRequestDTO(
        Double amount,
        String method
) {
}