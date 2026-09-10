package com.example.foodach.Repository;

import com.example.foodach.Entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    @Query("SELECT m FROM Message m " +
            "WHERE (m.senderId = :a AND m.receiverId = :b) OR (m.senderId = :b AND m.receiverId = :a) " +
            "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("a") String a, @Param("b") String b);

    @Query("SELECT m FROM Message m WHERE m.senderId = :u OR m.receiverId = :u ORDER BY m.createdAt DESC")
    List<Message> findAllInvolvingUser(@Param("u") String u);
}