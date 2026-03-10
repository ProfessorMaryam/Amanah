package com.amanah.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Subscription;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.CustomerUpdateParams;
import com.stripe.param.SubscriptionCancelParams;
import com.stripe.param.SubscriptionCreateParams;
import com.stripe.param.SubscriptionUpdateParams;
import com.stripe.param.common.EmptyParam;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class StripeService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String createCustomer(String email, String name) {
        try {
            CustomerCreateParams params = CustomerCreateParams.builder()
                    .setEmail(email)
                    .setName(name)
                    .build();
            Customer customer = Customer.create(params);
            return customer.getId();
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create Stripe customer: " + e.getMessage(), e);
        }
    }

    public String createSubscription(String customerId, String paymentMethodId, BigDecimal monthlyAmount) {
        try {
            // The payment method was already attached to the customer by the SetupIntent confirm.
            // Just ensure it is set as the default invoice payment method.
            CustomerUpdateParams customerUpdateParams = CustomerUpdateParams.builder()
                    .setInvoiceSettings(
                            CustomerUpdateParams.InvoiceSettings.builder()
                                    .setDefaultPaymentMethod(paymentMethodId)
                                    .build())
                    .build();
            Customer.retrieve(customerId).update(customerUpdateParams);

            // BHD uses fils (1 BHD = 1000 fils), so multiply by 1000
            long unitAmount = monthlyAmount.multiply(BigDecimal.valueOf(1000)).longValue();

            SubscriptionCreateParams params = SubscriptionCreateParams.builder()
                    .setCustomer(customerId)
                    .addItem(SubscriptionCreateParams.Item.builder()
                            .setPriceData(SubscriptionCreateParams.Item.PriceData.builder()
                                    .setCurrency("bhd")
                                    .setUnitAmount(unitAmount)
                                    .setRecurring(SubscriptionCreateParams.Item.PriceData.Recurring.builder()
                                            .setInterval(SubscriptionCreateParams.Item.PriceData.Recurring.Interval.MONTH)
                                            .build())
                                    .putExtraParam("product_data", java.util.Map.of("name", "Monthly Child Savings Contribution"))
                                    .build())
                            .build())
                    .build();

            Subscription subscription = Subscription.create(params);
            return subscription.getId();
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create Stripe subscription: " + e.getMessage(), e);
        }
    }

    public void pauseSubscription(String subscriptionId) {
        try {
            Subscription subscription = Subscription.retrieve(subscriptionId);
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setPauseCollection(SubscriptionUpdateParams.PauseCollection.builder()
                            .setBehavior(SubscriptionUpdateParams.PauseCollection.Behavior.VOID)
                            .build())
                    .build();
            subscription.update(params);
        } catch (StripeException e) {
            throw new RuntimeException("Failed to pause Stripe subscription: " + e.getMessage(), e);
        }
    }

    public void resumeSubscription(String subscriptionId) {
        try {
            Subscription subscription = Subscription.retrieve(subscriptionId);
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setPauseCollection(EmptyParam.EMPTY)
                    .build();
            subscription.update(params);
        } catch (StripeException e) {
            throw new RuntimeException("Failed to resume Stripe subscription: " + e.getMessage(), e);
        }
    }

    public void cancelSubscription(String subscriptionId) {
        try {
            Subscription subscription = Subscription.retrieve(subscriptionId);
            subscription.cancel(SubscriptionCancelParams.builder().build());
        } catch (StripeException e) {
            throw new RuntimeException("Failed to cancel Stripe subscription: " + e.getMessage(), e);
        }
    }
}
