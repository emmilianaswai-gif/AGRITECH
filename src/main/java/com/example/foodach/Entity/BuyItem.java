package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "buy_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuyItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double quantity;

    private String unit;

    @Column(name = "unit_price")
    private Double unitPrice;

    private String supplier;

    private String status;

    @Column(updatable = false)
    private Instant createdAt;

    @Column(name = "owner_user_id")
    private String ownerUserId;

    @Column(name = "store_id")
    private Long storeId;
}