// Mock data for lockbox validation scenarios
// Represents the state AFTER lockbox rules processing but BEFORE posting

// Hierarchical structure: Files → Transactions → Invoices → Line Items
export const mockLockboxFiles = [
  {
    id: 'LB-FRW-20251201',
    fileName: 'LB-FRW-20251201.csv',
    uploadedAt: '2025-12-01T09:15:00Z',
    totalPayments: 5,
    totalAmount: 6675.00,
    status: 'awaiting_review',
    expanded: true,
    transactions: [
      {
        id: 'payment-123456',
        amount: 1200.00,
        reference: 'INV001-INV015',
        otherParty: 'Acme Corporation',
        date: '2025-11-30',
        bankAccount: 'B061801',
        status: 'needs_review',
        accountMatchRule: 'lbr-2',
        accountMatchExplanation: 'Account Match: Customer Name Match',
        invoiceMatchRule: 'cas-3',
        invoiceMatchExplanation: 'Invoice Match: Multi-Invoice Split',
        expanded: false,
        issues: ['unallocated_remainder', 'allocation_split_required'],
        invoices: [
          {
            id: 'inv-001',
            invoiceNumber: 'INV-001',
            customerId: 'ACME001',
            customerName: 'Acme Corporation',
            proposedAmount: 500.00,
            status: 'proposed',
            expanded: false,
            lineItems: [
              { id: 'line-001-1', description: 'Professional Services - Nov', amount: 300.00, status: 'proposed', matchDescription: 'Payment amount matched line item amount' },
              { id: 'line-001-2', description: 'Travel Expenses', amount: 200.00, status: 'proposed', matchDescription: 'Payment less than line item amount but within write off threshold' }
            ]
          },
          {
            id: 'inv-015',
            invoiceNumber: 'INV-015',
            customerId: 'ACME001',
            customerName: 'Acme Corporation',
            proposedAmount: 300.00,
            status: 'proposed',
            expanded: false,
            lineItems: [
              { id: 'line-015-1', description: 'Consulting Hours', amount: 300.00, status: 'proposed', matchDescription: 'Payment amount matched line item amount' }
            ]
          }
        ],
        unallocatedAmount: 400.00
      },
      {
        id: 'payment-567890',
        amount: 800.00,
        reference: 'INV-002',
        otherParty: 'Beta Industries',
        date: '2025-11-30',
        bankAccount: 'B061801',
        status: 'valid',
        accountMatchRule: 'lbr-2',
        accountMatchExplanation: 'Account Match: Customer Name Match',
        invoiceMatchRule: 'cas-1',
        invoiceMatchExplanation: 'Invoice Match: Invoice Number Exact Match',
        expanded: false,
        issues: [],
        invoices: [
          {
            id: 'inv-002',
            invoiceNumber: 'INV-002',
            customerId: 'BETA001',
            customerName: 'Beta Industries',
            proposedAmount: 800.00,
            status: 'valid',
            expanded: false,
            lineItems: [
              { id: 'line-002-1', description: 'Software License', amount: 600.00, status: 'valid', matchDescription: 'Payment amount matched line item amount' },
              { id: 'line-002-2', description: 'Support Contract', amount: 200.00, status: 'valid', matchDescription: 'Payment amount matched line item amount' }
            ]
          }
        ],
        unallocatedAmount: 0
      },
      {
        id: 'payment-901234',
        amount: 1500.00,
        reference: 'Payment for services',
        otherParty: 'Gamma LLC',
        date: '2025-11-30',
        bankAccount: 'B061801',
        status: 'needs_review',
        accountMatchRule: 'lbr-2',
        accountMatchExplanation: 'Account Match: Customer Name Match',
        invoiceMatchRule: null,
        invoiceMatchExplanation: 'Invoice Match: No matching invoices found',
        expanded: false,
        issues: ['no_match_found', 'manual_allocation_required'],
        invoices: [],
        unallocatedAmount: 1500.00
      },
      {
        id: 'payment-345678',
        amount: 975.00,
        reference: 'ACC-B061801-945.50',
        otherParty: 'Delta Corp',
        date: '2025-11-30',
        bankAccount: 'B061801',
        status: 'valid',
        accountMatchRule: 'lbr-1',
        accountMatchExplanation: 'Account Match: Account ID in Reference',
        invoiceMatchRule: 'cas-2',
        invoiceMatchExplanation: 'Invoice Match: Amount Match with Tolerance',
        expanded: false,
        issues: [],
        invoices: [
          {
            id: 'inv-088',
            invoiceNumber: 'INV-088',
            customerId: 'DELTA001',
            customerName: 'Delta Corp',
            proposedAmount: 975.00,
            status: 'valid',
            expanded: false,
            lineItems: [
              { id: 'line-088-1', description: 'Monthly Subscription', amount: 975.00, status: 'valid', matchDescription: 'Payment amount matched line item amount' }
            ]
          }
        ],
        unallocatedAmount: 0
      },
      {
        id: 'payment-789012',
        amount: 2200.00,
        reference: 'INV-201 INV-202 INV-203',
        otherParty: 'Echo Enterprises',
        date: '2025-11-30',
        bankAccount: 'B061801',
        status: 'needs_review',
        accountMatchRule: 'lbr-2',
        accountMatchExplanation: 'Account Match: Customer Name Match',
        invoiceMatchRule: 'cas-3',
        invoiceMatchExplanation: 'Invoice Match: Multi-Invoice Split',
        expanded: false,
        issues: ['unallocated_remainder', 'verify_allocation_amounts'],
        invoices: [
          {
            id: 'inv-201',
            invoiceNumber: 'INV-201',
            customerId: 'ECHO001',
            customerName: 'Echo Enterprises',
            proposedAmount: 750.00,
            status: 'proposed',
            expanded: false,
            lineItems: [
              { id: 'line-201-1', description: 'Product A', amount: 450.00, status: 'proposed', matchDescription: 'Payment greater than line item amount - partial allocation' },
              { id: 'line-201-2', description: 'Shipping', amount: 300.00, status: 'proposed', matchDescription: 'Payment less than line item amount but within write off threshold' }
            ]
          },
          {
            id: 'inv-202',
            invoiceNumber: 'INV-202',
            customerId: 'ECHO001',
            customerName: 'Echo Enterprises',
            proposedAmount: 820.00,
            status: 'proposed',
            expanded: false,
            lineItems: [
              { id: 'line-202-1', description: 'Product B', amount: 820.00, status: 'proposed', matchDescription: 'Payment amount matched line item amount' }
            ]
          },
          {
            id: 'inv-203',
            invoiceNumber: 'INV-203',
            customerId: 'ECHO001',
            customerName: 'Echo Enterprises',
            proposedAmount: 400.00,
            status: 'proposed',
            expanded: false,
            lineItems: [
              { id: 'line-203-1', description: 'Service Fee', amount: 400.00, status: 'proposed', matchDescription: 'Payment greater than line item amount - partial allocation' }
            ]
          }
        ],
        unallocatedAmount: 230.00
      },
      {
        id: 'payment-999888',
        amount: 1150.00,
        reference: 'Payment - no invoice specified',
        otherParty: 'Foxtrot Solutions',
        date: '2025-11-30',
        bankAccount: 'B061801',
        status: 'needs_review',
        accountMatchRule: 'lbr-2',
        accountMatchExplanation: 'Account Match: Customer Name Match',
        invoiceMatchRule: null,
        invoiceMatchExplanation: 'Invoice Match: No matching invoices found',
        expanded: false,
        issues: ['no_match_found', 'manual_allocation_required'],
        invoices: [],
        unallocatedAmount: 1150.00
      }
    ]
  }
];

// LOCKBOX MATCHING RULES - Match payments to customers/accounts
export const lockboxMatchingRules = {
  'lbr-1': {
    id: 'lbr-1',
    name: 'Account ID in Reference',
    type: 'lockbox_matching',
    description: 'Match payment to customer by finding account ID in reference field',
    logic: 'IF payment_reference CONTAINS customer_account_id THEN assign_to_customer',
    matchedCount: 25,
    confidence: 'high',
    limitations: [],
    examples: [
      {
        payment: 'ACC-B061801-945.50',
        accountId: 'B061801',
        customer: 'Delta Corp',
        confidence: 'high'
      }
    ]
  },
  'lbr-2': {
    id: 'lbr-2',
    name: 'Customer Name Match',
    type: 'lockbox_matching',
    description: 'Match payment to customer by comparing other party name',
    logic: 'IF payment_other_party FUZZY_MATCHES customer_name THEN assign_to_customer',
    matchedCount: 18,
    confidence: 'medium',
    limitations: [
      'Cannot handle name variations well',
      'May require exact or very close match'
    ]
  },
  'lbr-3': {
    id: 'lbr-3',
    name: 'Bank Account Matching',
    type: 'lockbox_matching',
    description: 'Match payment to customer by bank account number',
    logic: 'IF payment_bank_account EQUALS customer_bank_account THEN assign_to_customer',
    matchedCount: 12,
    confidence: 'high',
    limitations: []
  }
};

// CASH APPLICATION STRATEGIES - Match payments to specific invoices
export const cashApplicationStrategies = {
  'cas-1': {
    id: 'cas-1',
    name: 'Invoice Number Exact Match',
    type: 'cash_application',
    description: 'Match payment reference to invoice number (exact)',
    logic: 'IF payment_reference CONTAINS invoice_number THEN allocate_to_invoice',
    matchedCount: 18,
    confidence: 'high',
    limitations: [],
    examples: [
      {
        payment: 'REF: INV-001',
        invoice: 'INV-001',
        confidence: 'high'
      }
    ]
  },
  'cas-2': {
    id: 'cas-2',
    name: 'Amount Match with Tolerance',
    type: 'cash_application',
    description: 'Match payment to invoice by amount within 5% tolerance',
    logic: 'IF ABS(payment_amount - invoice_amount) < 5% THEN allocate_to_invoice',
    matchedCount: 12,
    confidence: 'medium',
    limitations: [
      'Cannot calculate percentage - uses fixed tolerance only',
      'May match wrong invoice if multiple similar amounts exist'
    ]
  },
  'cas-3': {
    id: 'cas-3',
    name: 'Multi-Invoice Split',
    type: 'cash_application',
    description: 'Find multiple invoice numbers in reference field and split payment',
    logic: 'IF payment_reference CONTAINS multiple_invoice_patterns THEN suggest_split',
    matchedCount: 5,
    confidence: 'low',
    issues: [
      'Cannot determine allocation split automatically',
      'No AND/OR logic available for complex matching',
      'Requires manual allocation decision'
    ]
  },
  'cas-4': {
    id: 'cas-4',
    name: 'Oldest Invoice First',
    type: 'cash_application',
    description: 'Apply payment to oldest outstanding invoice first',
    logic: 'ORDER invoices BY due_date ASC THEN allocate_sequentially',
    matchedCount: 8,
    confidence: 'medium',
    limitations: [
      'May not match customer intent',
      'Cannot handle partial payments well'
    ]
  }
};

// Combined rules for easy lookup
export const ruleExplanations = {
  ...lockboxMatchingRules,
  ...cashApplicationStrategies
};

// Individual payment allocations with their status and issues
export const mockPaymentAllocations = {
  'payment-1234': {
    id: 'payment-1234',
    amount: 1200.00,
    reference: 'INV001-INV015',
    otherParty: 'Acme Corporation',
    date: '2025-11-30',
    bankAccount: 'B061801',
    status: 'needs_review',
    accountMatchRule: 'lbr-2',
    accountMatchExplanation: 'Account Match: Customer Name Match',
    invoiceMatchRule: 'cas-3',
    invoiceMatchExplanation: 'Invoice Match: Multi-Invoice Split',
    proposedAllocations: [
      {
        invoiceNumber: 'INV-001',
        amount: 500.00,
        customerId: 'ACME001',
        customerName: 'Acme Corporation'
      },
      {
        invoiceNumber: 'INV-015',
        amount: 300.00,
        customerId: 'ACME001',
        customerName: 'Acme Corporation'
      }
    ],
    unallocatedAmount: 400.00,
    issues: [
      'unallocated_remainder',
      'account_assignment_needed',
      'allocation_split_required'
    ],
    userAction: null
  },
  'payment-5678': {
    id: 'payment-5678',
    amount: 800.00,
    reference: 'INV-002',
    otherParty: 'Beta Industries',
    date: '2025-11-30',
    bankAccount: 'B061801',
    status: 'valid',
    accountMatchRule: 'lbr-2',
    accountMatchExplanation: 'Account Match: Customer Name Match',
    invoiceMatchRule: 'cas-1',
    invoiceMatchExplanation: 'Invoice Match: Invoice Number Exact Match',
    proposedAllocations: [
      {
        invoiceNumber: 'INV-002',
        amount: 800.00,
        customerId: 'BETA001',
        customerName: 'Beta Industries'
      }
    ],
    unallocatedAmount: 0,
    issues: [],
    userAction: null
  },
  'payment-9012': {
    id: 'payment-9012',
    amount: 1500.00,
    reference: 'Payment for services',
    otherParty: 'Gamma LLC',
    date: '2025-11-30',
    bankAccount: 'B061801',
    status: 'needs_review',
    accountMatchRule: 'lbr-2',
    accountMatchExplanation: 'Account Match: Customer Name Match',
    invoiceMatchRule: null,
    invoiceMatchExplanation: 'Invoice Match: No matching invoices found',
    proposedAllocations: [],
    unallocatedAmount: 1500.00,
    issues: [
      'no_match_found',
      'manual_allocation_required'
    ],
    userAction: null
  },
  'payment-3456': {
    id: 'payment-3456',
    amount: 975.00,
    reference: 'ACC-B061801-945.50',
    otherParty: 'Delta Corp',
    date: '2025-11-30',
    bankAccount: 'B061801',
    status: 'valid',
    accountMatchRule: 'lbr-1',
    accountMatchExplanation: 'Account Match: Account ID in Reference',
    invoiceMatchRule: 'cas-2',
    invoiceMatchExplanation: 'Invoice Match: Amount Match with Tolerance',
    proposedAllocations: [
      {
        invoiceNumber: 'INV-088',
        amount: 975.00,
        customerId: 'DELTA001',
        customerName: 'Delta Corp'
      }
    ],
    unallocatedAmount: 0,
    issues: [],
    userAction: null
  },
  'payment-7890': {
    id: 'payment-7890',
    amount: 2200.00,
    reference: 'INV-201 INV-202 INV-203',
    otherParty: 'Echo Enterprises',
    date: '2025-11-30',
    bankAccount: 'B061801',
    status: 'needs_review',
    accountMatchRule: 'lbr-2',
    accountMatchExplanation: 'Account Match: Customer Name Match',
    invoiceMatchRule: 'cas-3',
    invoiceMatchExplanation: 'Invoice Match: Multi-Invoice Split',
    proposedAllocations: [
      {
        invoiceNumber: 'INV-201',
        amount: 750.00,
        customerId: 'ECHO001',
        customerName: 'Echo Enterprises'
      },
      {
        invoiceNumber: 'INV-202',
        amount: 820.00,
        customerId: 'ECHO001',
        customerName: 'Echo Enterprises'
      },
      {
        invoiceNumber: 'INV-203',
        amount: 400.00,
        customerId: 'ECHO001',
        customerName: 'Echo Enterprises'
      }
    ],
    unallocatedAmount: 230.00,
    issues: [
      'unallocated_remainder',
      'verify_allocation_amounts'
    ],
    userAction: null
  }
};

// Generate more valid payments for realistic volume
const generateValidPayments = () => {
  const validPayments = {};
  const companies = [
    'Alpha Solutions', 'Bravo Corp', 'Charlie Ltd', 'Echo Systems',
    'Foxtrot Inc', 'Golf Industries', 'Hotel Group', 'India Tech',
    'Juliet Logistics', 'Kilo Manufacturing', 'Lima Services', 'Mike Trading'
  ];

  for (let i = 0; i < 30; i++) {
    const paymentId = `payment-valid-${1000 + i}`;
    const company = companies[i % companies.length];
    const invoiceNum = `INV-${String(300 + i).padStart(3, '0')}`;
    const amount = Math.round((Math.random() * 2000 + 200) * 100) / 100;

    const useInvoiceMatch = Math.random() > 0.5;

    validPayments[paymentId] = {
      id: paymentId,
      amount,
      reference: invoiceNum,
      otherParty: company,
      date: '2025-11-30',
      bankAccount: 'B061801',
      status: 'valid',
      accountMatchRule: 'lbr-2',
      accountMatchExplanation: 'Account Match: Customer Name Match',
      invoiceMatchRule: useInvoiceMatch ? 'cas-1' : 'cas-2',
      invoiceMatchExplanation: useInvoiceMatch ? 'Invoice Match: Invoice Number Exact Match' : 'Invoice Match: Amount Match with Tolerance',
      proposedAllocations: [
        {
          invoiceNumber: invoiceNum,
          amount,
          customerId: company.substring(0, 4).toUpperCase() + '001',
          customerName: company
        }
      ],
      unallocatedAmount: 0,
      issues: [],
      userAction: null
    };
  }

  return validPayments;
};

// Combine all payment data
export const allPaymentAllocations = {
  ...mockPaymentAllocations,
  ...generateValidPayments()
};

// Available invoices for manual allocation (used in correction modal)
export const availableInvoices = {
  'ACME001': [
    { invoiceNumber: 'INV-001', amount: 500.00, dueDate: '2025-12-15', status: 'outstanding' },
    { invoiceNumber: 'INV-015', amount: 300.00, dueDate: '2025-12-20', status: 'outstanding' },
    { invoiceNumber: 'INV-025', amount: 150.00, dueDate: '2025-12-25', status: 'outstanding' }
  ],
  'ECHO001': [
    { invoiceNumber: 'INV-201', amount: 750.00, dueDate: '2025-12-10', status: 'outstanding' },
    { invoiceNumber: 'INV-202', amount: 820.00, dueDate: '2025-12-12', status: 'outstanding' },
    { invoiceNumber: 'INV-203', amount: 400.00, dueDate: '2025-12-18', status: 'outstanding' },
    { invoiceNumber: 'INV-204', amount: 600.00, dueDate: '2025-12-22', status: 'outstanding' }
  ]
};

// Issue type definitions for better UX messaging
export const issueTypes = {
  'unallocated_remainder': {
    label: 'Unallocated Remainder',
    description: 'Payment has remaining amount not allocated to any invoice',
    severity: 'warning',
    icon: 'AlertTriangle'
  },
  'account_assignment_needed': {
    label: 'Account Assignment Needed',
    description: 'Remainder amount needs account assignment',
    severity: 'warning',
    icon: 'Settings'
  },
  'allocation_split_required': {
    label: 'Allocation Split Required',
    description: 'Manual decision needed on how to split payment across invoices',
    severity: 'warning',
    icon: 'Split'
  },
  'no_match_found': {
    label: 'No Match Found',
    description: 'No lockbox rules matched this payment',
    severity: 'error',
    icon: 'X'
  },
  'manual_allocation_required': {
    label: 'Manual Allocation Required',
    description: 'Payment requires manual processing',
    severity: 'info',
    icon: 'Edit'
  },
  'verify_allocation_amounts': {
    label: 'Verify Allocation Amounts',
    description: 'Please verify the proposed allocation amounts are correct',
    severity: 'warning',
    icon: 'CheckCircle'
  }
};