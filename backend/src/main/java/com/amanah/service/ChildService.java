package com.amanah.service;

import com.amanah.entity.Child;
import com.amanah.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;
    private final TransactionRepository transactionRepository;
    private final InvestmentPortfolioRepository investmentPortfolioRepository;
    private final FundDirectiveRepository fundDirectiveRepository;
    private final GoalRepository goalRepository;
    private final StripeService stripeService;

    public List<Child> getChildren(UUID parentId) {
        return childRepository.findAllByParentId(parentId);
    }

    public Child getChild(UUID id, UUID parentId) {
        return childRepository.findByIdAndParentId(id, parentId)
                .orElseThrow(() -> new RuntimeException("Child not found"));
    }

    public Child addChild(UUID parentId, String name, java.time.LocalDate dob, String photoUrl) {
        Child child = Child.builder()
                .parentId(parentId)
                .name(name)
                .dateOfBirth(dob)
                .photoUrl(photoUrl)
                .build();
        return childRepository.save(child);
    }

    public Child updateChild(UUID id, UUID parentId, String name, java.time.LocalDate dob, String photoUrl) {
        Child child = getChild(id, parentId);
        child.setName(name);
        child.setDateOfBirth(dob);
        child.setPhotoUrl(photoUrl);
        return childRepository.save(child);
    }

    @Transactional
    public void deleteChild(UUID id, UUID parentId) {
        Child child = getChild(id, parentId);

        // 1. Delete transactions
        transactionRepository.deleteAllByChildId(id);

        // 2. Delete investment portfolio
        investmentPortfolioRepository.deleteByChildId(id);

        // 3. Delete fund directive
        fundDirectiveRepository.deleteByChildId(id);

        // 4. Cancel Stripe subscription if present, then delete the goal
        goalRepository.findByChildId(id).ifPresent(goal -> {
            if (goal.getStripeSubscriptionId() != null) {
                stripeService.cancelSubscription(goal.getStripeSubscriptionId());
            }
        });
        goalRepository.deleteByChildId(id);

        // 5. Delete the child
        childRepository.delete(child);
    }
}
