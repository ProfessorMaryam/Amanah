package com.amanah.service;

import com.amanah.entity.Goal;
import com.amanah.entity.GoalOwner;
import com.amanah.repository.GoalOwnerRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final GoalOwnerRepository goalOwnerRepository;
    private final TransactionRepository transactionRepository;

    public Goal getGoalByChild(UUID childId) {
        return findByChild(childId)
                .orElseThrow(() -> new RuntimeException("No goal found for child"));
    }

    public Optional<Goal> findByChild(UUID childId) {
        return goalOwnerRepository.findByChildId(childId)
                .flatMap(owner -> goalRepository.findById(owner.getGoalId()));
    }

    @Transactional
    public Goal createOrUpdateGoal(UUID childId, Goal.GoalType type,
                                   BigDecimal targetAmount, LocalDate targetDate,
                                   BigDecimal monthlyOverride, boolean paused) {
        Optional<GoalOwner> existingOwner = goalOwnerRepository.findByChildId(childId);
        Goal goal = existingOwner
                .flatMap(o -> goalRepository.findById(o.getGoalId()))
                .orElse(new Goal());

        goal.setGoalType(type);
        goal.setTargetAmount(targetAmount);
        goal.setTargetDate(targetDate);
        goal.setPaused(paused);
        goal.setMonthlyContribution(
                monthlyOverride != null ? monthlyOverride : suggestedMonthly(childId, targetAmount, targetDate)
        );

        goal = goalRepository.save(goal);

        if (existingOwner.isEmpty()) {
            GoalOwner owner = GoalOwner.builder()
                    .goalId(goal.getId())
                    .ownerId(childId)
                    .childId(childId)
                    .build();
            goalOwnerRepository.save(owner);
        }

        return goal;
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
