package com.amanah.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ChildGoalRequest(
        @NotBlank String goalType,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal targetAmount,
        @NotNull @Future LocalDate targetDate
) {}
