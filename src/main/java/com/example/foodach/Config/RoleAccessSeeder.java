package com.example.foodach.Config;

import com.example.foodach.Entity.RoleAccessConfig;
import com.example.foodach.Repository.RoleAccessConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoleAccessSeeder implements ApplicationRunner {

    private final RoleAccessConfigRepository repository;

    private static final List<String> FULL = List.of(
            "dashboard", "learning", "advice", "stores", "buy", "orders", "stock", "customer", "wallet", "messages", "exchange", "support", "access", "settings"
    );

    private static final List<String> CUSTOMER = List.of(
            "dashboard", "learning", "advice", "stores", "buy", "messages", "exchange", "support", "settings"
    );

    @Override
    public void run(ApplicationArguments args) {
        seed("FAMER", FULL);
        seed("CUSTOMER", FULL);
        seed("SUPPLIER", CUSTOMER);
        seed("ADMIN", FULL);
    }

    private void seed(String role, List<String> services) {
        RoleAccessConfig config = repository.findByRole(role).orElseGet(RoleAccessConfig::new);
        config.setRole(role);
        config.setServices(services);
        repository.save(config);
    }
}