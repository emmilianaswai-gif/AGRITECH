package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "\"order\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String phoneNumber;
    private String email;
    private String address;
    private String city;
    private String state;
    private String Category;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    public enum OrderStatus {PENDING, APPROVED, REJECTED}
}
