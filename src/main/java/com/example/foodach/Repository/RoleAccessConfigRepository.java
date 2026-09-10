package com.example.foodach.Repository;

import com.example.foodach.Entity.RoleAccessConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleAccessConfigRepository extends JpaRepository<RoleAccessConfig, Long> {
    Optional<RoleAccessConfig> findByRole(String role);
    boolean existsByRole(String role);
    void deleteByRole(String role);
}