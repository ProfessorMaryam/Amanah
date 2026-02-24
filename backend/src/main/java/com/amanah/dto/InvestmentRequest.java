package com.amanah.dto;

import com.amanah.entity.InvestmentPortfolio;

public record InvestmentRequest(InvestmentPortfolio.PortfolioType portfolioType, int allocationPercent) {}
