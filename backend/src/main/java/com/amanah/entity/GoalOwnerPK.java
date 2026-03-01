package com.amanah.entity;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class GoalOwnerPK implements Serializable {
    private UUID goalId;
    private UUID ownerId;
}
