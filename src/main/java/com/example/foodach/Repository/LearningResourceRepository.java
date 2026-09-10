package com.example.foodach.Repository;

import com.example.foodach.Entity.LearningResource;
import com.example.foodach.Entity.LearningResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningResourceRepository extends JpaRepository<LearningResource, Long> {
    List<LearningResource> findByType(LearningResourceType type);
}