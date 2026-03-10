package com.amanah.controller;

import com.amanah.entity.Goal;
import com.amanah.entity.User;
import com.amanah.repository.GoalRepository;
import com.amanah.repository.UserRepository;
import com.amanah.service.ContributionService;
import com.amanah.service.StripeService;
import com.amanah.entity.Transaction;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;
import com.stripe.param.SetupIntentCreateParams;
import com.stripe.model.SetupIntent;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeController {

    private final StripeService stripeService;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final ContributionService contributionService;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @PostMapping("/setup-intent")
    public ResponseEntity<Map<String, String>> setupIntent(@AuthenticationPrincipal UUID parentId) {
        User user = userRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Look for an existing Stripe customer via any active subscription on this parent's children
        String customerId = goalRepository.findAll().stream()
                .filter(g -> g.getStripeSubscriptionId() != null)
                .map(g -> {
                    try {
                        Subscription sub = Subscription.retrieve(g.getStripeSubscriptionId());
                        return sub.getCustomer();
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(id -> id != null)
                .findFirst()
                .orElse(null);

        if (customerId == null) {
            customerId = stripeService.createCustomer(
                    user.getEmail() != null ? user.getEmail() : parentId.toString(),
                    user.getFullName() != null ? user.getFullName() : "Amanah User"
            );
        }

        try {
            SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                    .setCustomer(customerId)
                    .addPaymentMethodType("card")
                    .build();
            SetupIntent intent = SetupIntent.create(params);
            return ResponseEntity.ok(Map.of(
                    "clientSecret", intent.getClientSecret(),
                    "customerId", customerId
            ));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create SetupIntent: " + e.getMessage(), e);
        }
    }

    @PostMapping("/subscribe/{childId}")
    public ResponseEntity<Map<String, String>> subscribe(
            @AuthenticationPrincipal UUID parentId,
            @PathVariable UUID childId,
            @RequestBody Map<String, String> body) {

        String paymentMethodId = body.get("paymentMethodId");
        if (paymentMethodId == null || paymentMethodId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Goal goal = goalRepository.findByChildId(childId)
                .orElseThrow(() -> new RuntimeException("No goal found for child"));

        // Need a customer — retrieve from setup or create
        String customerId = body.getOrDefault("customerId", null);
        if (customerId == null || customerId.isBlank()) {
            User user = userRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            customerId = stripeService.createCustomer(
                    user.getEmail() != null ? user.getEmail() : parentId.toString(),
                    user.getFullName() != null ? user.getFullName() : "Amanah User"
            );
        }

        BigDecimal amount = goal.getMonthlyContribution();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return ResponseEntity.badRequest().build();
        }

        String subscriptionId = stripeService.createSubscription(customerId, paymentMethodId, amount);
        goal.setStripeSubscriptionId(subscriptionId);
        goalRepository.save(goal);

        return ResponseEntity.ok(Map.of("subscriptionId", subscriptionId));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody byte[] payload,
            HttpServletRequest request) {

        String sigHeader = request.getHeader("Stripe-Signature");
        Event event;
        try {
            event = Webhook.constructEvent(new String(payload), sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().build();
        }

        switch (event.getType()) {
            case "invoice.paid" -> {
                event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
                    if (obj instanceof Invoice invoice) {
                        String subscriptionId = invoice.getSubscription();
                        goalRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(goal -> {
                            BigDecimal amount = BigDecimal.valueOf(invoice.getAmountPaid()).divide(BigDecimal.valueOf(1000));
                            contributionService.contribute(goal.getChildId(), amount, Transaction.TransactionType.AUTO);
                        });
                    }
                });
            }
            case "customer.subscription.deleted" -> {
                event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
                    if (obj instanceof Subscription sub) {
                        goalRepository.findByStripeSubscriptionId(sub.getId()).ifPresent(goal -> {
                            goal.setPaused(true);
                            goalRepository.save(goal);
                        });
                    }
                });
            }
        }

        return ResponseEntity.ok().build();
    }
}
