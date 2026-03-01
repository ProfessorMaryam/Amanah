package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Maps the goal_owners join table introduced in the new schema.
 * A goal can be owned by a user and optionally linked to a child.
 *
 * DDL:
 *   goal_id  uuid FK -> goals(id)
 *   owner_id uuid FK -> users(id)
 *   child_id uuid FK -> children(id)  (nullable)
 *   created_at timestamp with time zone DEFAULT now()
 *   PK (goal_id, owner_id)
 */
@Entity
@Table(name = "goal_owners")
@IdClass(GoalOwnerPK.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GoalOwner {

    @Id
    @Column(name = "goal_id", columnDefinition = "uuid", nullable = false)
    private UUID goalId;

    @Id
    @Column(name = "owner_id", columnDefinition = "uuid", nullable = false)
    private UUID ownerId;

    @Column(name = "child_id", columnDefinition = "uuid")
    private UUID childId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
