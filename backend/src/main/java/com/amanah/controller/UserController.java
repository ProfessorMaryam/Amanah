package com.amanah.controller;

import com.amanah.dto.UserProfileRequest;
import com.amanah.entity.*;
import com.amanah.repository.*;
import com.amanah.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final GoalOwnerRepository goalOwnerRepository;
    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;
    private final InvestmentPortfolioRepository portfolioRepository;
    private final ChildRepository childRepository;
    private final FundDirectiveRepository fundDirectiveRepository;

    @GetMapping
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal UUID userId,
                                           @RequestHeader("X-User-Email") String email) {
        log.info("[UserController] GET /api/me userId={} email={}", userId, email);
        User user = userService.getOrCreate(userId, email);
        log.debug("[UserController] Returning user id={} fullName={} role={}", user.getId(), user.getFullName(), user.getRole());
        return ResponseEntity.ok(user);
    }

    @PutMapping
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UUID userId,
                                              @RequestBody UserProfileRequest req) {
        log.info("[UserController] PUT /api/me userId={} fullName={}", userId, req.fullName());
        User user = userService.updateProfile(userId, req.fullName(), req.phone());
        log.info("[UserController] Updated profile for userId={}", userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Returns the savings goal details for a child-role user.
     * Looks up the GoalOwner row where ownerId = userId, then fetches the linked
     * child record, goal, transactions, investment, and directive.
     */
    @GetMapping("/goal")
    public ResponseEntity<Map<String, Object>> getMyGoal(@AuthenticationPrincipal UUID userId) {
        log.info("[UserController] GET /api/me/goal userId={}", userId);

        GoalOwner owner = goalOwnerRepository.findByOwnerId(userId)
                .orElse(null);

        if (owner == null || owner.getChildId() == null) {
            log.warn("[UserController] No goal_owner row found for userId={}", userId);
            return ResponseEntity.ok(Collections.emptyMap());
        }

        UUID childId = owner.getChildId();
        Child child = childRepository.findById(childId).orElse(null);
        Goal goal = goalRepository.findById(owner.getGoalId()).orElse(null);
        List<Transaction> transactions = transactionRepository.findAllByChildIdOrderByDateDesc(childId);
        BigDecimal savings = transactionRepository.sumByChildId(childId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("child", child);
        response.put("goal", goal);
        response.put("transactions", transactions);
        response.put("savingsBalance", savings);

        portfolioRepository.findByChildId(childId)
                .ifPresent(p -> response.put("investment", p));
        fundDirectiveRepository.findByChildId(childId)
                .ifPresent(d -> response.put("fundDirective", d));

        log.info("[UserController] Returning goal data for userId={} childId={}", userId, childId);
        return ResponseEntity.ok(response);
    }
}
