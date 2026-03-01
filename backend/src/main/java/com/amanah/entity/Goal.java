package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false, columnDefinition = "goal_type")
    private GoalType goalType;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "monthly_contribution", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyContribution;

    /**
     * Maps to the 'is_paused' column in the goals table.
     * Note: Lombok @Getter generates isPaused() for boolean; we explicitly name the column.
     */
    @Builder.Default
    @Column(name = "is_paused", nullable = false)
    private boolean isPaused = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public enum GoalType {
        UNIVERSITY, CAR, WEDDING, BUSINESS, GENERAL
    }
}
