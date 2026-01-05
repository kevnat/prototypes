Based on the Granola notes, here's a comprehensive revision of your stakeholder communication and design requirements:

---

## 1. Revised Stakeholder Notes - Lockbox Processing Critical Issues

### Executive Summary
Freightways lockbox processing is **blocked from go-live** due to fundamental gaps in visibility, rules functionality, and reconciliation workflow. Current system provides less control than manual processing while requiring the same staffing levels.

---

### Critical Blockers Identified

#### **1. Zero Visibility into Lockbox Processing**
**Current State:**
- Files accumulate in lockbox system with no actionable transparency
- Users cannot see what lockbox rules are doing or why
- No ability to edit, delete, or modify files or individual line items
- Processing happens in a "black box" - allocations appear without explanation

**Business Impact:**
- Cannot verify accuracy before posting
- No way to correct errors within lockbox workflow
- Forces workarounds via payment screen (inefficient, error-prone)
- Worse than manual matching process they're trying to replace

#### **2. Rules Engine Insufficient for Requirements**
**Functional Gaps:**
- ❌ No "contains" functionality (only exact equals matching)
- ❌ Cannot perform AND/OR logical operations
- ❌ No calculation capabilities (e.g., compare invoice vs payment amounts)
- ❌ **Core failure**: Cannot handle multiple invoices paid by single payment

**Accuracy Requirements vs Reality:**
- **Need**: 80% matching accuracy to specific invoices
- **Current**: Rules cannot achieve this level - extensive work with Guru, Renee, and Kevin hit hard functionality walls

#### **3. Data Integration Issue**
**Blocking Item:**
- Freightways account number missing from uploaded files
- Guru's team unable to resolve due to technical limitations
- Without this, proper reconciliation cannot occur

---

### Required Capabilities - Must Have for Go-Live

#### **Immediate Need: Pre-Post Review & Validation Interface**

**User Story:**
As a Freightways AR specialist, I need to review and validate all proposed allocations from lockbox rules before posting, so I can ensure accuracy and correct errors without leaving the lockbox workflow.

**Required Features:**

1. **Allocation Preview Screen** (before posting)
   - Show ALL proposed allocations from lockbox file processing
   - Display what rules matched and why (rule transparency)
   - Highlight unallocated amounts with reasons
   - Show confidence level or match quality per allocation

2. **In-Line Correction Capabilities**
   - Edit allocations within lockbox interface
   - Modify invoice assignments
   - Adjust allocation amounts
   - Handle remainders (unapplied payments)
   - Reassign accounts when needed

3. **Manual Posting Control**
   - User-initiated posting (not automatic)
   - Cannot post until all validations pass
   - Clear separation: what's allocated in lockbox vs what needs payment screen handling
   - Confidence checkpoint before committing transactions

4. **Visibility & Transparency**
   - Which rule triggered each allocation
   - Why items remain unallocated
   - What data was used for matching
   - History/audit trail of corrections made

**Critical Business Logic:**
"Need to see what's left for payment screen handling" - Clear handoff between lockbox-allocated items and items requiring manual payment screen processing.

---

### Two-Path Strategy to Unblock Go-Live

Fiona emphasized both paths are needed; visibility is required **regardless** of rule accuracy improvements.

#### **Path 1: Improve Rules Engine (Long-term)**
**Target**: 80%+ automatic matching accuracy to invoices

**Requirements:**
- Add "contains" matching functionality
- Implement AND/OR logical operations
- Add calculation capabilities for amount comparisons
- Support multi-invoice payment scenarios
- **Scope Expansion**: This requires cash application rules fixes (broader than lockbox alone)

**Escalation**: Kevin to escalate rules limitations to Leo (CTO)

#### **Path 2: Full Visibility & Review Workflow (Immediate)**
**Target**: Enable Freightways to verify and correct all allocations before posting

**Requirements:**
- Pre-post validation interface (described above)
- Rule transparency (show which rules fired and why)
- In-lockbox editing capabilities
- Manual posting control

**Priority**: This is the **minimum viable** solution to enable go-live while Path 1 progresses

---

### What Success Looks Like

**Freightways Go-Live Criteria:**
1. ✅ Can see all proposed allocations before they're posted
2. ✅ Understand why each allocation was made (or wasn't made)
3. ✅ Can correct allocations within lockbox workflow
4. ✅ Control when posting occurs (manual trigger)
5. ✅ 80% of payments automatically match to correct invoices
6. ✅ Clear handoff for items requiring payment screen processing

**Current State Assessment:**
- Current system is worse than manual matching
- Cannot go live with existing capabilities
- Need staffing for manual review regardless of automation level

---

### Action Items & Ownership

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Escalate rules limitations to Leo (CTO) | Kevin | This week | Pending |
| Scope expansion: include cash application rules | Kevin + Leo | TBD | Pending |
| Technical review of visibility requirements | Fiona & James | After escalation | Pending |
| Design pre-post validation interface | Kevin | This week | In progress |
| Resolve account number data issue | Guru's team | Escalated | Blocked |

---

### Next Steps
- **This Week**: Kevin escalates to Leo with technical details
- **Follow-up Sync**: Later this week with updates on escalation
- **Design Iteration**: Build prototype of pre-post validation interface
- **Technical Review**: Fiona and James to validate accuracy of technical explanations

---

## 2. Updated Design Requirements for CashAppPrototype.jsx

Based on the meeting context, here are the refined requirements:

### New Primary Component: Lockbox Pre-Post Validation Interface

**Purpose**: Address the "black box" problem by showing users exactly what the system proposes to do before any posting occurs.

---

### Component Architecture

```jsx
// File: src/components/prototypes/LockboxValidationScreen.jsx

/**
 * PRE-POST VALIDATION INTERFACE
 * 
 * This screen appears AFTER lockbox rules processing but BEFORE posting.
 * Users review all proposed allocations and resolve issues before committing.
 */
```

---

### Screen Layout & Sections

#### **1. File Summary Header**
```jsx
<FileHeader>
  File: LB-FRW-20251201.csv
  Status: Awaiting Review
  Total Payments: 47
  Proposed Allocations: 35 (74%)
  Needs Review: 12 (26%)
  
  [Review All Issues] [Post When Ready]
</FileHeader>
```

#### **2. Rule Transparency Section** ⭐ NEW REQUIREMENT
```jsx
<RuleBreakdown>
  Rules Applied:
  ✓ Rule #1: Match by Invoice Number in reference field (18 matches)
  ✓ Rule #2: Match by account + amount within 5% (12 matches)
  ⚠ Rule #3: Multi-invoice allocation (5 partial matches - need review)
  ❌ No match found: (12 payments - requires manual)
  
  [View Rule Details] [View Unmatched Items]
</RuleBreakdown>
```

#### **3. Allocation Review List** (Main Content)

**Three-Tab Structure:**

**Tab 1: Needs Review (12)**
```jsx
<AllocationCard status="needs_review">
  Payment #1234 - $1,200.00
  Reference: INV001-INV015
  
  Proposed Allocation:
  ├─ INV-001: $500 (Rule #1: Invoice number match)
  └─ INV-015: $300 (Rule #1: Invoice number match)
  
  ⚠ Issues:
  - $400 unallocated remainder
  - Account assignment needed for remainder
  - Rule matched multiple invoices but couldn't determine split
  
  [Review & Correct] [Accept As-Is] [Mark for Payment Screen]
</AllocationCard>
```

**Tab 2: Valid & Ready (35)**
```jsx
<AllocationCard status="valid">
  Payment #5678 - $800.00
  ✓ Fully allocated to INV-002
  ✓ Account: B061801
  ✓ Rule: #1 (Invoice number exact match)
  
  [View Details] [Edit if Needed]
</AllocationCard>
```

**Tab 3: For Payment Screen (0)**
```jsx
// Items marked as "can't be handled in lockbox"
// Will be processed via manual payment screen workflow
```

---

### **4. In-Line Correction Modal** ⭐ CRITICAL

When user clicks "Review & Correct", opens the multi-invoice allocation interface you already built, but with additional context:

```jsx
<CorrectionModal>
  <RuleContext>
    Why this allocation was proposed:
    • Rule #3 matched reference "INV001-INV015"
    • Found invoices INV-001 ($500) and INV-015 ($300)
    • System cannot determine allocation split automatically
    • Requires manual allocation decision
  </RuleContext>
  
  {/* Embed your existing multi-invoice allocation component */}
  <MultiInvoiceAllocationInterface
    paymentAmount={1200}
    suggestedInvoices={[
      { id: 'INV-001', amount: 500 },
      { id: 'INV-015', amount: 300 }
    ]}
    allowUnallocatedRemainder={true}
  />
  
  <Actions>
    [Save Allocation] [Mark for Payment Screen] [Cancel]
  </Actions>
</CorrectionModal>
```

---

### **5. Posting Control Section**

```jsx
<PostingControls>
  Ready to Post: 35 of 47 payments (74%)
  
  Status Breakdown:
  ✓ Valid: 35 payments ($42,500)
  ⚠ Needs Review: 12 payments ($14,200)
  → For Payment Screen: 0 payments
  
  ⚠ Cannot post until all payments are either:
     • Fully allocated and valid
     • Marked for payment screen handling
  
  [Post Valid Allocations (35)] [Review Issues First]
  [Mark All Unmatched for Payment Screen]
</PostingControls>
```

---

### Key State Management

```javascript
const [lockboxFile, setLockboxFile] = useState({
  id: 'LB-FRW-20251201',
  totalPayments: 47,
  allocations: [],
  rulesApplied: [],
  statistics: {
    valid: 35,
    needsReview: 12,
    forPaymentScreen: 0
  }
});

const [allocationStatuses, setAllocationStatuses] = useState({
  'payment-1234': {
    status: 'needs_review',
    issues: ['unallocated_remainder', 'account_needed'],
    proposedBy: 'rule-3',
    ruleExplanation: 'Matched multiple invoices in reference field',
    userAction: null
  }
});

const [canPost, setCanPost] = useState(false);

// Calculate if posting is allowed
useEffect(() => {
  const allResolved = Object.values(allocationStatuses).every(
    a => a.status === 'valid' || a.status === 'marked_for_payment_screen'
  );
  setCanPost(allResolved);
}, [allocationStatuses]);
```

---

### Rule Transparency Data Structure

```javascript
const ruleExplanations = {
  'rule-1': {
    name: 'Invoice Number Exact Match',
    logic: 'Match payment reference to invoice number (exact)',
    matchedCount: 18,
    examples: [
      {
        payment: 'REF: INV-001',
        invoice: 'INV-001',
        confidence: 'high'
      }
    ]
  },
  'rule-2': {
    name: 'Account + Amount Fuzzy Match',
    logic: 'Match by account ID AND amount within 5% tolerance',
    matchedCount: 12,
    limitationsEncountered: [
      'Cannot use "contains" - requires exact account match',
      'Cannot calculate percentage - uses fixed tolerance only'
    ]
  },
  'rule-3': {
    name: 'Multi-Invoice Reference Match',
    logic: 'Find multiple invoice numbers in reference field',
    matchedCount: 5,
    issues: [
      'Cannot determine allocation split automatically',
      'No AND/OR logic available for complex matching',
      'Requires manual allocation decision'
    ]
  }
};
```

---

### Critical UX Patterns

#### **1. Progressive Disclosure**
- Start with summary statistics
- Drill down into specific allocations
- Show rule logic only when relevant

#### **2. Clear Handoff Points**
```
Lockbox Processing → [VALIDATION CHECKPOINT] → Either:
                                                ├─ Post to Account (valid)
                                                └─ Send to Payment Screen (manual)
```

#### **3. No Dead Ends**
Every payment must have a clear path forward:
- ✅ Valid and ready to post
- ⚠ Needs review (can be corrected in-place)
- → Marked for payment screen (clear handoff)

#### **4. Rule Transparency**
Always show:
- Which rule created this allocation
- Why that rule fired
- What data it used
- What limitations it encountered

---

### Acceptance Criteria for Validation Screen

**Must Have:**
- [ ] Display all payments from lockbox file before posting
- [ ] Show which rules matched each payment and why
- [ ] Highlight payments needing review with specific issues
- [ ] Enable in-place correction without leaving lockbox
- [ ] Prevent posting until all payments are resolved
- [ ] Clear distinction: lockbox-handled vs payment-screen-handled
- [ ] Rule transparency for debugging/understanding
- [ ] Manual posting trigger (not automatic)

**Nice to Have:**
- [ ] Bulk actions (mark all unmatched for payment screen)
- [ ] Export unallocated items for analysis
- [ ] Rule performance analytics
- [ ] Confidence scores per allocation

---

### Integration with Existing Multi-Invoice Prototype

**Reuse These Components:**
- Multi-invoice selection interface
- Allocation amount inputs with validation
- Unapplied payment remainder handling
- Selected invoices tracking panel
- Real-time validation logic

**New Wrappers Needed:**
- Batch allocation review list
- Rule explanation/transparency layer
- File-level status management
- Posting control interface

---

### Next Iteration Priorities

1. **Immediate**: Build validation screen prototype for stakeholder demo
2. **Short-term**: Add rule transparency/explanation layer
3. **Medium-term**: Integrate with actual lockbox rule engine
4. **Long-term**: Enhance rules engine per Path 1 (AND/OR, contains, calculations)

---

Would you like me to:
1. **Draft the actual React component code** for the validation screen?
2. **Create a user flow diagram** showing the complete lockbox process with validation checkpoint?
3. **Write technical requirements** for the rules engine improvements to share with Leo?