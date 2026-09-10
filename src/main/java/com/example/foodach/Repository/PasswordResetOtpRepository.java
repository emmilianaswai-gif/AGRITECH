package com.example.foodach.Repository;

import com.example.foodach.Entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    List<PasswordResetOtp> findAllByIdentifierIgnoreCaseAndCodeAndUsedFalse(String identifier, String code);
    void deleteByIdentifierIgnoreCase(String identifier);
}