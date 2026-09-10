package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "password_reset_otp")
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetOtp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String identifier;
    private String code;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant usedAt;
    private Boolean used;
}