package com.amanah.service;

import com.amanah.entity.InvestmentPortfolio;
import com.amanah.entity.Transaction;
import com.amanah.repository.InvestmentPortfolioRepository;
import com.amanah.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContributionService {

    private static final Logger log = LoggerFactory.getLogger(ContributionService.class);

    private final TransactionRepository transactionRepository;
    private final InvestmentPortfolioRepository portfolioRepository;

    @Transactional
    public Transaction contribute(UUID childId, BigDecimal amount, Transaction.TransactionType type) {
        log.info("[ContributionService] contribute childId={} amount={} type={}", childId, amount, type);

        BigDecimal savingsAmount = amount;

        // If an investment portfolio exists, split the contribution
        var portfolioOpt = portfolioRepository.findByChildId(childId);
        if (portfolioOpt.isPresent()) {
            InvestmentPortfolio portfolio = portfolioOpt.get();
            BigDecimal investPct = BigDecimal.valueOf(portfolio.getAllocationPercentage())
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal investAmount = amount.multiply(investPct).setScale(2, RoundingMode.HALF_UP);
            savingsAmount = amount.subtract(investAmount);

            portfolio.setCurrentValue(portfolio.getCurrentValue().add(investAmount));
            portfolioRepository.save(portfolio);
            log.debug("[ContributionService] Split contribution: invest={} savings={} for childId={}",
                    investAmount, savingsAmount, childId);
        }

        Transaction tx = Transaction.builder()
                .childId(childId)
                .amount(savingsAmount)
                .type(type)
                .build();
        Transaction saved = transactionRepository.save(tx);
        log.info("[ContributionService] Saved transaction id={} savingsAmount={} for childId={}",
                saved.getId(), savingsAmount, childId);
        return saved;
    }
}
