package com.amanah.service;

import com.amanah.entity.Goal;
import com.amanah.entity.GoalOwner;
import com.amanah.repository.GoalOwnerRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(GoalService.class);

    private final GoalRepository goalRepository;
    private final GoalOwnerRepository goalOwnerRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Resolve a child's current goal via the goal_owners join table.
     * Each child has at most one goal_owner row, and thus at most one goal.
     */
    public Optional<Goal> findByChild(UUID childId) {
        log.debug("[GoalService] findByChild childId={}", childId);
        return goalOwnerRepository.findByChildId(childId)
                .flatMap(owner -> goalRepository.findById(owner.getGoalId()));
    }

    public Goal getGoalByChild(UUID childId) {
        log.debug("[GoalService] getGoalByChild childId={}", childId);
        return findByChild(childId)
                .orElseThrow(() -> {
                    log.warn("[GoalService] No goal found for childId={}", childId);
                    return new RuntimeException("No goal found for child");
                });
    }

    /**
     * Create or update the goal for a child.
     * Inserts into goals and upserts the goal_owners row linking it to the child + owner.
     */
    @Transactional
    public Goal createOrUpdateGoal(UUID childId, UUID ownerId, Goal.GoalType type,
                                   BigDecimal targetAmount, LocalDate targetDate,
                                   BigDecimal monthlyOverride, boolean paused) {
        log.info("[GoalService] createOrUpdateGoal childId={} ownerId={} type={} target={} date={} paused={}",
                childId, ownerId, type, targetAmount, targetDate, paused);

        // Find existing goal via goal_owners, or create a brand-new Goal row
        Optional<GoalOwner> existingOwner = goalOwnerRepository.findByChildId(childId);
        Goal goal = existingOwner
                .flatMap(o -> goalRepository.findById(o.getGoalId()))
                .orElse(new Goal());

        goal.setGoalType(type);
        goal.setTargetAmount(targetAmount);
        goal.setTargetDate(targetDate);
        goal.setPaused(paused);

        if (monthlyOverride != null) {
            goal.setMonthlyContribution(monthlyOverride);
        } else {
            goal.setMonthlyContribution(suggestedMonthly(childId, targetAmount, targetDate));
        }

        goal = goalRepository.save(goal);
        log.info("[GoalService] Saved goal id={}", goal.getId());

        // Upsert goal_owners row — only insert if none existed yet
        if (existingOwner.isEmpty()) {
            GoalOwner owner = GoalOwner.builder()
                    .goalId(goal.getId())
                    .ownerId(ownerId)
                    .childId(childId)
                    .build();
            goalOwnerRepository.save(owner);
            log.info("[GoalService] Created goal_owners row goalId={} ownerId={} childId={}",
                    goal.getId(), ownerId, childId);
        } else {
            log.debug("[GoalService] goal_owners row already exists for childId={}", childId);
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
