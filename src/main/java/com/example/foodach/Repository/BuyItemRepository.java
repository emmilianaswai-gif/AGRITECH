package com.example.foodach.Repository;

import com.example.foodach.Entity.BuyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuyItemRepository extends JpaRepository<BuyItem, Long> {
    List<BuyItem> findByOwnerUserId(String ownerUserId);
    List<BuyItem> findByStoreId(Long storeId);
}
