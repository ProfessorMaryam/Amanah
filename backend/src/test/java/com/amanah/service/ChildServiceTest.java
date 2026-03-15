package com.amanah.service;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.amanah.entity.Child;
import com.amanah.entity.Goal;
import com.amanah.repository.ChildRepository;
import com.amanah.repository.FundDirectiveRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.InvestmentPortfolioRepository;
import com.amanah.repository.TransactionRepository;

@ExtendWith(MockitoExtension.class)
class ChildServiceTest {

    @Mock
    private ChildRepository childRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private InvestmentPortfolioRepository investmentPortfolioRepository;

    @Mock
    private FundDirectiveRepository fundDirectiveRepository;

    @Mock
    private GoalRepository goalRepository;

    private ChildService childService;

    private RecordingStripeService recordingStripeService;

    @BeforeEach
    void setUp() {
        recordingStripeService = new RecordingStripeService();
        childService = new ChildService(
                childRepository,
                transactionRepository,
                investmentPortfolioRepository,
                fundDirectiveRepository,
                goalRepository,
                recordingStripeService
        );
    }

    @Test
    void deleteChild_removesRelatedDataAndCancelsSubscriptionWhenPresent() {
        UUID childId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Child child = Child.builder().id(childId).parentId(parentId).name("Aisha").build();
        Goal goal = Goal.builder().childId(childId).stripeSubscriptionId("sub_123").build();

        when(childRepository.findByIdAndParentId(childId, parentId)).thenReturn(Optional.of(child));
        when(goalRepository.findByChildId(childId)).thenReturn(Optional.of(goal));

        childService.deleteChild(childId, parentId);

        verify(transactionRepository).deleteAllByChildId(childId);
        verify(investmentPortfolioRepository).deleteByChildId(childId);
        verify(fundDirectiveRepository).deleteByChildId(childId);
        verify(goalRepository).deleteByChildId(childId);
        verify(childRepository).delete(child);
        assertThat(recordingStripeService.cancelCalls).isEqualTo(1);
        assertThat(recordingStripeService.lastCancelledSubscriptionId).isEqualTo("sub_123");
    }

    @Test
    void deleteChild_skipsStripeCancellationWhenNoSubscriptionExists() {
        UUID childId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Child child = Child.builder().id(childId).parentId(parentId).name("Omar").build();
        Goal goal = Goal.builder().childId(childId).stripeSubscriptionId(null).build();

        when(childRepository.findByIdAndParentId(childId, parentId)).thenReturn(Optional.of(child));
        when(goalRepository.findByChildId(childId)).thenReturn(Optional.of(goal));

        childService.deleteChild(childId, parentId);

        verify(goalRepository).deleteByChildId(childId);
        verify(childRepository).delete(child);
        assertThat(recordingStripeService.cancelCalls).isZero();
    }

    private static class RecordingStripeService extends StripeService {
        private int cancelCalls;
        private String lastCancelledSubscriptionId;

        @Override
        public void cancelSubscription(String subscriptionId) {
            cancelCalls++;
            lastCancelledSubscriptionId = subscriptionId;
        }
    }
}