package com.amanah.service;

import com.amanah.entity.Goal;
import com.amanah.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public Goal getGoalByChild(UUID childId) {
        return findByChild(childId)
                .orElseThrow(() -> new RuntimeException("No goal found for child"));
    }

    public Optional<Goal> findByChild(UUID childId) {
        return goalRepository.findByChildId(childId);
    }

    @Transactional
    public Goal createOrUpdateGoal(UUID childId, String type,
                                   BigDecimal targetAmount, LocalDate targetDate,
                                   BigDecimal monthlyOverride, boolean paused) {
        Goal goal = goalRepository.findByChildId(childId).orElse(new Goal());

        goal.setChildId(childId);
        goal.setGoalType(type);
        goal.setTargetAmount(targetAmount);
        goal.setTargetDate(targetDate);
        goal.setPaused(paused);
        goal.setMonthlyContribution(monthlyOverride != null ? monthlyOverride : BigDecimal.ZERO);

        return goalRepository.save(goal);
    }
}
