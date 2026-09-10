package com.example.foodach.Entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "role_access")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleAccessConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String role;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_access_services", joinColumns = @JoinColumn(name = "role_access_id"))
    @Column(name = "service_id")
    private List<String> services = new ArrayList<>();
}