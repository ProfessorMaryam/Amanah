package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "child_id", nullable = false, columnDefinition = "uuid", unique = true)
    private UUID childId;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false)
    private GoalType goalType;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "monthly_contribution", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyContribution;

    @Column(name = "is_paused", nullable = false)
    private boolean paused = false;

    public enum GoalType {
        UNIVERSITY, CAR, WEDDING, BUSINESS, GENERAL
    }
}
