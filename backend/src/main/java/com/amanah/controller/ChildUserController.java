package com.amanah.controller;

import com.amanah.dto.ChildGoalRequest;
import com.amanah.dto.ContributeRequest;
import com.amanah.entity.Goal;
import com.amanah.entity.GoalOwner;
import com.amanah.entity.Transaction;
import com.amanah.repository.GoalOwnerRepository;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.TransactionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Endpoints for child-role users to manage their own personal savings goals.
 * A child user's goals use owner_id = user UUID and child_id = NULL in goal_owners.
 * Transactions are stored with child_id = user UUID (reusing the bucket concept).
 */
@RestController
@RequestMapping("/api/my-goals")
@RequiredArgsConstructor
public class ChildUserController {

    private final GoalOwnerRepository goalOwnerRepository;
    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;

    // GET /api/my-goals — list all personal goals with balance + progress
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listGoals(@AuthenticationPrincipal UUID userId) {
        List<GoalOwner> owners = goalOwnerRepository.findAllByOwnerIdAndChildIdIsNull(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (GoalOwner owner : owners) {
            goalRepository.findById(owner.getGoalId()).ifPresent(goal -> {
                UUID bucketId = goal.getId(); // use goalId as transaction bucket for personal goals
                BigDecimal balance = transactionRepository.sumByChildId(bucketId);
                List<Transaction> txs = transactionRepository.findAllByChildIdOrderByDateDesc(bucketId);

                long months = ChronoUnit.MONTHS.between(LocalDate.now(), goal.getTargetDate());
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", goal.getId());
                entry.put("name", goal.getGoalType());
                entry.put("targetAmount", goal.getTargetAmount());
                entry.put("targetDate", goal.getTargetDate());
                entry.put("currentAmount", balance);
                entry.put("monthsRemaining", Math.max(0, months));
                entry.put("isPaused", goal.isPaused());
                entry.put("transactions", txs);
                result.add(entry);
            });
        }
        return ResponseEntity.ok(result);
    }

    // POST /api/my-goals — create a new personal goal
    @PostMapping
    public ResponseEntity<Map<String, Object>> createGoal(@AuthenticationPrincipal UUID userId,
                                                           @Valid @RequestBody ChildGoalRequest req) {
        Goal goal = new Goal();
        goal.setGoalType(req.goalType());
        goal.setTargetAmount(req.targetAmount());
        goal.setTargetDate(req.targetDate());

        long months = ChronoUnit.MONTHS.between(LocalDate.now(), req.targetDate());
        BigDecimal monthly = months > 0
                ? req.targetAmount().divide(BigDecimal.valueOf(months), 2, RoundingMode.CEILING)
                : req.targetAmount();
        goal.setMonthlyContribution(monthly);
        goal.setPaused(false);
        goal = goalRepository.save(goal);

        GoalOwner owner = GoalOwner.builder()
                .goalId(goal.getId())
                .ownerId(userId)
                .childId(null)
                .build();
        goalOwnerRepository.save(owner);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", goal.getId());
        response.put("name", goal.getGoalType());
        response.put("targetAmount", goal.getTargetAmount());
        response.put("targetDate", goal.getTargetDate());
        response.put("currentAmount", BigDecimal.ZERO);
        response.put("monthsRemaining", Math.max(0, months));
        response.put("isPaused", false);
        response.put("transactions", List.of());
        return ResponseEntity.status(201).body(response);
    }

    // POST /api/my-goals/{goalId}/contribute — add money to a personal goal
    @PostMapping("/{goalId}/contribute")
    public ResponseEntity<Transaction> contribute(@AuthenticationPrincipal UUID userId,
                                                   @PathVariable UUID goalId,
                                                   @Valid @RequestBody ContributeRequest req) {
        // Verify ownership
        goalOwnerRepository.findByOwnerIdAndGoalIdAndChildIdIsNull(userId, goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        // Use goalId as the transaction bucket for personal goals
        Transaction tx = Transaction.builder()
                .childId(goalId)
                .amount(req.amount())
                .type(Transaction.TransactionType.MANUAL)
                .build();
        return ResponseEntity.ok(transactionRepository.save(tx));
    }

    // DELETE /api/my-goals/{goalId} — delete a personal goal
    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@AuthenticationPrincipal UUID userId,
                                            @PathVariable UUID goalId) {
        GoalOwner owner = goalOwnerRepository.findByOwnerIdAndGoalIdAndChildIdIsNull(userId, goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        transactionRepository.deleteAllByChildId(goalId);
        goalOwnerRepository.delete(owner);
        goalRepository.deleteById(goalId);
        return ResponseEntity.noContent().build();
    }
}
