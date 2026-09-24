package com.example.foodach.Repository;

import com.example.foodach.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReference(String reference);
    List<Payment> findByOwnerUserIdOrderByCreatedAtDesc(String ownerUserId);
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByStoreIdOrderByCreatedAtDesc(Long storeId);
}
