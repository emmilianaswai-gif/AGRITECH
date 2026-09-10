package com.example.foodach.Service;

import com.example.foodach.DTO.WalletSummaryDTO;
import com.example.foodach.DTO.WalletTransactionDTO;

import java.util.List;

public interface WalletService {
    List<WalletTransactionDTO> getTransactions();
    WalletSummaryDTO getSummary();
    void creditOrder(Long orderId, double amount, String category, String description);
    void refundOrder(Long orderId, double amount, String description);
    void reverseOrder(Long orderId);
    boolean wasCredited(Long orderId);
    void creditDeposit(Double amount, String description);
    void payout(Double amount, String description);
    WalletTransactionDTO withdraw(Double amount, String method);
}