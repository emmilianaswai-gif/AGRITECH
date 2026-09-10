package com.example.foodach.Repository;

import com.example.foodach.Entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findAllByOrderByCreatedAtDesc();

    boolean existsByOrderIdAndDirection(Long orderId, String direction);

    void deleteByOrderId(Long orderId);
}