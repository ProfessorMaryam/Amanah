package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "public")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id; // matches auth.uid() from Supabase

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    /**
     * Maps the user_role enum in the DB (parent | child | admin).
     * Stored as a string to survive future enum additions without migration.
     */
    @Builder.Default
    @Column(name = "role", nullable = false, columnDefinition = "user_role")
    private String role = "parent";

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
