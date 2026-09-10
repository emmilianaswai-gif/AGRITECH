package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "customer_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inventory_item_id", nullable = false)
    private Long inventoryItemId;

    @Column(name = "item_title", nullable = false)
    private String itemTitle;

    @Column(nullable = false)
    private String customer;

    @Column(name = "customer_user_id")
    private String customerUserId;

    @Column(name = "seller_user_id")
    private String sellerUserId;

    private Double quantity;

    private String unit;

    @Column(name = "unit_price")
    private Double unitPrice;

    @Column(name = "cost_price")
    private Double costPrice;

    @Column(name = "total")
    private Double total;

    private Double profit;

    private String status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_location")
    private String customerLocation;

    private Double latitude;

    private Double longitude;

    @Column(updatable = false)
    private Instant createdAt;
}