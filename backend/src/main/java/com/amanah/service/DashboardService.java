package com.amanah.service;

import com.amanah.entity.Child;
import com.amanah.entity.Goal;
import com.amanah.entity.InvestmentPortfolio;
import com.amanah.repository.ChildRepository;
import com.amanah.repository.GoalOwnerRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.InvestmentPortfolioRepository;
import com.amanah.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ChildRepository childRepository;
    private final GoalOwnerRepository goalOwnerRepository;
    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;
    private final InvestmentPortfolioRepository portfolioRepository;

    public Map<String, Object> getDashboard(UUID parentId) {
        List<Child> children = childRepository.findAllByParentId(parentId);

        List<Map<String, Object>> childSummaries = new ArrayList<>();
        BigDecimal totalFamilySavings = BigDecimal.ZERO;

        for (Child child : children) {
            BigDecimal savings = transactionRepository.sumByChildId(child.getId());
            BigDecimal investment = portfolioRepository.findByChildId(child.getId())
                    .map(InvestmentPortfolio::getCurrentValue)
                    .orElse(BigDecimal.ZERO);
            BigDecimal total = savings.add(investment);
            totalFamilySavings = totalFamilySavings.add(total);

            Optional<Goal> goalOpt = goalOwnerRepository.findByChildId(child.getId())
                    .flatMap(owner -> goalRepository.findById(owner.getGoalId()));
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("childId", child.getId());
            summary.put("name", child.getName());
            summary.put("savingsBalance", savings);
            summary.put("investmentBalance", investment);
            summary.put("totalValue", total);

            goalOpt.ifPresent(goal -> {
                BigDecimal progress = goal.getTargetAmount().compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : savings.divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
                long monthsRemaining = ChronoUnit.MONTHS.between(LocalDate.now(), goal.getTargetDate());
                summary.put("goalType", goal.getGoalType());
                summary.put("targetAmount", goal.getTargetAmount());
                summary.put("progressPercent", progress);
                summary.put("monthsRemaining", Math.max(0, monthsRemaining));
                summary.put("isPaused", goal.isPaused());
            });

            childSummaries.add(summary);
        }

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("children", childSummaries);
        dashboard.put("totalFamilySavings", totalFamilySavings);
        return dashboard;
    }
}
