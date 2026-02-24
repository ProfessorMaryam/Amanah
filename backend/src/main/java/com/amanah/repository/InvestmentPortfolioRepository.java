package com.amanah.repository;

import com.amanah.entity.InvestmentPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvestmentPortfolioRepository extends JpaRepository<InvestmentPortfolio, UUID> {
    Optional<InvestmentPortfolio> findByChildId(UUID childId);
    List<InvestmentPortfolio> findAllByChildIdIn(List<UUID> childIds);
}
