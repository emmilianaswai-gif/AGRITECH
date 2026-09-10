package com.example.foodach.DTO;

public record WalletSummaryDTO(
        Double balance,
        Double moneyIn,
        Double moneyOut,
        Long transactionCount
) {
}