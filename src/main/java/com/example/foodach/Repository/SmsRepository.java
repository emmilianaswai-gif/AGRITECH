package com.example.foodach.Repository;

import com.example.foodach.Entity.SmsMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmsRepository extends JpaRepository<SmsMessage, Long> {
    List<SmsMessage> findAllByOrderByCreatedAtDesc();
}