package com.example.foodach.Controller;

import com.example.foodach.DTO.PaymentRequestDTO;
import com.example.foodach.DTO.PaymentResponseDTO;
import com.example.foodach.DTO.WalletSummaryDTO;
import com.example.foodach.DTO.WalletTransactionDTO;
import com.example.foodach.DTO.WithdrawRequestDTO;
import com.example.foodach.Service.PaymentService;
import com.example.foodach.Service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final PaymentService paymentService;

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionDTO>> getTransactions() {
        return ResponseEntity.ok(walletService.getTransactions());
    }

    @GetMapping("/summary")
    public ResponseEntity<WalletSummaryDTO> getSummary() {
        return ResponseEntity.ok(walletService.getSummary());
    }

    @PostMapping("/withdraw")
    public ResponseEntity<WalletTransactionDTO> withdraw(@RequestBody WithdrawRequestDTO requestDTO) {
        return ResponseEntity.ok(walletService.withdraw(requestDTO.amount(), requestDTO.method()));
    }

    @PostMapping("/deposit")
    public ResponseEntity<PaymentResponseDTO> deposit(@RequestBody PaymentRequestDTO requestDTO) {
        return ResponseEntity.ok(paymentService.deposit(
                requestDTO.amount(), requestDTO.provider(), requestDTO.phone(),
                requestDTO.accountNumber(), requestDTO.accountName()));
    }

    @PostMapping("/payout")
    public ResponseEntity<PaymentResponseDTO> payout(@RequestBody PaymentRequestDTO requestDTO) {
        return ResponseEntity.ok(paymentService.payout(
                requestDTO.amount(), requestDTO.provider(), requestDTO.phone(),
                requestDTO.accountNumber(), requestDTO.accountName()));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentResponseDTO>> getPayments() {
        return ResponseEntity.ok(paymentService.list());
    }

    @PostMapping("/payments/{reference}/confirm")
    public ResponseEntity<PaymentResponseDTO> confirmPayment(@PathVariable String reference) {
        return ResponseEntity.ok(paymentService.confirm(reference));
    }

    @PostMapping("/payments/{reference}/cancel")
    public ResponseEntity<PaymentResponseDTO> cancelPayment(@PathVariable String reference) {
        return ResponseEntity.ok(paymentService.cancel(reference));
    }
}