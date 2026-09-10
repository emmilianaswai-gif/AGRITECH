package com.example.foodach.Service;

import com.example.foodach.DTO.PaymentResponseDTO;

import java.util.List;

public interface PaymentService {
    PaymentResponseDTO deposit(Double amount, String provider, String phone,
                              String accountNumber, String accountName);
    PaymentResponseDTO payout(Double amount, String provider, String phone,
                              String accountNumber, String accountName);
    PaymentResponseDTO confirm(String reference);
    PaymentResponseDTO cancel(String reference);
    List<PaymentResponseDTO> list();
}