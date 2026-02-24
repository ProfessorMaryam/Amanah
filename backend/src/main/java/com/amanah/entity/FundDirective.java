package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "fund_directives")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FundDirective {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "child_id", nullable = false, columnDefinition = "uuid", unique = true)
    private UUID childId;

    @Column(name = "guardian_name")
    private String guardianName;

    @Column(name = "guardian_contact")
    private String guardianContact;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "last_updated", insertable = false, updatable = false)
    private OffsetDateTime lastUpdated;
}
