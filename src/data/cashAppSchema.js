// Cash Application / Lockbox Data Schema
// Based on legacy CBIL system structure

/**
 * FILES SECTION (Top Left)
 * Purpose: Search and view imported batch files by date range
 */
export const FileSchema = {
  // Search criteria
  dateFrom: 'Date',
  dateTo: 'Date',
  onlyUncompletedFiles: 'Boolean',

  // File/Batch record
  file: {
    dateFrom: 'Date',           // Start date for batch
    dateTo: 'Date',             // End date for batch
    totalTransactions: 'Number', // Total trans count (e.g., 5,104)
    totalAmount: 'Decimal',     // Total $ amount (e.g., $13,672...)
    numberSkipped: 'Number',    // Trans marked to skip (e.g., 0)
    amountSkipped: 'Decimal',   // $ amount skipped (e.g., $0.00)
    numberToProcess: 'Number',  // Trans remaining (e.g., 2,124)
    amountToProcess: 'Decimal', // $ remaining (e.g., $11,171...)
    deleted: 'Boolean'          // Soft delete flag
  }
};

/**
 * BATCH SECTION (Top Right)
 * Purpose: Import new files and view created batches with posting status
 */
export const BatchSchema = {
  // Import
  fileName: 'String',           // File to import
  transactionTypes: ['AP', 'AR', 'BR'], // Transaction types to include

  // Created batch tracking
  batch: {
    batchNumber: 'String',      // e.g., "90010104"
    status: 'String',           // e.g., "Accepted", "Pending", "Posted"
    date: 'Date',               // Batch creation date
    numberTransactions: 'Number', // Trans count (e.g., 2986)
    amount: 'Decimal',          // Total amount (e.g., $2,500,483.75)
    createdBy: 'String',        // User who created
    createdOn: 'DateTime',      // Creation timestamp
    lastUpdatedBy: 'String',    // Last user to modify
    lastUpdatedOn: 'DateTime'   // Last update timestamp
  }
};

/**
 * TRANSACTIONS SECTION (Middle)
 * Purpose: Display all transactions from selected file
 */
export const TransactionSchema = {
  transaction: {
    id: 'String',               // Unique transaction ID
    skip: 'Boolean',            // Checkbox to ignore transaction
    bankAccount: 'String',      // Bank account (e.g., "01-0102-00...")
    date: 'Date',               // Transaction date (e.g., 20/11/2025)
    particulars: 'String',      // Reference/particulars (e.g., "2105372")
    code: 'String',             // Additional code field (e.g., "202519")
    reference: 'String',        // Reference number (e.g., "465574l")
    otherParty: 'String',       // Customer/party name (e.g., "SHIEFF ANG...")
    amount: 'Decimal',          // Transaction amount (e.g., $437.43)
    remaining: 'Decimal',       // Unallocated amount (e.g., $0.00)
    batchNumber: 'String',      // Associated batch (e.g., "90010104")
    lockedBy: 'String',         // User currently editing
    lockStarted: 'DateTime',    // When lock began
    lastUpdatedBy: 'String',    // Last updater (e.g., "FIS\Geeta.s...")
    lastUpdatedOn: 'DateTime',  // Last update time

    // Relationships
    allocations: ['AllocationId'], // Links to allocation records
    rulesApplied: ['RuleId']   // Links to rules that matched
  }
};

/**
 * RULES SECTION (Bottom Left)
 * Purpose: Display which auto-allocation rules were applied to selected transaction
 */
export const RuleSchema = {
  rule: {
    id: 'String',               // Unique rule ID
    name: 'String',             // Rule description
    criteria: [{                // Matching criteria (AND conditions)
      field: 'String',          // Field to match (e.g., "CODE", "PARTICULARS")
      operator: 'String',       // e.g., "=", "CONTAINS", "STARTS_WITH"
      value: 'String'           // Value to match (e.g., "2105372")
    }],
    action: {
      type: 'String',           // e.g., "AUTO_ALLOCATE", "HOLD", "SKIP"
      target: 'String'          // e.g., "Customer", "Suspense"
    },
    createdBy: 'String',        // Rule creator (e.g., "File-Format-Update", "Auto-Generated")
    createdOn: 'DateTime',      // Creation timestamp
    priority: 'Number',         // Rule execution order
    enabled: 'Boolean'          // Active status
  }
};

/**
 * ALLOCATION SECTION (Bottom Right)
 * Purpose: Show how transaction was allocated to customer/invoice
 */
export const AllocationSchema = {
  allocation: {
    id: 'String',               // Unique allocation ID
    transactionId: 'String',    // Parent transaction
    billingPeriod: 'String',    // Billing period (e.g., "202519")

    // Customer allocation
    customerId: 'String',       // Customer ID (e.g., "2105372")
    customerName: 'String',     // Full name (e.g., "Shieff Angland GSS")

    // Invoice allocation
    invoiceNumber: 'String',    // Invoice allocated to
    allocatedAmount: 'Decimal', // Amount applied (e.g., $437.43)

    // Method tracking
    allocationType: 'String',   // "AUTO" or "MANUAL"
    allocatedBy: 'String',      // User or "Auto-Generated"
    allocatedOn: 'DateTime',    // Allocation timestamp

    // Status
    status: 'String',           // "Allocated", "Partial", "Unallocated"
    processed: 'Boolean'        // Whether posted to accounting
  }
};

/**
 * SAMPLE DATA STRUCTURES
 */

export const sampleFile = {
  dateFrom: '2025-11-20',
  dateTo: '2025-11-20',
  totalTransactions: 5104,
  totalAmount: 13672.45,
  numberSkipped: 0,
  amountSkipped: 0.00,
  numberToProcess: 2124,
  amountToProcess: 11171.28,
  deleted: false
};

export const sampleBatch = {
  batchNumber: '90010104',
  status: 'Accepted',
  date: '2025-11-21',
  numberTransactions: 2986,
  amount: 2500483.75,
  createdBy: 'System',
  createdOn: '2025-11-21T09:00:00',
  lastUpdatedBy: 'FIS\\Geeta.s',
  lastUpdatedOn: '2025-11-21T09:15:00'
};

export const sampleTransaction = {
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
  rulesApplied: ['rule_001', 'rule_002']
};

export const sampleRule = {
  id: 'rule_001',
  name: 'Match by Code = 2105372',
  criteria: [
    {
      field: 'CODE',
      operator: '=',
      value: '2105372'
    }
  ],
  action: {
    type: 'AUTO_ALLOCATE',
    target: 'Customer'
  },
  createdBy: 'File-Format-Update',
  createdOn: '2016-11-16T11:10:10',
  priority: 1,
  enabled: true
};

export const sampleAllocation = {
  id: 'alloc_001',
  transactionId: 'txn_001',
  billingPeriod: '202519',
  customerId: '2105372',
  customerName: 'Shieff Angland GSS',
  invoiceNumber: 'INV-202519-001',
  allocatedAmount: 437.43,
  allocationType: 'AUTO',
  allocatedBy: 'Auto-Generated',
  allocatedOn: '2025-11-21T07:19:16',
  status: 'Allocated',
  processed: true
};
