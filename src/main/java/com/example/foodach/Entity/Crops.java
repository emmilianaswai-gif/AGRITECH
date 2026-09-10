package com.example.foodach.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "crops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Crops {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String category;
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "crop_planting_months", joinColumns = @JoinColumn(name = "crop_id"))
    @Column(name = "planting_month")
    private List<Season> seasons;

    private Integer maturityDays;

    @Column(name = "is_dry_season_tolerant")
    private Boolean isDrySeasonTolerant;

    @Column(columnDefinition = "TEXT")
    private String seasonalAdvice;
}
