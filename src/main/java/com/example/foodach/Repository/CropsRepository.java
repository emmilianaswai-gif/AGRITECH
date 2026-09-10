package com.example.foodach.Repository;

import com.example.foodach.Entity.Crops;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CropsRepository extends JpaRepository<Crops, Long> {
    Optional<Crops> findByNameIgnoreCase(String name);


}
