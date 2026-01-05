# Cash Application / Lockbox - Data Structure Mapping

Based on the legacy CBIL system, this document outlines the data structures for each section of the new prototype.

---

## 1. FILES Section (Top Left)

**Purpose:** Search and view imported batch files by date range. Select a file to load its transactions.

### Search Criteria
- **Date From** - Start date for file search
- **Date To** - End date for file search
- **Only Uncompleted Files** - Checkbox filter for files with remaining unallocated transactions

### File/Batch Record Display
Each row represents a daily import file with summary statistics:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `dateFrom` | Date | 20/11/2025 | Batch start date |
| `dateTo` | Date | 20/11/2025 | Batch end date |
| `totalTransactions` | Number | 5,104 | Total transactions in file |
| `totalAmount` | Decimal | $13,672.45 | Total dollar amount |
| `numberSkipped` | Number | 0 | Count of skipped transactions |
| `amountSkipped` | Decimal | $0.00 | Dollar amount skipped |
| `numberToProcess` | Number | 2,124 | Remaining unallocated count |
| `amountToProcess` | Decimal | $11,171.28 | Remaining unallocated amount |
| `deleted` | Boolean | false | Soft delete flag |

**Key Behavior:**
- Clicking a file row loads its transactions into the middle section
- Progress is shown via "To Process" columns (remaining work)
- Delete button (X) soft-deletes the file

---

## 2. BATCH Section (Top Right)

**Purpose:** Import new files and track generated accounting batches.

### Import Controls
- **File Name** - Path to bank file for import
- **Transaction Types** - Checkboxes for AP, AR, BR transaction types to include
- **Browse** button to select file
- **Import File** button to trigger import

### Batch Tracking Table
When files are imported and rules are run, accounting batches are created:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `batchNumber` | String | 90010104 | Unique batch identifier |
| `status` | String | Accepted | Status: Pending, Accepted, Posted |
| `date` | Date | 21/11/2025 | Batch creation date |
| `numberTransactions` | Number | 2,986 | Transaction count in batch |
| `amount` | Decimal | $2,500,483.75 | Total batch amount |

**Key Behavior:**
- Each import creates a new batch
- Batch shows post-allocation edits before final posting
- User can track who last updated and when
- Export to Excel functionality

---

## 3. TRANSACTIONS Section (Middle)

**Purpose:** Display all transactions from the selected file. Users can review, skip, or manually allocate.

### Transaction Table

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | String | txn_001 | Unique transaction ID |
| `skip` | Boolean | ☐ | Checkbox to exclude from processing |
| `bankAccount` | String | 01-0102-00... | Bank account number |
| `date` | Date | 20/11/2025 | Transaction date |
| `particulars` | String | 2105372 | Reference/particulars field |
| `code` | String | 202519 | Additional code (optional) |
| `reference` | String | 465574l | Bank reference number |
| `otherParty` | String | SHIEFF ANG... | Customer/party name |
| `amount` | Decimal | $437.43 | Transaction amount |
| `remaining` | Decimal | $0.00 | Unallocated amount remaining |
| `batchNumber` | String | 90010104 | Associated batch |
| `lockedBy` | String | FIS\Geeta.s | User with edit lock |
| `lockStarted` | DateTime | - | Lock timestamp |
| `lastUpdatedBy` | String | FIS\Geeta.s | Last modifier |
| `lastUpdatedOn` | DateTime | 21/11/2025 09:15 | Last update time |

### Relationships
- **allocations[]** - Array of allocation IDs linked to this transaction
- **rulesApplied[]** - Array of rule IDs that matched this transaction

**Key Behavior:**
- Row selection shows details in bottom panels (Rules + Allocation)
- Hover highlights row
- Skip checkbox excludes non-customer payments (like fees, interest)
- Remaining = 0.00 indicates fully allocated
- Color coding: Yellow highlight = currently selected

---

## 4. RULES Section (Bottom Left)

**Purpose:** Display which auto-allocation rules were applied to the selected transaction.

### Rule Record

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | String | rule_001 | Unique rule ID |
| `name` | String | CODE = 2105372 | Human-readable rule description |
| `criteria` | Array | [see below] | Matching conditions |
| `action` | Object | {type, target} | What to do when matched |
| `createdBy` | String | File-Format-Update | Rule creator |
| `createdOn` | DateTime | 16/11/2016 11:10:10 | Creation timestamp |
| `priority` | Number | 1 | Execution order (lower first) |
| `enabled` | Boolean | true | Active status |

### Criteria Structure (AND logic)
```javascript
criteria: [
  {
    field: 'CODE' | 'PARTICULARS' | 'REFERENCE' | 'OTHER_PARTY',
    operator: '=' | 'CONTAINS' | 'STARTS_WITH' | 'REGEX',
    value: '2105372'
  }
]
```

### Action Structure
```javascript
action: {
  type: 'AUTO_ALLOCATE' | 'HOLD' | 'SKIP' | 'MANUAL_REVIEW',
  target: 'Customer' | 'Suspense' | 'Specific_Account'
}
```

**Key Behavior:**
- Shows all rules that matched the selected transaction
- Rules run in priority order
- Multiple rules can apply to same transaction
- Rule management (New, Save, Delete) buttons visible

---

## 5. ALLOCATION Section (Bottom Right)

**Purpose:** Show how the selected transaction was allocated to customer/invoice.

### Allocation Tabs
- **New Allocation in Customer Ageing** - Create customer allocation
- **User Defined Allocation** - Manual custom allocation

### Allocation Record

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | String | alloc_001 | Unique allocation ID |
| `transactionId` | String | txn_001 | Parent transaction |
| `billingPeriod` | String | 202519 | Billing period code |
| `customerId` | String | 2105372 | Customer identifier |
| `customerName` | String | Shieff Angland GSS | Full customer name |
| `invoiceNumber` | String | INV-202519-001 | Invoice allocated against |
| `allocatedAmount` | Decimal | $437.43 | Amount applied to invoice |
| `allocationType` | String | AUTO | AUTO or MANUAL |
| `allocatedBy` | String | Auto-Generated | User or system |
| `allocatedOn` | DateTime | 21/11/2025 07:19:16 | Allocation timestamp |
| `status` | String | Allocated | Allocated, Partial, Unallocated |
| `processed` | Boolean | true | Posted to accounting |

**Key Behavior:**
- Shows billing period context
- Displays customer and allocated invoice
- "Allocated" badge shows completion status
- Process/Save buttons for finalizing
- Lookup and Add buttons for manual allocation

---

## Data Flow

```
1. Import File → Creates Batch → Runs Rules → Generates Allocations
2. File appears in Files section with summary
3. Select File → Loads Transactions
4. Select Transaction → Shows Rules Applied + Allocations
5. Edit/Skip transactions → Update Batch
6. Process Batch → Posts to accounting system
```

## Key Improvements for New Design

1. **Better File Management**
   - Separate file search from import
   - Show file import history
   - Progress indicators

2. **Enhanced Transaction View**
   - Filtering and sorting
   - Bulk operations (skip multiple)
   - Real-time remaining balance updates

3. **Smart Rules**
   - Visual rule builder
   - Rule testing before save
   - Rule performance metrics

4. **Clearer Allocations**
   - Split allocations across multiple invoices
   - Allocation suggestions
   - Undo capability before posting

5. **Modern UX**
   - Responsive design
   - Keyboard shortcuts
   - Audit trail visibility
   - Real-time collaboration indicators
