package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "admin_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String category;

    private String supplier;

    @Column(name = "is_own_produce")
    private Boolean ownProduce;

    @Column(name = "cost_price")
    private Double costPrice;

    @Column(name = "selling_price")
    private Double sellingPrice;

    private Double quantity;

    private String unit;

    @Column(updatable = false)
    private Instant createdAt;

    @Column(name = "owner_user_id")
    private String ownerUserId;
}