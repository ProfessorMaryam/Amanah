package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "goal_owners")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(GoalOwner.GoalOwnerId.class)
public class GoalOwner {

    @Id
    @Column(name = "goal_id", columnDefinition = "uuid")
    private UUID goalId;

    @Id
    @Column(name = "owner_id", columnDefinition = "uuid")
    private UUID ownerId;

    @Column(name = "child_id", columnDefinition = "uuid")
    private UUID childId;

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GoalOwnerId implements java.io.Serializable {
        private UUID goalId;
        private UUID ownerId;
    }
}
