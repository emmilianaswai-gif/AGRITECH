package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sms_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SmsMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fromName;

    private String toName;

    @Column(nullable = false)
    private String toPhone;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    private String status;

    private String provider;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}