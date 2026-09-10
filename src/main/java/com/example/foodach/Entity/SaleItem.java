package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sale_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaleItem {

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

    @Column(name = "market_price")
    private Double marketPrice;

    @Column(name = "fee_percent")
    private Double feePercent;

    private String status;

    @Column(updatable = false)
    private Instant createdAt;
}