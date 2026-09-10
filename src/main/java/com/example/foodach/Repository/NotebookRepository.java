package com.example.foodach.Repository;

import com.example.foodach.Entity.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotebookRepository extends JpaRepository<Notebook, Long> {

    List<Notebook> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<Notebook> findByIdAndUserId(Long id, String userId);
}