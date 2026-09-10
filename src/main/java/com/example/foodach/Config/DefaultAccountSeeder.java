package com.example.foodach.Config;

import com.example.foodach.Entity.Role;
import com.example.foodach.Entity.User;
import com.example.foodach.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DefaultAccountSeeder implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        String email = "emmilianaswai@gmail.com";
        String password = "123";

        seed(email, password, "+255700000001", "Emmiliana Swai", "Head Office", "Dar es Salaam", Role.SUPER_ADMIN.name());
        seed(email, password, "+255700000002", "Emmiliana Swai", "Head Office", "Dar es Salaam", Role.ADMIN.name());
        seed(email, password, "+255700000003", "Emmiliana Swai", "Shamba Road", "Arusha", Role.FAMER.name());
        seed(email, password, "+255700000004", "Emmiliana Swai", "City Centre", "Dar es Salaam", Role.CUSTOMER.name());
        seed(email, password, "+255700000005", "Emmiliana Swai", "Industrial Area", "Mwanza", Role.SUPPLIER.name());
    }

    private void seed(String email, String password, String phone, String name, String address, String location, String role) {
        Optional<User> existing = userRepository.findAllByEmailIgnoreCase(email).stream()
                .filter(u -> role.equals(u.getRole()))
                .findFirst();

        if (existing.isPresent()) {
            if (!password.equals(existing.get().getPassword())) {
                existing.get().setPassword(password);
                userRepository.save(existing.get());
            }
            return;
        }

        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(password);
        u.setPhoneNumber(phone);
        u.setAddress(address);
        u.setLocation(location);
        u.setRole(role);
        userRepository.save(u);
    }
}