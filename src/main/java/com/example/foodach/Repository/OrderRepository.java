package com.example.foodach.Repository;

import com.example.foodach.Entity.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByPhoneNumber(String phoneNumber, Pageable pageable);
    List<Order> findByStatus(Order.OrderStatus status);
}
