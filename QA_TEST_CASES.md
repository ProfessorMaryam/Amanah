## Amanah QA Test Cases

This checklist focuses on the highest-risk user flows in the current project.

### Core regression suite

| ID | Priority | Area | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| AUTH-01 | P0 | Auth | Sign up a new parent account with valid email/password/full name | Account is created, JWT is returned, user lands in authenticated experience |
| AUTH-02 | P0 | Auth | Sign up with an email that already exists | Request is rejected with a clear duplicate-email error |
| AUTH-03 | P0 | Auth | Log in with a valid email/password | JWT is returned and protected pages load successfully |
| AUTH-04 | P0 | Auth | Log in with a wrong password | Request is rejected with 401 / invalid credentials |
| AUTH-05 | P0 | Security | Call a protected endpoint without `Authorization` header | Request is blocked by backend security |
| CHILD-01 | P0 | Parent flow | Create a child with valid name and past date of birth | Child is saved and appears in parent dashboard/list |
| CHILD-02 | P1 | Validation | Create/update a child with blank name or future DOB | Request is rejected by validation rules |
| CHILD-03 | P0 | Authorization | Parent A attempts to view/update/delete Parent B's child | Backend rejects access as not found / unauthorized |
| CHILD-04 | P1 | Parent flow | Delete a child that has transactions, goal, and investment portfolio | Related records are removed and child no longer appears |
| GOAL-01 | P0 | Goal management | Create a savings goal with valid target amount/date/monthly contribution | Goal is saved and reflected in child detail/dashboard |
| GOAL-02 | P1 | Validation | Create a goal with `targetAmount <= 0` or more than 2 decimal places | Request is rejected by validation rules |
| GOAL-03 | P1 | Goal management | Update an existing goal and leave monthly contribution empty | Goal saves successfully and monthly contribution defaults to `0.00` |
| GOAL-04 | P1 | Subscription sync | Pause an existing subscribed goal | Goal is paused and Stripe pause flow is triggered |
| CONTRIB-01 | P0 | Contributions | Add a manual contribution to a child with no investment portfolio | Full amount is saved as a transaction |
| CONTRIB-02 | P0 | Contributions | Add a contribution to a child with an investment allocation | Savings transaction stores the remaining amount and portfolio value increases by the allocated share |
| CONTRIB-03 | P1 | Validation | Submit contribution amount `0`, negative, or too many decimals | Request is rejected by validation rules |
| SIM-01 | P0 | Monthly simulation | Run monthly simulation for a parent with one active goal and one paused goal | Only the active goal is processed and one AUTO contribution is created |
| SIM-02 | P1 | Investment growth | Run monthly simulation for a child with an investment portfolio | Portfolio value grows by the portfolio's monthly rate after contribution |
| PROFILE-01 | P1 | Profile | Update profile full name and phone | Saved profile is returned and later reads match updated values |
| STRIPE-01 | P0 | Payments | Subscribe a child goal with valid `customerId` and `paymentMethodId` | Subscription is created, goal stores `stripeSubscriptionId`, and first AUTO contribution is recorded |
| STRIPE-02 | P1 | Payments | Attempt subscription with missing/blank `paymentMethodId` | Request returns 400 and no subscription is created |
| STRIPE-03 | P0 | Webhooks | Receive `invoice.paid` webhook for a known subscription | Matching child gets an AUTO contribution based on the paid invoice amount |
| STRIPE-04 | P1 | Webhooks | Receive `customer.subscription.deleted` webhook | Matching goal is marked paused |
| CHILDUI-01 | P1 | Child experience | First child-view visit with no pet setup completed | Pet setup screen is shown instead of main child home |
| CHILDUI-02 | P1 | Child goals UI | Create a personal goal from child-view goals page | Goal appears in the list with correct target/progress |
| CHILDUI-03 | P1 | Pet system | Pet/feed/play interactions after cooldown expires | Happiness increases and cooldown behavior is enforced |
| CHILDUI-04 | P1 | Pet store | Buy an item with enough coins, then equip it | Coins decrease, item becomes owned, and equipped state updates |

### Suggested execution order

1. Run all **P0** cases on every release candidate.
2. Run **P1** cases for each sprint release or after touching related areas.
3. Automate API/service cases first; keep UI/pet/store flows as manual or end-to-end coverage.

### Good automation candidates in the current repo

- Backend service unit tests for `GoalService`, `ContributionService`, `ChildService`, and `SimulationService`
- Backend controller/security tests for auth and protected endpoints
- Later, frontend component or end-to-end coverage after adding a test framework