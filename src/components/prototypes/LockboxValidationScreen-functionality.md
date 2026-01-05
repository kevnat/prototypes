# Lockbox Validation Screen - Functional Specification

## Overview
The **LockboxValidationScreen** is a React component that provides a hierarchical, interactive interface for reviewing, validating, and editing payment allocations from lockbox files before posting to the accounting system.

---

## Core Purpose
Enable users to review automated payment-to-invoice allocations, manually correct mismatches or partial allocations, and prepare validated transactions for posting.

## Two-Stage Matching Process

The system uses a two-stage matching approach:

1. **Lockbox Matching Rules (Payment → Customer)**
   - First stage: Identifies which customer/account a payment belongs to
   - Uses payment metadata (reference fields, account IDs, customer names, bank accounts)
   - Example rules:
     - Account ID in Reference (e.g., "ACC-B061801" → Delta Corp)
     - Customer Name Match (e.g., "Acme Corporation" in other party field)
     - Bank Account Matching (matching originating bank account)
   - Display format: `Account Match: {rule name}`

2. **Cash Application Strategies (Payment → Invoices)**
   - Second stage: Determines which specific invoice(s) to allocate the payment to
   - Uses invoice metadata and allocation logic
   - Example strategies:
     - Invoice Number Exact Match (e.g., "INV-001" in reference)
     - Amount Match with Tolerance (payment amount ≈ invoice amount within 5%)
     - Multi-Invoice Split (reference contains multiple invoice numbers)
     - Oldest Invoice First (FIFO allocation strategy)
   - Display format: `Invoice Match: {strategy name}`

Both stages work together to create a complete payment allocation. A payment may successfully match to a customer (stage 1) but fail to match to specific invoices (stage 2), requiring manual allocation.

---

## Data Hierarchy

The component manages a 4-level hierarchical structure:

1. **File** - Lockbox file containing multiple transactions
2. **Transaction/Payment** - Individual payment from a customer
3. **Invoice** - Invoice(s) that the payment is allocated to
4. **Line Item** - Individual line items within an invoice

Additionally, transactions may have **Unallocated Amounts** when payment doesn't fully match invoice allocations.

---

## Key Features

### 1. Hierarchical Table Display

#### Data Structure
- Files contain transactions
- Transactions contain invoices and potential unallocated amounts
- Invoices contain line items
- Each level can be expanded/collapsed independently

#### Visual Characteristics
- Indented display showing parent-child relationships
- Expand/collapse chevron icons for navigable levels
- Type badges (File, Payment, Invoice, Item, Unallocated)
- Row numbering for transactions only

#### Table Columns
1. **#** - Sequential number (transactions only)
2. **Select | Actions** - Checkbox, edit button, skip button
3. **Type** - Hierarchical type indicator with expand/collapse
4. **ID** - Identifier (filename, payment ID, invoice number, description)
5. **Amount** - Monetary value formatted as currency
6. **Account Name** - Customer/party name
7. **Description** - Descriptive text
8. **Matching Rules** - Two-stage matching display (transactions only):
   - Line 1: Account Match explanation (e.g., "Account Match: Customer Name Match")
   - Line 2: Invoice Match explanation (e.g., "Invoice Match: Multi-Invoice Split")

---

### 2. Transaction Status Management

#### Status Types
- **Partially Allocated** (needs_review) - Payment has unallocated amount remaining
- **Allocated** (valid/proposed) - Payment fully allocated to invoices
- **Error** - Validation or system error

#### Visual Indicators
- Color-coded status pills (orange for partial, blue for allocated, red for error)
- Row background colors reflect status:
  - Yellow background for partially allocated
  - Alternating white/gray for fully allocated
  - Red tint for skipped transactions
  - Blue highlight for selected transactions

#### Transaction Sorting
Transactions automatically sort by:
1. Status priority (needs_review first, then proposed, then valid)
2. Payment ID (for stable positioning)

---

### 3. Selection & Multi-Action Capabilities

#### Individual Selection
- Checkbox on each transaction row
- Visual feedback with blue background when selected
- Selection counter in header

#### Bulk Operations
- "Select All" capability for all transactions across all files
- "Edit Selected" button appears when selections exist
- Selected count displayed in header badge

#### Skip Functionality
- Skip emoji button (⏩) to mark transactions to skip during posting
- Skipped transactions shown with red background and reduced opacity
- Line-through text styling for skipped items
- Toggle on/off capability

---

### 4. Edit Modes

#### Single Transaction Edit (Correction Modal)
Opens when clicking edit button on a transaction:

**Modal Contents:**
- Transaction details header (ID, other party, reference, total amount, unallocated amount)
- List of current invoice allocations with editable fields:
  - Customer/Account name
  - Invoice Number
  - Allocated Amount
- "Add New Invoice Allocation" button
- Quick Actions:
  - Auto-Match
  - Split Evenly
  - Clear All
- Audit Log section (placeholder)
- Save & Close / Cancel actions

**Behavior:**
- Displays current allocation state
- Allows editing of invoice allocations
- Can remove existing allocations
- Can add new allocations
- Shows unallocated amount in real-time

#### Multi-Transaction Edit Modal
Opens when clicking "Edit Selected" button:

**Modal Contents:**
- Progress indicator (Transaction X of Y)
- Current transaction details card
- Same allocation editing interface as single edit
- Navigation controls:
  - Previous button (disabled on first item)
  - Next button (disabled on last item)
  - Save & Next (for all but last item)
  - Save & Close (for last item)
  - Cancel

**Workflow:**
- Cycles through selected transactions sequentially
- Maintains edit index state
- Allows navigation forward/backward
- Preserves selections until modal closes

---

### 5. Summary Statistics Dashboard

Located at top of screen, displays:
- **Files** - Total number of lockbox files
- **Payments** - Total number of transactions
- **Total Volume** - Sum of all transaction amounts
- **Fully Allocated** - Count of transactions with status 'valid'
- **Partial/Unallocated** - Count of transactions needing review

Statistics update dynamically as transactions are edited/validated.

---

### 6. Data Flattening & Table Management

#### Flattening Algorithm
Converts hierarchical data to flat array for TanStack Table:
- Adds metadata to each row (type, level, parent relationships)
- Maintains file/transaction/invoice/lineItem IDs for relationship tracking
- Only includes visible rows based on expanded state
- Sorts transactions by status priority

#### Expand/Collapse State
- Controlled expansion at file, transaction, and invoice levels
- State managed via `expanded` object
- Updates trigger re-flattening and re-render

---

### 7. Validation & Posting Readiness

#### Posting Criteria
System determines if ready to post based on:
- All transactions have status = 'valid'
- All transactions have zero issues
- All transactions have zero unallocated amount

#### Pre-Posting Checks
- Validates allocation completeness
- Ensures no validation errors exist
- Confirms no partially allocated payments remain

---

## User Interaction Flows

### Flow 1: Review Partially Allocated Payment
1. User opens screen, sees summary showing X partial allocations
2. Transactions with unallocated amounts display yellow background
3. User expands transaction to see invoice allocations
4. User clicks edit button to open correction modal
5. User adjusts allocation amounts or adds new invoice
6. User saves changes
7. Status updates to "Allocated" if unallocated amount = 0
8. Row background changes from yellow to white/gray

### Flow 2: Bulk Edit Multiple Transactions
1. User checks multiple transaction checkboxes
2. "Edit Selected (X)" button appears in header
3. User clicks button to open multi-edit modal
4. Modal shows first selected transaction
5. User makes edits and clicks "Save & Next"
6. Modal advances to next transaction
7. User repeats until last transaction
8. User clicks "Save & Close"
9. Modal closes, selections clear

### Flow 3: Skip Transaction for Later
1. User identifies transaction to defer
2. User clicks skip button (⏩)
3. Row turns red with reduced opacity
4. Transaction text shows line-through
5. Badge shows "X Marked to Skip"
6. User can toggle off to unskip

### Flow 4: Quick Actions (Placeholder)
1. User opens edit modal for transaction
2. User clicks "Auto-Match" button
3. System attempts to match payment to open invoices
4. Allocations populate automatically
5. User reviews and saves

### Flow 5: Understanding Matching Results
1. User sees transaction with partial allocation
2. User expands transaction to view details
3. User reviews matching explanations:
   - "Account Match: Customer Name Match" - Shows how payment was assigned to customer
   - "Invoice Match: Multi-Invoice Split" - Shows how invoices were identified
4. User understands that customer matching succeeded but invoice allocation is incomplete
5. User manually completes the allocation based on this context

---

## Example User Stories (Using Two-Stage Matching)

### Story 1: Customer Matched, No Invoice Match
**As a** cash application specialist
**I want to** see which rule matched the payment to a customer and whether invoices were found
**So that** I can quickly understand if the issue is with customer identification or invoice matching

**Acceptance Criteria:**
- Transaction displays "Account Match: Customer Name Match" showing successful customer match
- Transaction displays "Invoice Match: No matching invoices found" showing failed invoice match
- User can see that customer "Gamma LLC" was correctly identified
- User understands they need to manually select invoices for this customer
- Unallocated amount shows full payment amount

### Story 2: Both Matches Successful, Partial Allocation
**As a** cash application specialist
**I want to** see that both matching stages succeeded but allocation is incomplete
**So that** I understand the payment was correctly routed but needs manual allocation adjustment

**Acceptance Criteria:**
- Transaction displays "Account Match: Customer Name Match"
- Transaction displays "Invoice Match: Multi-Invoice Split"
- System successfully matched customer "Acme Corporation"
- System found invoices INV-001 and INV-015 in reference
- Unallocated amount shows $400 remaining
- User can see the system did its job correctly but needs manual decision on remainder

### Story 3: Account Matching by Reference ID
**As a** cash application specialist
**I want to** see when a payment was matched using the account ID from the reference field
**So that** I have confidence the payment is correctly assigned to the customer

**Acceptance Criteria:**
- Transaction displays "Account Match: Account ID in Reference"
- Reference field shows "ACC-B061801-945.50" containing account identifier
- Payment correctly assigned to "Delta Corp" who owns account B061801
- High confidence indicator for this matching method
- Transaction shows full allocation to invoice

---

## Component State Management

### Primary State Variables
- `files` - Array of lockbox file objects with nested transactions/invoices
- `selectedItem` - Currently selected item for editing
- `showCorrectionModal` - Boolean for single edit modal visibility
- `expanded` - Object tracking expand/collapse state
- `skippedTransactions` - Set of transaction IDs marked to skip
- `selectedForEdit` - Set of transaction IDs selected for bulk edit
- `showMultiEditModal` - Boolean for multi-edit modal visibility
- `currentEditIndex` - Index in multi-edit sequence

### Computed Values
- `data` - Flattened array from files (useMemo)
- `stats` - Summary statistics (derived from files)
- `canPost` - Boolean indicating readiness to post

---

## Technical Dependencies

### Libraries
- **React** - Component framework
- **TanStack Table (v8)** - Table rendering and state management
- **lucide-react** - Icon components
- **Tailwind CSS** - Styling framework

### Mock Data Sources
- `mockLockboxFiles` - Sample file/transaction data
- `lockboxMatchingRules` - Payment-to-customer matching rules
- `cashApplicationStrategies` - Payment-to-invoice allocation strategies
- `ruleExplanations` - Combined lookup for all rules
- `issueTypes` - Issue type definitions

---

## Matching Rules & Strategies Reference

### Lockbox Matching Rules (Payment → Customer)

| Rule ID | Name | Description | Confidence |
|---------|------|-------------|------------|
| lbr-1 | Account ID in Reference | Finds customer account ID within payment reference field | High |
| lbr-2 | Customer Name Match | Fuzzy matches payment other party to customer name | Medium |
| lbr-3 | Bank Account Matching | Matches payment to customer by originating bank account | High |

### Cash Application Strategies (Payment → Invoices)

| Strategy ID | Name | Description | Confidence |
|-------------|------|-------------|------------|
| cas-1 | Invoice Number Exact Match | Extracts invoice number from reference and matches exactly | High |
| cas-2 | Amount Match with Tolerance | Matches payment to invoice when amounts are within 5% | Medium |
| cas-3 | Multi-Invoice Split | Detects multiple invoice numbers in reference, suggests split | Low |
| cas-4 | Oldest Invoice First | Applies payment to oldest outstanding invoice (FIFO) | Medium |

### Transaction Data Model

Each transaction contains:
```javascript
{
  id: 'payment-123456',
  amount: 1200.00,
  reference: 'INV001-INV015',
  otherParty: 'Acme Corporation',

  // Lockbox matching (stage 1)
  accountMatchRule: 'lbr-2',
  accountMatchExplanation: 'Account Match: Customer Name Match',

  // Cash application (stage 2)
  invoiceMatchRule: 'cas-3',
  invoiceMatchExplanation: 'Invoice Match: Multi-Invoice Split',

  status: 'needs_review',
  issues: ['unallocated_remainder', 'allocation_split_required'],
  invoices: [...],
  unallocatedAmount: 400.00
}
```

---

## Styling & Visual Design

### Color Coding
- **Blue** - Allocated transactions, selected items, primary actions
- **Yellow/Orange** - Partially allocated, warnings, unallocated amounts
- **Red** - Errors, skipped transactions, destructive actions
- **Gray/Slate** - Neutral states, borders, backgrounds
- **Green** - Success states, positive amounts

### Layout
- Full-screen layout with header
- Max-width container (7xl) for main content
- Card-based sections with shadows and borders
- Responsive grid for statistics
- Modal overlays with backdrop blur

---

## Acceptance Criteria Guidelines

### Display & Navigation
- [ ] All four hierarchy levels display correctly
- [ ] Expand/collapse functions work at each level
- [ ] Indentation clearly shows parent-child relationships
- [ ] Transaction numbering is sequential and stable
- [ ] Summary statistics calculate correctly
- [ ] Matching Rules column displays for transaction rows only
- [ ] Account Match rule displays on first line in darker text
- [ ] Invoice Match rule displays on second line in lighter text
- [ ] Both matching stages show appropriate text (e.g., "Account Match: ...", "Invoice Match: ...")

### Selection & Actions
- [ ] Checkboxes select/deselect individual transactions
- [ ] Select All toggles all transactions
- [ ] Selected count displays accurately
- [ ] Edit button opens correct modal with transaction data
- [ ] Skip button toggles transaction skip state
- [ ] Visual indicators update immediately

### Single Edit Modal
- [ ] Modal displays current transaction details
- [ ] Invoice allocations are editable
- [ ] Can add new invoice allocations
- [ ] Can remove existing allocations
- [ ] Quick actions are accessible
- [ ] Save updates transaction state
- [ ] Cancel discards changes

### Multi-Edit Modal
- [ ] Modal opens with first selected transaction
- [ ] Progress indicator shows correct position
- [ ] Previous/Next navigation works correctly
- [ ] Previous disabled on first item
- [ ] Next disabled on last item
- [ ] Save & Next advances to next transaction
- [ ] Save & Close closes modal and clears selections
- [ ] Cancel discards all changes and clears selections

### Status & Validation
- [ ] Partially allocated transactions show yellow background
- [ ] Fully allocated transactions show blue status
- [ ] Unallocated amounts display in orange
- [ ] Status updates when allocations change
- [ ] Posting readiness calculated correctly

### Visual Feedback
- [ ] Row hover states provide feedback
- [ ] Selected rows highlight in blue
- [ ] Skipped rows show red tint and line-through
- [ ] Status pills display correct colors
- [ ] Currency formats correctly

### Data Integrity
- [ ] Hierarchy relationships maintained through edits
- [ ] Amounts aggregate correctly at each level
- [ ] State changes persist until refresh/save
- [ ] No data loss when navigating between modals

---

## Known Limitations

1. **Quick Actions** - Auto-Match, Split Evenly, Clear All are UI placeholders without implementation
2. **Audit Log** - Section exists but not populated
3. **Remove Invoice** - Button exists but functionality not implemented
4. **Posting** - No actual posting mechanism, only readiness check
5. **Save Changes** - Modal saves update state but don't persist to backend
6. **Add New Allocation** - Button exists but form not implemented

---

## Future Enhancement Opportunities

1. Implement quick action algorithms
2. Add audit logging with timestamps and user tracking
3. Enable invoice removal functionality
4. Create posting workflow with confirmation
5. Add validation rules engine
6. Implement backend persistence
7. Add keyboard shortcuts for navigation
8. Enable filtering/searching transactions
9. Add export capabilities
10. Implement undo/redo functionality
