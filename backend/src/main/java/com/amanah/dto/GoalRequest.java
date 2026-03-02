package com.amanah.dto;

import com.amanah.entity.Goal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalRequest(
        @NotNull Goal.GoalType goalType,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal targetAmount,
        @NotNull @Future LocalDate targetDate,
        @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal monthlyContribution,
        boolean paused
) {}
