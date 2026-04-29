# Payments and Aging — Table Consolidation

User stories and acceptance criteria for consolidating the Payments and Payment Allocations tables into a single expandable view on the Account page.

---

## Story 1 — View payment allocations inline within the payments list

Currently, payments and their allocations are shown in two disconnected flat tables. A user must manually cross-reference a Payment ID between them to understand how a payment was applied. The consolidated view groups allocation records as child rows under their parent payment, expandable on demand, eliminating the lookup step.

### Acceptance Criteria

```gherkin
Scenario: Expanding a payment with allocations
  Given a payment record that has one or more allocation records
  When the user clicks the expand control on that payment row
  Then the allocation records for that payment are displayed as child rows beneath it
  And each child row shows the allocation date, billing period, invoice reference, allocated account, payment ID, and allocated amount

Scenario: Expanding a payment with no allocations
  Given a payment record that has no allocation records and no unallocated remainder
  When the payment row is rendered
  Then no expand control is shown on that row

Scenario: Collapsing an expanded payment
  Given a payment row that is currently expanded
  When the user clicks the expand control again
  Then the child rows are hidden
```

---

## Story 2 — Identify allocation status at a glance

The existing Payments table shows no allocation status — a user cannot tell whether a payment has been fully applied without checking the allocations table. An inline status badge (Fully allocated / Partially allocated / Unallocated / Credit) on each payment row surfaces this immediately, without requiring the second table.

### Acceptance Criteria

```gherkin
Scenario: Fully allocated payment
  Given a payment where the total received equals the total applied
  When the payment row is rendered
  Then a "Fully allocated" badge is displayed on that row

Scenario: Partially allocated payment
  Given a payment where the total applied is greater than zero but less than the total received
  When the payment row is rendered
  Then a "Partially allocated" badge is displayed on that row

Scenario: Unallocated payment
  Given a payment where no amount has been applied
  When the payment row is rendered
  Then an "Unallocated" badge is displayed on that row

Scenario: Credit record
  Given a payment where the received amount is negative
  When the payment row is rendered
  Then a "Credit" badge is displayed on that row
```

---

## Story 3 — Identify payments allocated across multiple accounts

The current design provides no visual indication when a lockbox record has been split across accounts. In the consolidated view, cross-account child rows are visually distinguished, and the account name is surfaced on those rows only — same-account rows are suppressed to reduce noise.

### Acceptance Criteria

```gherkin
Scenario: Child row allocated to the same account as the parent
  Given an expanded payment with a child allocation record
  And the child allocation's account matches the parent payment's account
  When the child row is rendered
  Then the account column on that child row displays a dash
  And no cross-account indicator is shown

Scenario: Child row allocated to a different account than the parent
  Given an expanded payment with a child allocation record
  And the child allocation's account differs from the parent payment's account
  When the child row is rendered
  Then the account name is displayed on that child row
  And the row is visually distinguished with an amber left border and warm background

Scenario: Payment with all same-account allocations
  Given an expanded payment where all child allocations share the parent's account
  When the child rows are rendered
  Then no cross-account indicators are shown on any child row
```

---

## Story 4 — See the unallocated remainder without leaving the payments view

When a payment is only partially applied, the outstanding amount is not visible in the current Payments table. The consolidated view surfaces the remainder as an explicit child row ("No invoice yet") when the parent is expanded, alongside the amount still outstanding.

### Acceptance Criteria

```gherkin
Scenario: Expanding a partially allocated payment
  Given a payment where the total applied is less than the total received
  When the user expands the payment row
  Then a remainder row is shown beneath the allocation child rows
  And the remainder row displays the unallocated amount
  And the remainder row indicates that no invoice has been assigned

Scenario: Expanding a fully allocated payment
  Given a payment where the total received equals the total applied
  When the user expands the payment row
  Then no remainder row is shown

Scenario: Unallocated amount reflected in the parent row
  Given a payment where the total applied is less than the total received
  When the payment row is rendered
  Then the unallocated column on the parent row displays the outstanding amount
  And the amount is visually distinguished from a zero or empty value
```
