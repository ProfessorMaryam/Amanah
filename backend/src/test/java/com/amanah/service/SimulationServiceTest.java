package com.amanah.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.amanah.entity.Child;
import com.amanah.entity.Goal;
import com.amanah.entity.InvestmentPortfolio;
import com.amanah.entity.Transaction;
import com.amanah.repository.ChildRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.InvestmentPortfolioRepository;
import com.amanah.repository.TransactionRepository;

@ExtendWith(MockitoExtension.class)
class SimulationServiceTest {

    @Mock
    private ChildRepository childRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private InvestmentPortfolioRepository portfolioRepository;

    @Mock
    private TransactionRepository transactionRepository;

    private SimulationService simulationService;

    @BeforeEach
    void setUp() {
        ContributionService contributionService = new ContributionService(transactionRepository, portfolioRepository);
        simulationService = new SimulationService(childRepository, goalRepository, portfolioRepository, contributionService);
    }

    @Test
    void runMonthlySimulation_processesActiveGoalsAndAppliesPortfolioGrowth() {
        UUID parentId = UUID.randomUUID();
        UUID activeChildId = UUID.randomUUID();
        UUID pausedChildId = UUID.randomUUID();

        Child activeChild = Child.builder().id(activeChildId).parentId(parentId).name("Aisha").build();
        Child pausedChild = Child.builder().id(pausedChildId).parentId(parentId).name("Omar").build();
        Goal activeGoal = Goal.builder()
                .childId(activeChildId)
                .monthlyContribution(new BigDecimal("100.00"))
                .paused(false)
                .build();
        Goal pausedGoal = Goal.builder()
                .childId(pausedChildId)
                .monthlyContribution(new BigDecimal("50.00"))
                .paused(true)
                .build();
        InvestmentPortfolio portfolio = InvestmentPortfolio.builder()
                .childId(activeChildId)
                .portfolioType(InvestmentPortfolio.PortfolioType.BALANCED)
                .allocationPercentage(20)
                .currentValue(new BigDecimal("1000.00"))
                .build();

        when(childRepository.findAllByParentId(parentId)).thenReturn(List.of(activeChild, pausedChild));
        when(goalRepository.findByChildId(activeChildId)).thenReturn(Optional.of(activeGoal));
        when(goalRepository.findByChildId(pausedChildId)).thenReturn(Optional.of(pausedGoal));
        when(portfolioRepository.findByChildId(activeChildId)).thenReturn(Optional.of(portfolio));
        when(portfolioRepository.save(any(InvestmentPortfolio.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        int processed = simulationService.runMonthlySimulation(parentId);

        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(transactionCaptor.capture());

        assertThat(processed).isEqualTo(1);
        verify(portfolioRepository, never()).findByChildId(pausedChildId);
        verify(portfolioRepository, times(2)).save(any(InvestmentPortfolio.class));
        assertThat(transactionCaptor.getValue().getChildId()).isEqualTo(activeChildId);
        assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("80.00");
        assertThat(transactionCaptor.getValue().getType()).isEqualTo(Transaction.TransactionType.AUTO);
        assertThat(portfolio.getCurrentValue()).isEqualByComparingTo("1025.95");
    }
}