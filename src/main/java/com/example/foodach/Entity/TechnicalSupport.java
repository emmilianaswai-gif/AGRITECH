package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "technical_support")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TechnicalSupport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String contact;

    private String phone;

    private String email;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String role;

    private String userId;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;
}