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

## Story 4 — Distinguish record types within a shared ID column

The current design uses separate tables for lockbox records and payment allocations, each with their own ID column. In the consolidated view, lockbox records, payment allocations, and credits coexist in a single ID column. A type pill prefixing each ID (LBX, PMT, CRD) makes the record type unambiguous without requiring separate columns or tables.

### Acceptance Criteria

```gherkin
Scenario: Lockbox record row
  Given a parent row representing a lockbox record
  When the row is rendered
  Then the ID column displays an LBX pill followed by the lockbox record ID

Scenario: Credit record row
  Given a parent row representing a credit (negative received amount)
  When the row is rendered
  Then the ID column displays a CRD pill followed by the credit record ID
  And the CRD pill is visually distinct from the LBX and PMT pills

Scenario: Payment allocation child row
  Given an expanded parent row with one or more allocation child rows
  When the child rows are rendered
  Then each child row's ID column displays a PMT pill followed by the payment allocation ID

Scenario: Type pills are not part of the ID value
  Given any row in the table
  When the ID is displayed
  Then the type pill is rendered separately from the ID value
  And the raw ID does not include any LBX-, PMT-, or CRD- prefix
```

---

## Story 5 — Total amount reflects the lockbox record received amount

The Total amount column represents the gross amount received on the lockbox record — the value as recorded in the bank file. It is not derived from or equal to the sum of allocations. Child rows do not display a value in this column, avoiding the implication that individual allocations contribute to a running total.

### Acceptance Criteria

```gherkin
Scenario: Total amount on a parent row
  Given a lockbox record parent row
  When the row is rendered
  Then the Total amount column displays the gross received amount from the lockbox record

Scenario: Total amount is independent of allocation sum
  Given a lockbox record where allocations do not sum to the received amount
  When the row is rendered
  Then the Total amount column still reflects the lockbox received amount
  And not the sum of its child allocation amounts

Scenario: Total amount on child rows
  Given an expanded parent row with allocation child rows
  When the child rows are rendered
  Then the Total amount column is empty on all child rows
```

---

## Story 6 — See the unallocated remainder without leaving the payments view

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
