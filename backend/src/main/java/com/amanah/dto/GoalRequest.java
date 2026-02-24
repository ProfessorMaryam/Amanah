package com.amanah.dto;

import com.amanah.entity.Goal;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalRequest(
        Goal.GoalType goalType,
        BigDecimal targetAmount,
        LocalDate targetDate,
        BigDecimal monthlyContribution,
        boolean paused
) {}
