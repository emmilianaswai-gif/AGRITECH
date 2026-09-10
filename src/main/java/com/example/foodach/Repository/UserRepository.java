package com.example.foodach.Repository;

import com.example.foodach.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByPhoneNumber(String PhoneNumber);
    Boolean existsByPhoneNumber(String PhoneNumber);
    List<User> findAllByEmailIgnoreCase(String email);
    Boolean existsByEmailIgnoreCase(String email);
}