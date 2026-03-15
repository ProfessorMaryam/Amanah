package com.amanah.service;

import com.amanah.entity.Goal;
import com.amanah.repository.GoalRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @InjectMocks
    private GoalService goalService;

    @Test
    void createOrUpdateGoal_createsNewGoalAndDefaultsMonthlyContributionToZero() {
        UUID childId = UUID.randomUUID();
        when(goalRepository.findByChildId(childId)).thenReturn(Optional.empty());
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Goal saved = goalService.createOrUpdateGoal(
                childId,
                "University Fund",
                new BigDecimal("5000.00"),
                LocalDate.of(2035, 6, 1),
                null,
                false
        );

        assertThat(saved.getChildId()).isEqualTo(childId);
        assertThat(saved.getGoalType()).isEqualTo("University Fund");
        assertThat(saved.getTargetAmount()).isEqualByComparingTo("5000.00");
        assertThat(saved.getMonthlyContribution()).isEqualByComparingTo("0");
        assertThat(saved.isPaused()).isFalse();
        verify(goalRepository).save(saved);
    }

    @Test
    void createOrUpdateGoal_updatesExistingGoalWithoutReplacingIt() {
        UUID childId = UUID.randomUUID();
        Goal existing = Goal.builder()
                .childId(childId)
                .stripeSubscriptionId("sub_123")
                .monthlyContribution(new BigDecimal("25.00"))
                .build();

        when(goalRepository.findByChildId(childId)).thenReturn(Optional.of(existing));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Goal saved = goalService.createOrUpdateGoal(
                childId,
                "Emergency Fund",
                new BigDecimal("1500.00"),
                LocalDate.of(2030, 1, 1),
                new BigDecimal("75.00"),
                true
        );

        assertThat(saved).isSameAs(existing);
        assertThat(saved.getGoalType()).isEqualTo("Emergency Fund");
        assertThat(saved.getTargetAmount()).isEqualByComparingTo("1500.00");
        assertThat(saved.getMonthlyContribution()).isEqualByComparingTo("75.00");
        assertThat(saved.isPaused()).isTrue();
        assertThat(saved.getStripeSubscriptionId()).isEqualTo("sub_123");
    }
}