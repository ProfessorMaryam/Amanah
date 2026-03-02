package com.amanah.dto;

import com.amanah.entity.InvestmentPortfolio;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InvestmentRequest(
        @NotNull InvestmentPortfolio.PortfolioType portfolioType,
        @Min(0) @Max(100) int allocationPercent
) {}
