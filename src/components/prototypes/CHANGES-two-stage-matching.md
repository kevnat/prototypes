# Two-Stage Matching System - Changes Summary

## Overview
Updated the lockbox validation system to distinguish between two types of matching rules:
1. **Lockbox Matching Rules** - Payment → Customer/Account
2. **Cash Application Strategies** - Payment → Invoices

## Files Modified

### 1. Mock Data (`/src/data/lockboxValidationMockData.js`)

#### New Data Structures

**Lockbox Matching Rules** - Payment to Customer matching
```javascript
export const lockboxMatchingRules = {
  'lbr-1': { name: 'Account ID in Reference', type: 'lockbox_matching', ... },
  'lbr-2': { name: 'Customer Name Match', type: 'lockbox_matching', ... },
  'lbr-3': { name: 'Bank Account Matching', type: 'lockbox_matching', ... }
};
```

**Cash Application Strategies** - Payment to Invoice allocation
```javascript
export const cashApplicationStrategies = {
  'cas-1': { name: 'Invoice Number Exact Match', type: 'cash_application', ... },
  'cas-2': { name: 'Amount Match with Tolerance', type: 'cash_application', ... },
  'cas-3': { name: 'Multi-Invoice Split', type: 'cash_application', ... },
  'cas-4': { name: 'Oldest Invoice First', type: 'cash_application', ... }
};
```

#### Updated Transaction Properties

**Before:**
```javascript
{
  ruleApplied: 'rule-3',
  ruleExplanation: 'Matched multiple invoices in reference field',
}
```

**After:**
```javascript
{
  accountMatchRule: 'lbr-2',
  accountMatchExplanation: 'Account Match: Customer Name Match',
  invoiceMatchRule: 'cas-3',
  invoiceMatchExplanation: 'Invoice Match: Multi-Invoice Split',
}
```

#### Display Format

- **Account Match**: `"Account Match: {rule name}"`
- **Invoice Match**: `"Invoice Match: {strategy name}"`

### 2. Documentation (`/src/components/prototypes/LockboxValidationScreen-functionality.md`)

#### Added Sections

1. **Two-Stage Matching Process** (new section at top)
   - Explains the distinction between stages
   - Provides examples for each stage
   - Shows display format conventions

2. **Matching Rules & Strategies Reference** (new section)
   - Reference tables for all rules and strategies
   - Confidence levels for each
   - Transaction data model showing both properties

3. **Example User Stories Using Two-Stage Matching** (new section)
   - Story 1: Customer matched, no invoice match
   - Story 2: Both matches successful, partial allocation
   - Story 3: Account matching by reference ID

4. **Flow 5: Understanding Matching Results** (new flow)
   - How users interpret the two-stage matching explanations

#### Updated Sections

- **Technical Dependencies**: Added references to new data exports
- **Data Hierarchy**: Now mentions both stages of matching
- **Mock Data Sources**: Lists new exports separately

## Benefits of Two-Stage Matching

### 1. Clarity for Users
Users can now distinguish between:
- "Payment went to the wrong customer" (stage 1 failure)
- "Payment went to right customer but wrong/no invoices" (stage 2 failure)

### 2. Better Diagnostics
- Clear indication of where in the process matching succeeded or failed
- Helps users understand what manual action is needed
- Reduces confusion about system behavior

### 3. Rule Management
- Lockbox rules can be managed separately from cash application strategies
- Different confidence levels and business logic for each stage
- Easier to add new rules to specific stages

### 4. Audit Trail
- Clear record of how each payment was processed
- Shows which rules were applied at each stage
- Better for compliance and troubleshooting

## Example Scenarios

### Scenario 1: Full Success
```
Account Match: Customer Name Match
Invoice Match: Invoice Number Exact Match
Status: Valid (fully allocated)
```

### Scenario 2: Stage 1 Success, Stage 2 Partial
```
Account Match: Account ID in Reference
Invoice Match: Multi-Invoice Split
Status: Needs Review (partially allocated)
Unallocated: $400
```

### Scenario 3: Stage 1 Success, Stage 2 Failure
```
Account Match: Customer Name Match
Invoice Match: No matching invoices found
Status: Needs Review (fully unallocated)
Unallocated: $1,500
```

### Scenario 4: Both Stages Using High-Confidence Rules
```
Account Match: Account ID in Reference
Invoice Match: Invoice Number Exact Match
Status: Valid (fully allocated)
```

## Implementation Notes

### Component Changes Made
The LockboxValidationScreen component was updated to add a new "Matching Rules" column:

**New Column (Column 8):**
```jsx
// 8. MATCHING RULES COLUMN
columnHelper.accessor('matchingRules', {
  id: 'matchingRules',
  header: 'Matching Rules',
  size: 300,
  cell: ({ row }) => {
    const { type, data: itemData } = row.original;

    if (type === 'transaction') {
      return (
        <div className="flex flex-col space-y-1">
          {/* Account Match Rule */}
          {itemData.accountMatchExplanation && (
            <span className="text-xs text-slate-700 font-medium">
              {itemData.accountMatchExplanation}
            </span>
          )}
          {/* Invoice Match Rule */}
          {itemData.invoiceMatchExplanation && (
            <span className="text-xs text-slate-600">
              {itemData.invoiceMatchExplanation}
            </span>
          )}
        </div>
      );
    }

    return null;
  }
})
```

**Visual Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ Matching Rules                                              │
├─────────────────────────────────────────────────────────────┤
│ Account Match: Customer Name Match         (darker text)    │
│ Invoice Match: Multi-Invoice Split         (lighter text)   │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Account Match: `text-slate-700 font-medium` (darker, bold)
- Invoice Match: `text-slate-600` (lighter)
- Stacked vertically with small gap (`space-y-1`)
- Only displays for transaction rows
- Column width: 300px

### Future UI Enhancement Opportunities
1. Add visual indicators for each matching stage (badges or icons)
2. Show confidence levels with color coding (high=green, medium=yellow, low=orange)
3. Add tooltips explaining each rule type with full rule details
4. Create filters for "Stage 1 failures" vs "Stage 2 failures"
5. Add hover state showing full rule logic
6. Color-code based on match success (green for both matched, yellow for partial, red for none)

### Backward Compatibility
- Old `ruleExplanations` export is preserved (combines both types)
- New code can use specific exports: `lockboxMatchingRules` or `cashApplicationStrategies`
- Existing components continue to work without changes

## Testing Recommendations

### Unit Tests
- Verify all transactions have both `accountMatchRule` and `invoiceMatchRule`
- Confirm explanation text follows format: "Account Match: ..." / "Invoice Match: ..."
- Test null cases (no match found)

### User Acceptance Tests
1. Verify users can distinguish between the two matching stages
2. Confirm display format is clear and consistent
3. Test that users understand what action to take based on which stage failed
4. Validate that audit log shows both matching results

### Integration Tests
- Ensure rule lookup works for both types
- Verify combined `ruleExplanations` includes all rules
- Test filtering/searching by rule type

## Migration Notes

If updating existing data:
1. Map old `ruleApplied` to appropriate stage (lockbox vs cash application)
2. Convert `ruleExplanation` to formatted explanation text
3. Add both `accountMatchRule` and `invoiceMatchRule` properties
4. Set appropriate explanation text for each

## Conclusion

This two-stage matching system provides clear separation of concerns and better user understanding of the automated matching process. The distinction between "finding the right customer" and "finding the right invoices" is now explicit in the data model and user interface.
