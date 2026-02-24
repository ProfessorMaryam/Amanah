package com.amanah.service;

import com.amanah.entity.Goal;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;

    public Goal getGoalByChild(UUID childId) {
        return goalRepository.findByChildId(childId)
                .orElseThrow(() -> new RuntimeException("No goal found for child"));
    }

    public Optional<Goal> findByChild(UUID childId) {
        return goalRepository.findByChildId(childId);
    }

    public Goal createOrUpdateGoal(UUID childId, Goal.GoalType type,
                                   BigDecimal targetAmount, LocalDate targetDate,
                                   BigDecimal monthlyOverride, boolean paused) {
        Goal goal = goalRepository.findByChildId(childId).orElse(new Goal());
        goal.setChildId(childId);
        goal.setGoalType(type);
        goal.setTargetAmount(targetAmount);
        goal.setTargetDate(targetDate);
        goal.setPaused(paused);

        if (monthlyOverride != null) {
            goal.setMonthlyContribution(monthlyOverride);
        } else {
            goal.setMonthlyContribution(suggestedMonthly(childId, targetAmount, targetDate));
        }

        return goalRepository.save(goal);
    }

    public BigDecimal suggestedMonthly(UUID childId, BigDecimal targetAmount, LocalDate targetDate) {
        BigDecimal balance = transactionRepository.sumByChildId(childId);
        long months = ChronoUnit.MONTHS.between(LocalDate.now(), targetDate);
        if (months <= 0) return targetAmount;
        BigDecimal remaining = targetAmount.subtract(balance);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return remaining.divide(BigDecimal.valueOf(months), 2, RoundingMode.CEILING);
    }
}
