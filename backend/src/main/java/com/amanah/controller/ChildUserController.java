package com.amanah.controller;

import com.amanah.dto.ChildGoalRequest;
import com.amanah.dto.ContributeRequest;
import com.amanah.entity.PersonalGoal;
import com.amanah.entity.Transaction;
import com.amanah.repository.PersonalGoalRepository;
import com.amanah.repository.TransactionRepository;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Endpoints for child-role users to manage their own personal savings goals.
 */
@RestController
@RequestMapping("/api/my-goals")
@RequiredArgsConstructor
public class ChildUserController {

    private final PersonalGoalRepository personalGoalRepository;
    private final TransactionRepository transactionRepository;

    // GET /api/my-goals — list all personal goals with balance + progress
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listGoals(@AuthenticationPrincipal UUID userId) {
        List<PersonalGoal> goals = personalGoalRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (PersonalGoal goal : goals) {
            BigDecimal balance = transactionRepository.sumByChildId(goal.getId());
            List<Transaction> txs = transactionRepository.findAllByChildIdOrderByDateDesc(goal.getId());

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
        }
        return ResponseEntity.ok(result);
    }

    // POST /api/my-goals — create a new personal goal
    @PostMapping
    public ResponseEntity<Map<String, Object>> createGoal(@AuthenticationPrincipal UUID userId,
                                                           @Valid @RequestBody ChildGoalRequest req) {
        PersonalGoal goal = PersonalGoal.builder()
                .userId(userId)
                .goalType(req.goalType())
                .targetAmount(req.targetAmount())
                .targetDate(req.targetDate())
                .monthlyContribution(BigDecimal.ZERO)
                .isPaused(false)
                .build();
        goal = personalGoalRepository.save(goal);

        long months = ChronoUnit.MONTHS.between(LocalDate.now(), req.targetDate());
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
        personalGoalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        Transaction tx = Transaction.builder()
                .childId(goalId)
                .amount(req.amount())
                .type(Transaction.TransactionType.MANUAL)
                .build();
        return ResponseEntity.ok(transactionRepository.save(tx));
    }

    // DELETE /api/my-goals/{goalId} — delete a personal goal
    @Transactional
    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@AuthenticationPrincipal UUID userId,
                                            @PathVariable UUID goalId) {
        PersonalGoal goal = personalGoalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        transactionRepository.deleteAllByChildId(goalId);
        personalGoalRepository.delete(goal);
        return ResponseEntity.noContent().build();
    }
}
