package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.WalletSummaryDTO;
import com.example.foodach.DTO.WalletTransactionDTO;
import com.example.foodach.Entity.WalletTransaction;
import com.example.foodach.Repository.WalletTransactionRepository;
import com.example.foodach.Service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletTransactionRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionDTO> getTransactions() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WalletSummaryDTO getSummary() {
        List<WalletTransaction> all = repository.findAll();
        double moneyIn = 0, moneyOut = 0;
        for (WalletTransaction t : all) {
            double amount = t.getAmount() == null ? 0.0 : t.getAmount();
            if ("IN".equalsIgnoreCase(t.getDirection())) {
                moneyIn += amount;
            } else {
                moneyOut += amount;
            }
        }
        return new WalletSummaryDTO(
                Math.round((moneyIn - moneyOut) * 100.0) / 100.0,
                Math.round(moneyIn * 100.0) / 100.0,
                Math.round(moneyOut * 100.0) / 100.0,
                (long) all.size()
        );
    }

    @Override
    @Transactional
    public void creditOrder(Long orderId, double amount, String category, String description) {
        if (repository.existsByOrderIdAndDirection(orderId, "IN")) {
            return;
        }
        WalletTransaction t = new WalletTransaction();
        t.setDirection("IN");
        t.setCategory(category);
        t.setDescription(description);
        t.setAmount(Math.round(amount * 100.0) / 100.0);
        t.setOrderId(orderId);
        t.setCreatedAt(Instant.now());
        repository.save(t);
    }

    @Override
    @Transactional
    public void refundOrder(Long orderId, double amount, String description) {
        WalletTransaction t = new WalletTransaction();
        t.setDirection("OUT");
        t.setCategory("REFUND");
        t.setDescription(description);
        t.setAmount(Math.round(amount * 100.0) / 100.0);
        t.setOrderId(orderId);
        t.setCreatedAt(Instant.now());
        repository.save(t);
    }

    @Override
    @Transactional
    public void reverseOrder(Long orderId) {
        repository.deleteByOrderId(orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean wasCredited(Long orderId) {
        return repository.existsByOrderIdAndDirection(orderId, "IN");
    }

    @Override
    @Transactional
    public void creditDeposit(Double amount, String description) {
        WalletTransaction t = new WalletTransaction();
        t.setDirection("IN");
        t.setCategory("DEPOSIT");
        t.setDescription(description);
        t.setAmount(Math.round(amount * 100.0) / 100.0);
        t.setCreatedAt(Instant.now());
        repository.save(t);
    }

    @Override
    @Transactional
    public void payout(Double amount, String description) {
        WalletSummaryDTO summary = getSummary();
        if (amount > summary.balance()) {
            throw new IllegalArgumentException("Insufficient wallet balance to send that amount");
        }
        WalletTransaction t = new WalletTransaction();
        t.setDirection("OUT");
        t.setCategory("WITHDRAW");
        t.setDescription(description);
        t.setAmount(Math.round(amount * 100.0) / 100.0);
        t.setCreatedAt(Instant.now());
        repository.save(t);
    }

    @Override
    @Transactional
    public WalletTransactionDTO withdraw(Double amount, String method) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero");
        }
        WalletSummaryDTO summary = getSummary();
        if (amount > summary.balance()) {
            throw new IllegalArgumentException("Insufficient wallet balance to withdraw that amount");
        }
        String label = method == null || method.isBlank() ? "Cash" : method.trim();
        WalletTransaction t = new WalletTransaction();
        t.setDirection("OUT");
        t.setCategory("WITHDRAW");
        t.setDescription("Withdrawal — " + label);
        t.setAmount(Math.round(amount * 100.0) / 100.0);
        t.setCreatedAt(Instant.now());
        return toDTO(repository.save(t));
    }

    private WalletTransactionDTO toDTO(WalletTransaction t) {
        return new WalletTransactionDTO(
                t.getId(),
                t.getDirection(),
                t.getCategory(),
                t.getDescription(),
                t.getAmount(),
                t.getOrderId(),
                t.getCreatedAt()
        );
    }
}