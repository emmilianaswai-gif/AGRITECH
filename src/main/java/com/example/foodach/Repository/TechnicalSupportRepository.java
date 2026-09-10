package com.example.foodach.Repository;

import com.example.foodach.Entity.TechnicalSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicalSupportRepository extends JpaRepository<TechnicalSupport, Long> {
    List<TechnicalSupport> findAllByOrderByCreatedAtDesc();
}