# Direct Debit Mandate Feature Implementation Prompt

I need to add Direct Debit Mandate support for non-US countries to the **Payment Links Preview page** (the customer-facing payment UX). Here are the specific requirements:

## Context
- This feature should be added to the "Preview" tab in the PaymentLinksPrototype component
- This is the customer-facing payment form where users enter payment details and submit payments
- The Preview tab contains the payment amount input, payment method selection, and payment form fields

## New Feature: Direct Debit Mandates for Non-US Countries

### Location
- Modify the Preview tab section in `src/components/prototypes/PaymentLinksPrototype.jsx`
- Specifically update the payment form area (lines ~260-410 in the `{activeTab === 'preview' && (` section)

### Requirements
1. Add a currency selector above the existing payment amount field
2. When CAD is selected, show a checkbox for mandate acceptance below the payment method selection
3. Show a modal after payment submission when mandate is checked

### Implementation Details

#### Currency Selector
- Add above the "Payment Amount" section in the Preview tab
- Should be positioned before the existing payment amount and method selection UI
- Options: USD (default), CAD
- When CAD is selected, show additional mandate UI

#### Mandate Checkbox (CAD only)
- Display when currency is CAD
- Checkbox text: "I authorize direct debit mandate for future payments" (or similar)
- Required when CAD is selected
- Position below the payment method selection

#### Payment Flow
- When user clicks "Pay" button and CAD + mandate is checked:
  - Show a modal instead of processing payment immediately
  - Modal content: "Click here to [view mandate](fake-url-here)"
  - Modal should have a close/cancel option

#### Files to Modify
- `src/components/prototypes/PaymentLinksPrototype.jsx` (Preview tab section)
- Add new state for currency selection and mandate acceptance
- Update payment form UI and payment handler logic

#### Styling
- Match existing payment form styling
- Use consistent modal styling with the app's design system

### Implementation Approach
Please implement this feature step by step:
1. Add currency selector state and UI
2. Add conditional mandate checkbox for CAD
3. Update payment handler to show modal when needed
4. Implement the mandate disclosure modal

### I/O Specifications
- **Input**: Customer selects currency (USD or CAD)
- **Conditional Input**: If CAD, customer can check mandate acceptance checkbox
- **Output**: If CAD + mandate checked, show modal with mandate link after clicking Pay
- **Modal Content**: "Click here to [view mandate](fake-url-here)" with close option