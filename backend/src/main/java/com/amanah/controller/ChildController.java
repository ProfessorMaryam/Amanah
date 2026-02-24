package com.amanah.controller;

import com.amanah.dto.*;
import com.amanah.entity.*;
import com.amanah.repository.*;
import com.amanah.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;
    private final GoalService goalService;
    private final ContributionService contributionService;
    private final FundDirectiveService directiveService;
    private final TransactionRepository transactionRepository;
    private final InvestmentPortfolioRepository portfolioRepository;

    // --- Children CRUD ---

    @GetMapping
    public ResponseEntity<List<Child>> list(@AuthenticationPrincipal UUID parentId) {
        return ResponseEntity.ok(childService.getChildren(parentId));
    }

    @PostMapping
    public ResponseEntity<Child> create(@AuthenticationPrincipal UUID parentId,
                                        @RequestBody ChildRequest req) {
        return ResponseEntity.ok(childService.addChild(parentId, req.name(), req.dateOfBirth(), req.photoUrl()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Child> update(@AuthenticationPrincipal UUID parentId,
                                        @PathVariable UUID id,
                                        @RequestBody ChildRequest req) {
        return ResponseEntity.ok(childService.updateChild(id, parentId, req.name(), req.dateOfBirth(), req.photoUrl()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UUID parentId,
                                       @PathVariable UUID id) {
        childService.deleteChild(id, parentId);
        return ResponseEntity.noContent().build();
    }

    // --- Child Detail ---

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detail(@AuthenticationPrincipal UUID parentId,
                                                      @PathVariable UUID id) {
        Child child = childService.getChild(id, parentId);
        List<Transaction> transactions = transactionRepository.findAllByChildIdOrderByDateDesc(id);
        BigDecimal savings = transactionRepository.sumByChildId(id);
        Optional<Goal> goal = goalService.findByChild(id);
        Optional<InvestmentPortfolio> portfolio = portfolioRepository.findByChildId(id);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("child", child);
        response.put("transactions", transactions);
        response.put("savingsBalance", savings);
        goal.ifPresent(g -> {
            long months = ChronoUnit.MONTHS.between(LocalDate.now(), g.getTargetDate());
            response.put("goal", g);
            response.put("monthsRemaining", Math.max(0, months));
            LocalDate projected = savings.compareTo(BigDecimal.ZERO) > 0 && g.getMonthlyContribution() != null
                    ? LocalDate.now().plusMonths(
                            g.getTargetAmount().subtract(savings)
                             .divide(g.getMonthlyContribution(), 0, java.math.RoundingMode.CEILING).longValue())
                    : null;
            response.put("projectedCompletion", projected);
        });
        portfolio.ifPresent(p -> response.put("investment", p));
        directiveService.findByChild(id).ifPresent(d -> response.put("fundDirective", d));

        return ResponseEntity.ok(response);
    }

    // --- Goal ---

    @PostMapping("/{id}/goal")
    public ResponseEntity<Goal> setGoal(@AuthenticationPrincipal UUID parentId,
                                        @PathVariable UUID id,
                                        @RequestBody GoalRequest req) {
        childService.getChild(id, parentId); // ownership check
        return ResponseEntity.ok(goalService.createOrUpdateGoal(
                id, req.goalType(), req.targetAmount(), req.targetDate(), req.monthlyContribution(), req.paused()));
    }

    // --- Contribution ---

    @PostMapping("/{id}/contribute")
    public ResponseEntity<Transaction> contribute(@AuthenticationPrincipal UUID parentId,
                                                  @PathVariable UUID id,
                                                  @RequestBody ContributeRequest req) {
        childService.getChild(id, parentId); // ownership check
        return ResponseEntity.ok(contributionService.contribute(id, req.amount(), Transaction.TransactionType.MANUAL));
    }

    // --- Investment Portfolio ---

    @PostMapping("/{id}/investment")
    public ResponseEntity<InvestmentPortfolio> setInvestment(@AuthenticationPrincipal UUID parentId,
                                                              @PathVariable UUID id,
                                                              @RequestBody InvestmentRequest req) {
        childService.getChild(id, parentId);
        InvestmentPortfolio portfolio = portfolioRepository.findByChildId(id).orElse(new InvestmentPortfolio());
        portfolio.setChildId(id);
        portfolio.setPortfolioType(req.portfolioType());
        portfolio.setAllocationPercentage(req.allocationPercent());
        if (portfolio.getCurrentValue() == null) portfolio.setCurrentValue(BigDecimal.ZERO);
        return ResponseEntity.ok(portfolioRepository.save(portfolio));
    }

    // --- Fund Directive ---

    @GetMapping("/{id}/directive")
    public ResponseEntity<FundDirective> getDirective(@AuthenticationPrincipal UUID parentId,
                                                       @PathVariable UUID id) {
        childService.getChild(id, parentId);
        return ResponseEntity.ok(directiveService.getByChild(id));
    }

    @PostMapping("/{id}/directive")
    public ResponseEntity<FundDirective> setDirective(@AuthenticationPrincipal UUID parentId,
                                                       @PathVariable UUID id,
                                                       @RequestBody FundDirectiveRequest req) {
        childService.getChild(id, parentId);
        return ResponseEntity.ok(directiveService.save(id, req.guardianName(), req.guardianContact(), req.instructions()));
    }
}
