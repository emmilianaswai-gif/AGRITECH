package com.example.foodach.Repository;

import com.example.foodach.Entity.BuyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuyItemRepository extends JpaRepository<BuyItem, Long> {
}