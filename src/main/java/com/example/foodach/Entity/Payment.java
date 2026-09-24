package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String phone;

    private String accountNumber;

    private String accountName;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String status;

    private String note;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant completedAt;

    @Column(name = "owner_user_id")
    private String ownerUserId;

    @Column(name = "store_id")
    private Long storeId;
}