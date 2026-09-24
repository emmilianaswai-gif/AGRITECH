package com.example.foodach.ServiceImpl;

import com.example.foodach.Config.TenantContext;
import com.example.foodach.DTO.PaymentResponseDTO;
import com.example.foodach.DTO.WalletSummaryDTO;
import com.example.foodach.Entity.Payment;
import com.example.foodach.Repository.PaymentRepository;
import com.example.foodach.Service.PaymentService;
import com.example.foodach.Service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final List<String> BANKS = List.of(
            "NMB", "CRDB", "NBC", "Equity", "Stanbic", "TPB", "Exim", "DTB", "TIB", "Azania Bank"
    );

    private static boolean isBank(String provider) {
        return provider != null && BANKS.contains(provider.trim());
    }

    private final PaymentRepository paymentRepository;
    private final WalletService walletService;

    private String requireOwnerId() {
        String ownerId = TenantContext.get();
        if (ownerId == null || ownerId.isBlank()) {
            throw new RuntimeException("User identity is required");
        }
        return ownerId;
    }

    private List<Payment> scopedPayments(String ownerId) {
        Long storeId = TenantContext.getStoreId();
        if (storeId != null) {
            Map<Long, Payment> merged = new LinkedHashMap<>();
            for (Payment p : paymentRepository.findByStoreIdOrderByCreatedAtDesc(storeId)) {
                merged.put(p.getId(), p);
            }
            for (Payment p : paymentRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerId)) {
                if (p.getStoreId() == null) {
                    merged.putIfAbsent(p.getId(), p);
                }
            }
            return merged.values().stream()
                    .sorted(Comparator.comparing(Payment::getCreatedAt,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());
        }
        return paymentRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerId);
    }

    private void requireStoreScope(Payment payment) {
        Long storeId = TenantContext.getStoreId();
        if (storeId != null && payment.getStoreId() != null && !storeId.equals(payment.getStoreId())) {
            throw new IllegalArgumentException("Payment not found for that reference");
        }
    }

    @Override
    @Transactional
    public PaymentResponseDTO deposit(Double amount, String provider, String phone,
                                      String accountNumber, String accountName) {
        String ownerId = requireOwnerId();
        validateRequest(amount, provider, phone, accountNumber, accountName);
        Payment payment = new Payment();
        payment.setReference(generateReference());
        payment.setType("DEPOSIT");
        payment.setProvider(provider.trim());
        setRecipient(payment, phone, accountNumber, accountName);
        payment.setAmount(Math.round(amount * 100.0) / 100.0);
        payment.setStatus("PENDING");
        payment.setNote("Waiting for confirmation");
        payment.setCreatedAt(Instant.now());
        payment.setOwnerUserId(ownerId);
        payment.setStoreId(TenantContext.getStoreId());
        return toDTO(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponseDTO payout(Double amount, String provider, String phone,
                                     String accountNumber, String accountName) {
        String ownerId = requireOwnerId();
        validateRequest(amount, provider, phone, accountNumber, accountName);
        WalletSummaryDTO summary = walletService.getSummary();
        if (amount > summary.balance()) {
            throw new IllegalArgumentException("Insufficient wallet balance to send that amount");
        }
        Payment payment = new Payment();
        payment.setReference(generateReference());
        payment.setType("WITHDRAW");
        payment.setProvider(provider.trim());
        setRecipient(payment, phone, accountNumber, accountName);
        payment.setAmount(Math.round(amount * 100.0) / 100.0);
        payment.setStatus("PENDING");
        payment.setNote("Waiting for confirmation");
        payment.setCreatedAt(Instant.now());
        payment.setOwnerUserId(ownerId);
        payment.setStoreId(TenantContext.getStoreId());
        return toDTO(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponseDTO confirm(String reference) {
        Payment payment = findPayment(reference);
        String ownerId = requireOwnerId();
        if (!ownerId.equals(payment.getOwnerUserId())) {
            throw new IllegalArgumentException("Payment not found for that reference");
        }
        requireStoreScope(payment);
        if ("COMPLETED".equals(payment.getStatus())) {
            return toDTO(payment);
        }
        if ("FAILED".equals(payment.getStatus())) {
            throw new IllegalArgumentException("This payment was already cancelled and cannot be confirmed");
        }
        payment.setStatus("COMPLETED");
        payment.setCompletedAt(Instant.now());
        payment.setNote("Completed");
        paymentRepository.save(payment);

        String recipient = recipientLabel(payment);
        if ("DEPOSIT".equals(payment.getType())) {
            walletService.creditDeposit(payment.getAmount(),
                    "Deposit via " + payment.getProvider() + " — " + recipient);
        } else {
            walletService.payout(payment.getAmount(),
                    "Withdrawal to " + payment.getProvider() + " — " + recipient);
        }
        return toDTO(payment);
    }

    @Override
    @Transactional
    public PaymentResponseDTO cancel(String reference) {
        Payment payment = findPayment(reference);
        String ownerId = requireOwnerId();
        if (!ownerId.equals(payment.getOwnerUserId())) {
            throw new IllegalArgumentException("Payment not found for that reference");
        }
        requireStoreScope(payment);
        if (!"PENDING".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Only pending payments can be cancelled");
        }
        payment.setStatus("FAILED");
        payment.setCompletedAt(Instant.now());
        payment.setNote("Cancelled");
        paymentRepository.save(payment);
        return toDTO(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> list() {
        String ownerId = requireOwnerId();
        return scopedPayments(ownerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private Payment findPayment(String reference) {
        if (reference == null || reference.isBlank()) {
            throw new IllegalArgumentException("Payment reference is required");
        }
        return paymentRepository.findByReference(reference.trim())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for that reference"));
    }

    private void validateRequest(Double amount, String provider, String phone,
                                 String accountNumber, String accountName) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("Choose a payment provider");
        }
        if (isBank(provider)) {
            String account = (accountNumber == null ? "" : accountNumber).replaceAll("[^0-9]", "");
            if (account.length() < 6) {
                throw new IllegalArgumentException("Enter a valid bank account number");
            }
            if (accountName == null || accountName.isBlank()) {
                throw new IllegalArgumentException("Enter the bank account holder name");
            }
        } else {
            String digits = (phone == null ? "" : phone).replaceAll("[^0-9]", "");
            if (digits.length() < 9 || digits.length() > 12) {
                throw new IllegalArgumentException("Enter a valid mobile money phone number");
            }
        }
    }

    private void setRecipient(Payment payment, String phone, String accountNumber, String accountName) {
        if (isBank(payment.getProvider())) {
            payment.setAccountNumber(accountNumber == null ? null : accountNumber.trim());
            payment.setAccountName(accountName == null ? null : accountName.trim());
            payment.setPhone(null);
        } else {
            payment.setPhone(phone == null ? null : phone.trim());
            payment.setAccountNumber(null);
            payment.setAccountName(null);
        }
    }

    private String recipientLabel(Payment p) {
        if (isBank(p.getProvider())) {
            String suffix = p.getAccountNumber() == null
                    ? ""
                    : p.getAccountNumber().length() >= 4
                            ? p.getAccountNumber().substring(p.getAccountNumber().length() - 4)
                            : p.getAccountNumber();
            String name = p.getAccountName() == null ? "" : p.getAccountName() + " — ";
            return name + "acct ****" + suffix;
        }
        return p.getPhone() == null ? "" : p.getPhone();
    }

    private String generateReference() {
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private PaymentResponseDTO toDTO(Payment p) {
        return new PaymentResponseDTO(
                p.getId(),
                p.getReference(),
                p.getType(),
                p.getProvider(),
                p.getPhone(),
                p.getAccountNumber(),
                p.getAccountName(),
                p.getAmount(),
                p.getStatus(),
                p.getNote(),
                p.getCreatedAt(),
                p.getCompletedAt()
        );
    }
}
