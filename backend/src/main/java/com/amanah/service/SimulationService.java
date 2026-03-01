package com.amanah.service;

import com.amanah.entity.Child;
import com.amanah.entity.Goal;
import com.amanah.entity.GoalOwner;
import com.amanah.entity.InvestmentPortfolio;
import com.amanah.entity.Transaction;
import com.amanah.repository.ChildRepository;
import com.amanah.repository.GoalOwnerRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.InvestmentPortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SimulationService {

    private final ChildRepository childRepository;
    private final GoalOwnerRepository goalOwnerRepository;
    private final GoalRepository goalRepository;
    private final InvestmentPortfolioRepository portfolioRepository;
    private final ContributionService contributionService;

    @Transactional
    public int runMonthlySimulation(UUID parentId) {
        List<Child> children = childRepository.findAllByParentId(parentId);
        List<UUID> childIds = children.stream().map(Child::getId).toList();

        // Collect (childId, goalId) pairs from goal_owners for these children
        List<GoalOwner> owners = goalOwnerRepository.findAllByChildIdIn(childIds);
        List<UUID> goalIds = owners.stream().map(GoalOwner::getGoalId).toList();
        List<Goal> activeGoals = goalRepository.findAllByIdInAndIsPausedFalse(goalIds);

        int processed = 0;
        for (Goal goal : activeGoals) {
            // Find the child linked to this goal via goal_owners
            UUID childId = owners.stream()
                    .filter(o -> o.getGoalId().equals(goal.getId()) && o.getChildId() != null)
                    .map(GoalOwner::getChildId)
                    .findFirst()
                    .orElse(null);
            if (childId == null) continue;

            BigDecimal monthly = goal.getMonthlyContribution();
            if (monthly == null || monthly.compareTo(BigDecimal.ZERO) <= 0) continue;

            contributionService.contribute(childId, monthly, Transaction.TransactionType.AUTO);

            // Apply compound growth on investment portfolio
            portfolioRepository.findByChildId(childId).ifPresent(portfolio -> {
                double monthlyRate = portfolio.getPortfolioType().annualRate() / 12;
                BigDecimal growthFactor = BigDecimal.valueOf(1 + monthlyRate);
                BigDecimal newValue = portfolio.getCurrentValue().multiply(growthFactor, new MathContext(10, RoundingMode.HALF_UP));
                portfolio.setCurrentValue(newValue.setScale(2, RoundingMode.HALF_UP));
                portfolioRepository.save(portfolio);
            });
            processed++;
        }

        return processed;
    }
}
