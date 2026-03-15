package com.amanah.service;

import com.amanah.entity.InvestmentPortfolio;
import com.amanah.entity.Transaction;
import com.amanah.repository.InvestmentPortfolioRepository;
import com.amanah.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContributionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private InvestmentPortfolioRepository portfolioRepository;

    @InjectMocks
    private ContributionService contributionService;

    @Test
    void contribute_savesFullAmountWhenNoPortfolioExists() {
        UUID childId = UUID.randomUUID();
        when(portfolioRepository.findByChildId(childId)).thenReturn(Optional.empty());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction saved = contributionService.contribute(childId, new BigDecimal("100.00"), Transaction.TransactionType.MANUAL);

        assertThat(saved.getChildId()).isEqualTo(childId);
        assertThat(saved.getAmount()).isEqualByComparingTo("100.00");
        assertThat(saved.getType()).isEqualTo(Transaction.TransactionType.MANUAL);
        verify(portfolioRepository, never()).save(any(InvestmentPortfolio.class));
    }

    @Test
    void contribute_splitsAmountAndUpdatesPortfolioWhenAllocationExists() {
        UUID childId = UUID.randomUUID();
        InvestmentPortfolio portfolio = InvestmentPortfolio.builder()
                .childId(childId)
                .allocationPercentage(25)
                .portfolioType(InvestmentPortfolio.PortfolioType.BALANCED)
                .currentValue(new BigDecimal("10.00"))
                .build();

        when(portfolioRepository.findByChildId(childId)).thenReturn(Optional.of(portfolio));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction saved = contributionService.contribute(childId, new BigDecimal("100.00"), Transaction.TransactionType.AUTO);

        ArgumentCaptor<InvestmentPortfolio> portfolioCaptor = ArgumentCaptor.forClass(InvestmentPortfolio.class);
        verify(portfolioRepository).save(portfolioCaptor.capture());

        assertThat(saved.getAmount()).isEqualByComparingTo("75.00");
        assertThat(saved.getType()).isEqualTo(Transaction.TransactionType.AUTO);
        assertThat(portfolioCaptor.getValue().getCurrentValue()).isEqualByComparingTo("35.00");
    }
}