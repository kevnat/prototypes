// Mock data for Cash Application prototype

export const mockFiles = [
  {
    id: 'file_001',
    dateFrom: '2025-11-20',
    dateTo: '2025-11-20',
    totalTransactions: 5104,
    totalAmount: 13672.45,
    numberSkipped: 0,
    amountSkipped: 0.00,
    numberToProcess: 2124,
    amountToProcess: 11171.28,
    deleted: false
  },
  {
    id: 'file_002',
    dateFrom: '2025-11-19',
    dateTo: '2025-11-19',
    totalTransactions: 4872,
    totalAmount: 12843.67,
    numberSkipped: 3,
    amountSkipped: 125.50,
    numberToProcess: 0,
    amountToProcess: 0.00,
    deleted: false
  },
  {
    id: 'file_003',
    dateFrom: '2025-11-18',
    dateTo: '2025-11-18',
    totalTransactions: 5234,
    totalAmount: 15234.89,
    numberSkipped: 1,
    amountSkipped: 45.00,
    numberToProcess: 156,
    amountToProcess: 1843.22,
    deleted: false
  }
];

export const mockBatches = [
  {
    batchNumber: '90010104',
    status: 'Accepted',
    date: '2025-11-21',
    numberTransactions: 2986,
    amount: 2500483.75,
    createdBy: 'System',
    createdOn: '2025-11-21T09:00:00',
    lastUpdatedBy: 'FIS\\Geeta.s',
    lastUpdatedOn: '2025-11-21T09:15:00'
  },
  {
    batchNumber: '90010103',
    status: 'Posted',
    date: '2025-11-20',
    numberTransactions: 2845,
    amount: 2389742.33,
    createdBy: 'System',
    createdOn: '2025-11-20T09:00:00',
    lastUpdatedBy: 'FIS\\John.d',
    lastUpdatedOn: '2025-11-20T14:22:00'
  }
];

export const mockTransactionsByFile = {
  'file_001': [
    {
      id: 'txn_001',
      skip: false,
      bankAccount: '01-0102-0022462-000',
      date: '2025-11-20',
      particulars: '2105372',
      code: '',
      reference: '465574l',
      otherParty: 'SHIEFF ANGLAND GSS',
      amount: 437.43,
      remaining: 0.00,
      batchNumber: '90010104',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: 'FIS\\Geeta.s',
      lastUpdatedOn: '2025-11-21T09:15:00',
      allocations: ['alloc_001'],
      rulesApplied: ['rule_011', 'rule_010']
    },
    {
      id: 'txn_002',
      skip: false,
      bankAccount: '01-0102-0012345-000',
      date: '2025-11-20',
      particulars: 'BREVILLE',
      code: '202519',
      reference: '',
      otherParty: 'BREVILLE NZ LTD',
      amount: 103.29,
      remaining: 0.00,
      batchNumber: '90010104',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: 'Auto-Generated',
      lastUpdatedOn: '2025-11-21T07:19:16',
      allocations: ['alloc_002'],
      rulesApplied: ['rule_012']
    },
    {
      id: 'txn_003',
      skip: false,
      bankAccount: '01-0102-0022462-000',
      date: '2025-11-20',
      particulars: '12013424',
      code: '202519',
      reference: 'PAYKEL',
      otherParty: 'F & P APPL LTD',
      amount: 26229.78,
      remaining: 26229.78,
      batchNumber: '90010104',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: null,
      lastUpdatedOn: null,
      allocations: [],
      rulesApplied: []
    },
    {
      id: 'txn_004',
      skip: false,
      bankAccount: '01-0102-0022462-000',
      date: '2025-11-20',
      particulars: 'MITSUI & CO',
      code: '202519',
      reference: '',
      otherParty: 'MITSUI & CO ASIA PACIFIC',
      amount: 269.10,
      remaining: 269.10,
      batchNumber: '90010104',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: null,
      lastUpdatedOn: null,
      allocations: [],
      rulesApplied: []
    },
    {
      id: 'txn_005',
      skip: false,
      bankAccount: '01-0102-0012345-000',
      date: '2025-11-20',
      particulars: 'DENTONS K&N',
      code: '',
      reference: '465574l',
      otherParty: 'DENTONS K&N LAW FIRM',
      amount: 196.65,
      remaining: 0.00,
      batchNumber: '90010104',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: 'FIS\\Geeta.s',
      lastUpdatedOn: '2025-11-21T09:18:00',
      allocations: ['alloc_003'],
      rulesApplied: ['rule_001', 'rule_010']
    },
    {
      id: 'txn_006',
      skip: false,
      bankAccount: '01-0102-0022462-000',
      date: '2025-11-20',
      particulars: 'ANZ ACCOUNT',
      code: 'STEELSERV',
      reference: 'VENDOR PA...',
      otherParty: 'STEELSERV LTD',
      amount: 11.62,
      remaining: 0.00,
      batchNumber: '90010104',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: 'Auto-Generated',
      lastUpdatedOn: '2025-11-21T07:19:16',
      allocations: ['alloc_004'],
      rulesApplied: ['rule_012', 'rule_013']
    }
  ],
  'file_002': [
    {
      id: 'txn_007',
      skip: false,
      bankAccount: '01-0102-0022462-000',
      date: '2025-11-19',
      particulars: '3456789',
      code: '',
      reference: '567890',
      otherParty: 'ACME CORPORATION',
      amount: 1250.00,
      remaining: 0.00,
      batchNumber: '90010103',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: 'Auto-Generated',
      lastUpdatedOn: '2025-11-20T08:12:00',
      allocations: ['alloc_005'],
      rulesApplied: ['rule_013']
    }
  ],
  'file_003': [
    {
      id: 'txn_008',
      skip: false,
      bankAccount: '01-0102-0012345-000',
      date: '2025-11-18',
      particulars: '9876543',
      code: '202518',
      reference: '',
      otherParty: 'GLOBAL SUPPLIES INC',
      amount: 892.45,
      remaining: 892.45,
      batchNumber: '90010102',
      lockedBy: null,
      lockStarted: null,
      lastUpdatedBy: null,
      lastUpdatedOn: null,
      allocations: [],
      rulesApplied: []
    }
  ]
};

export const mockRules = {
  'rule_013': {
    id: 'rule_013',
    ruleId: 13,
    name: 'Match to Customer Number and Oldest First',
    description: 'Fiona Test - Match to Customer Number and Oldest First',
    criteria: [
      {
        field: 'CUSTOMER_NUMBER',
        operator: 'MATCH',
        value: 'Customer Number'
      }
    ],
    action: {
      type: 'AUTO_ALLOCATE',
      target: 'Customer',
      method: 'Oldest Invoice First'
    },
    createdBy: 'Fiona Test',
    createdOn: '2024-03-15T10:22:00',
    priority: 1,
    enabled: true
  },
  'rule_012': {
    id: 'rule_012',
    ruleId: 12,
    name: 'Match by Customer invoice number only - code',
    description: 'Match by Customer invoice number only - code',
    criteria: [
      {
        field: 'CODE',
        operator: 'MATCH',
        value: 'Invoice Number'
      }
    ],
    action: {
      type: 'AUTO_ALLOCATE',
      target: 'Invoice'
    },
    createdBy: 'System',
    createdOn: '2023-08-10T14:30:00',
    priority: 2,
    enabled: true
  },
  'rule_011': {
    id: 'rule_011',
    ruleId: 11,
    name: 'Match by Customer invoice number only - particulars',
    description: 'Match by Customer invoice number only - particulars',
    criteria: [
      {
        field: 'PARTICULARS',
        operator: 'MATCH',
        value: 'Invoice Number'
      }
    ],
    action: {
      type: 'AUTO_ALLOCATE',
      target: 'Invoice'
    },
    createdBy: 'System',
    createdOn: '2023-06-22T09:15:00',
    priority: 3,
    enabled: true
  },
  'rule_001': {
    id: 'rule_001',
    ruleId: 1,
    name: 'Match by Customer invoice number only - reference',
    description: 'Match by Customer invoice number only - reference',
    criteria: [
      {
        field: 'REFERENCE',
        operator: 'MATCH',
        value: 'Invoice Number'
      }
    ],
    action: {
      type: 'AUTO_ALLOCATE',
      target: 'Invoice'
    },
    createdBy: 'System',
    createdOn: '2022-11-08T11:45:00',
    priority: 4,
    enabled: true
  },
  'rule_010': {
    id: 'rule_010',
    ruleId: 10,
    name: 'Match by Customer number only',
    description: 'Match by Customer number only',
    criteria: [
      {
        field: 'OTHER_PARTY',
        operator: 'MATCH',
        value: 'Customer Number'
      }
    ],
    action: {
      type: 'AUTO_ALLOCATE',
      target: 'Customer',
      method: 'Oldest Invoice First'
    },
    createdBy: 'System',
    createdOn: '2022-05-20T16:00:00',
    priority: 5,
    enabled: true
  }
};

export const mockAllocations = {
  'alloc_001': {
    id: 'alloc_001',
    transactionId: 'txn_001',
    billingPeriod: '202519',
    customerId: '2105372',
    customerName: 'Shieff Angland GSS',
    invoiceNumber: 'INV-202519-2105372',
    allocatedAmount: 437.43,
    allocationType: 'AUTO',
    allocatedBy: 'Auto-Generated',
    allocatedOn: '2025-11-21T07:19:16',
    status: 'Allocated',
    processed: true
  },
  'alloc_002': {
    id: 'alloc_002',
    transactionId: 'txn_002',
    billingPeriod: '202519',
    customerId: '3456789',
    customerName: 'Breville NZ Ltd',
    invoiceNumber: 'INV-202519-3456789',
    allocatedAmount: 103.29,
    allocationType: 'AUTO',
    allocatedBy: 'Auto-Generated',
    allocatedOn: '2025-11-21T07:19:16',
    status: 'Allocated',
    processed: true
  },
  'alloc_003': {
    id: 'alloc_003',
    transactionId: 'txn_005',
    billingPeriod: '202519',
    customerId: '7654321',
    customerName: 'Dentons K&N Law Firm',
    invoiceNumber: 'INV-202519-7654321',
    allocatedAmount: 196.65,
    allocationType: 'MANUAL',
    allocatedBy: 'FIS\\Geeta.s',
    allocatedOn: '2025-11-21T09:18:00',
    status: 'Allocated',
    processed: false
  },
  'alloc_004': {
    id: 'alloc_004',
    transactionId: 'txn_006',
    billingPeriod: '202519',
    customerId: '8901234',
    customerName: 'Steelserv Ltd',
    invoiceNumber: 'INV-202519-8901234',
    allocatedAmount: 11.62,
    allocationType: 'AUTO',
    allocatedBy: 'Auto-Generated',
    allocatedOn: '2025-11-21T07:19:16',
    status: 'Allocated',
    processed: true
  },
  'alloc_005': {
    id: 'alloc_005',
    transactionId: 'txn_007',
    billingPeriod: '202518',
    customerId: '1122334',
    customerName: 'ACME Corporation',
    invoiceNumber: 'INV-202518-1122334',
    allocatedAmount: 1250.00,
    allocationType: 'AUTO',
    allocatedBy: 'Auto-Generated',
    allocatedOn: '2025-11-20T08:12:00',
    status: 'Allocated',
    processed: true
  }
};
