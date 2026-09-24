package com.example.foodach.Repository;

import com.example.foodach.Entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findBySellerUserId(String sellerUserId);
    List<CustomerOrder> findByStoreId(Long storeId);
    List<CustomerOrder> findByCustomerUserId(String customerUserId);
}
