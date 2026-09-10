package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "learning_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LearningResourceType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(length = 500)
    private String meta;

    private Integer progress;

    private String status;

    @Column(name = "resource_url", length = 1000)
    private String resourceUrl;

    @Column(updatable = false)
    private Instant createdAt;
}