package com.amanah.service;

import com.amanah.entity.Child;
import com.amanah.entity.GoalOwner;
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
    private final GoalOwnerRepository goalOwnerRepository;
    private final GoalRepository goalRepository;

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

        // 4. Collect goal IDs linked to this child, delete goal_owners, then the goals
        List<GoalOwner> goalOwners = goalOwnerRepository.findAllByChildId(id);
        List<UUID> goalIds = goalOwners.stream().map(GoalOwner::getGoalId).toList();
        goalOwnerRepository.deleteAllByChildId(id);
        if (!goalIds.isEmpty()) {
            goalRepository.deleteAllById(goalIds);
        }

        // 5. Delete the child
        childRepository.delete(child);
    }
}
