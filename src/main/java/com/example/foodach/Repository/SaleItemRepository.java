package com.example.foodach.Repository;

import com.example.foodach.Entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findByOwnerUserId(String ownerUserId);
}
