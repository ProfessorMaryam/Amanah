package com.amanah.controller;

import com.amanah.dto.*;
import com.amanah.entity.*;
import com.amanah.repository.*;
import com.amanah.service.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(ChildController.class);

    private final ChildService childService;
    private final GoalService goalService;
    private final ContributionService contributionService;
    private final FundDirectiveService directiveService;
    private final TransactionRepository transactionRepository;
    private final InvestmentPortfolioRepository portfolioRepository;

    // --- Children CRUD ---

    @GetMapping
    public ResponseEntity<List<Child>> list(@AuthenticationPrincipal UUID parentId) {
        log.info("[ChildController] GET /api/children parentId={}", parentId);
        List<Child> children = childService.getChildren(parentId);
        log.info("[ChildController] Returning {} children for parentId={}", children.size(), parentId);
        return ResponseEntity.ok(children);
    }

    @PostMapping
    public ResponseEntity<Child> create(@AuthenticationPrincipal UUID parentId,
                                        @RequestBody ChildRequest req) {
        log.info("[ChildController] POST /api/children parentId={} name={}", parentId, req.name());
        Child created = childService.addChild(parentId, req.name(), req.dateOfBirth(), req.photoUrl());
        log.info("[ChildController] Created child id={} name={}", created.getId(), created.getName());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Child> update(@AuthenticationPrincipal UUID parentId,
                                        @PathVariable UUID id,
                                        @RequestBody ChildRequest req) {
        log.info("[ChildController] PUT /api/children/{} parentId={}", id, parentId);
        Child updated = childService.updateChild(id, parentId, req.name(), req.dateOfBirth(), req.photoUrl());
        log.info("[ChildController] Updated child id={}", updated.getId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UUID parentId,
                                       @PathVariable UUID id) {
        log.info("[ChildController] DELETE /api/children/{} parentId={}", id, parentId);
        childService.deleteChild(id, parentId);
        log.info("[ChildController] Deleted child id={}", id);
        return ResponseEntity.noContent().build();
    }

    // --- Child Detail ---

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detail(@AuthenticationPrincipal UUID parentId,
                                                      @PathVariable UUID id) {
        log.info("[ChildController] GET /api/children/{} parentId={}", id, parentId);

        Child child = childService.getChild(id, parentId);
        List<Transaction> transactions = transactionRepository.findAllByChildIdOrderByDateDesc(id);
        BigDecimal savings = transactionRepository.sumByChildId(id);
        Optional<Goal> goal = goalService.findByChild(id);
        Optional<InvestmentPortfolio> portfolio = portfolioRepository.findByChildId(id);

        log.debug("[ChildController] child={} transactions={} savings={} hasGoal={} hasPortfolio={}",
                child.getId(), transactions.size(), savings, goal.isPresent(), portfolio.isPresent());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("child", child);
        response.put("transactions", transactions);
        response.put("savingsBalance", savings);

        goal.ifPresent(g -> {
            long months = ChronoUnit.MONTHS.between(LocalDate.now(), g.getTargetDate());
            response.put("goal", g);
            response.put("monthsRemaining", Math.max(0, months));
            BigDecimal remaining = g.getTargetAmount().subtract(savings);
            LocalDate projected = g.getMonthlyContribution() != null
                    && g.getMonthlyContribution().compareTo(BigDecimal.ZERO) > 0
                    && remaining.compareTo(BigDecimal.ZERO) > 0
                    ? LocalDate.now().plusMonths(
                            remaining.divide(g.getMonthlyContribution(), 0, java.math.RoundingMode.CEILING).longValue())
                    : null;
            response.put("projectedCompletion", projected);
            log.debug("[ChildController] goal={} isPaused={} monthsRemaining={} projectedCompletion={}",
                    g.getId(), g.isPaused(), months, projected);
        });

        portfolio.ifPresent(p -> {
            response.put("investment", p);
            log.debug("[ChildController] portfolio={} type={} value={}", p.getId(), p.getPortfolioType(), p.getCurrentValue());
        });

        directiveService.findByChild(id).ifPresent(d -> {
            response.put("fundDirective", d);
            log.debug("[ChildController] directive id={}", d.getId());
        });

        return ResponseEntity.ok(response);
    }

    // --- Goal ---

    @PostMapping("/{id}/goal")
    public ResponseEntity<Goal> setGoal(@AuthenticationPrincipal UUID parentId,
                                        @PathVariable UUID id,
                                        @RequestBody GoalRequest req) {
        log.info("[ChildController] POST /api/children/{}/goal parentId={} type={} target={} date={} paused={}",
                id, parentId, req.goalType(), req.targetAmount(), req.targetDate(), req.paused());
        childService.getChild(id, parentId); // ownership check
        // parentId doubles as the goal owner in goal_owners
        Goal saved = goalService.createOrUpdateGoal(
                id, parentId, req.goalType(), req.targetAmount(),
                req.targetDate(), req.monthlyContribution(), req.paused());
        log.info("[ChildController] Saved goal id={} for child={}", saved.getId(), id);
        return ResponseEntity.ok(saved);
    }

    // --- Contribution ---

    @PostMapping("/{id}/contribute")
    public ResponseEntity<Transaction> contribute(@AuthenticationPrincipal UUID parentId,
                                                  @PathVariable UUID id,
                                                  @RequestBody ContributeRequest req) {
        log.info("[ChildController] POST /api/children/{}/contribute parentId={} amount={}", id, parentId, req.amount());
        childService.getChild(id, parentId); // ownership check
        Transaction tx = contributionService.contribute(id, req.amount(), Transaction.TransactionType.MANUAL);
        log.info("[ChildController] Recorded transaction id={} amount={} for child={}", tx.getId(), tx.getAmount(), id);
        return ResponseEntity.ok(tx);
    }

    // --- Investment Portfolio ---

    @PostMapping("/{id}/investment")
    public ResponseEntity<InvestmentPortfolio> setInvestment(@AuthenticationPrincipal UUID parentId,
                                                              @PathVariable UUID id,
                                                              @RequestBody InvestmentRequest req) {
        log.info("[ChildController] POST /api/children/{}/investment parentId={} type={} allocation={}%",
                id, parentId, req.portfolioType(), req.allocationPercent());
        childService.getChild(id, parentId);
        InvestmentPortfolio portfolio = portfolioRepository.findByChildId(id).orElse(new InvestmentPortfolio());
        portfolio.setChildId(id);
        portfolio.setPortfolioType(req.portfolioType());
        portfolio.setAllocationPercentage(req.allocationPercent());
        if (portfolio.getCurrentValue() == null) portfolio.setCurrentValue(BigDecimal.ZERO);
        InvestmentPortfolio saved = portfolioRepository.save(portfolio);
        log.info("[ChildController] Saved portfolio id={} for child={}", saved.getId(), id);
        return ResponseEntity.ok(saved);
    }

    // --- Fund Directive ---

    @GetMapping("/{id}/directive")
    public ResponseEntity<FundDirective> getDirective(@AuthenticationPrincipal UUID parentId,
                                                       @PathVariable UUID id) {
        log.info("[ChildController] GET /api/children/{}/directive parentId={}", id, parentId);
        childService.getChild(id, parentId);
        FundDirective directive = directiveService.getByChild(id);
        log.debug("[ChildController] directive id={} for child={}", directive.getId(), id);
        return ResponseEntity.ok(directive);
    }

    @PostMapping("/{id}/directive")
    public ResponseEntity<FundDirective> setDirective(@AuthenticationPrincipal UUID parentId,
                                                       @PathVariable UUID id,
                                                       @RequestBody FundDirectiveRequest req) {
        log.info("[ChildController] POST /api/children/{}/directive parentId={} guardian={}",
                id, parentId, req.guardianName());
        childService.getChild(id, parentId);
        FundDirective saved = directiveService.save(id, req.guardianName(), req.guardianContact(), req.instructions());
        log.info("[ChildController] Saved directive id={} for child={}", saved.getId(), id);
        return ResponseEntity.ok(saved);
    }
}
