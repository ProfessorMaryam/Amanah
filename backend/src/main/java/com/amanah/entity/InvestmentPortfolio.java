package com.amanah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investment_portfolios")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvestmentPortfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "child_id", nullable = false, columnDefinition = "uuid", unique = true)
    private UUID childId;

    @Enumerated(EnumType.STRING)
    @Column(name = "portfolio_type", nullable = false, columnDefinition = "portfolio_type")
    private PortfolioType portfolioType;

    @Column(name = "allocation_percentage", nullable = false)
    private int allocationPercentage;

    @Column(name = "current_value", precision = 12, scale = 2)
    private BigDecimal currentValue = BigDecimal.ZERO;

    @Column(name = "last_updated", insertable = false, updatable = false)
    private OffsetDateTime lastUpdated;

    public enum PortfolioType {
        CONSERVATIVE, BALANCED, GROWTH;

        public double annualRate() {
            return switch (this) {
                case CONSERVATIVE -> 0.04;
                case BALANCED -> 0.07;
                case GROWTH -> 0.10;
            };
        }
    }
}
