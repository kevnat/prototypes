import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle, AlertTriangle, X, Edit, FileText,
  ChevronDown, ChevronRight
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import {
  mockLockboxFiles,
  ruleExplanations,
  issueTypes
} from '../../data/lockboxValidationMockData';

/**
 * LOCKBOX PRE-POST VALIDATION INTERFACE
 *
 * Single consolidated table with hierarchical nesting:
 * Files → Transactions → Invoices → Line Items
 *
 * Shows action status for each level with expand/collapse functionality
 */

// Helper to flatten hierarchical data for TanStack Table
const flattenData = (files) => {
  const flattened = [];

  files.forEach(file => {
    // Skip file row since we're already in file context
    // Start directly with transactions
    if (file.expanded || true) { // Always show transactions
      // Sort transactions to put "needs_review" items first, then by payment ID for stable positioning
      const sortedTransactions = [...file.transactions].sort((a, b) => {
        const statusOrder = { 'needs_review': 0, 'proposed': 1, 'valid': 2 };
        const aStatus = (a.issues?.length > 0 || a.status === 'needs_review') ? 'needs_review' : (a.status || 'needs_review');
        const bStatus = (b.issues?.length > 0 || b.status === 'needs_review') ? 'needs_review' : (b.status || 'needs_review');

        // Primary sort: status priority
        const statusDiff = (statusOrder[aStatus] || 99) - (statusOrder[bStatus] || 99);
        if (statusDiff !== 0) return statusDiff;

        // Secondary sort: payment ID for stable positioning
        return a.id.localeCompare(b.id);
      });

      sortedTransactions.forEach(txn => {
        // Add transaction row (now at level 0)
        flattened.push({
          id: txn.id,
          type: 'transaction',
          level: 0,
          data: txn,
          parentId: null,
          fileId: file.id,
          transactionId: txn.id,
          invoiceId: null
        });

        if (txn.expanded) {
          txn.invoices.forEach(invoice => {
            // Add invoice row (now at level 1)
            flattened.push({
              id: invoice.id,
              type: 'invoice',
              level: 1,
              data: invoice,
              parentId: txn.id,
              fileId: file.id,
              transactionId: txn.id,
              invoiceId: invoice.id
            });

            if (invoice.expanded) {
              invoice.lineItems.forEach(lineItem => {
                // Add line item row (now at level 2)
                flattened.push({
                  id: lineItem.id,
                  type: 'lineItem',
                  level: 2,
                  data: lineItem,
                  parentId: invoice.id,
                  fileId: file.id,
                  transactionId: txn.id,
                  invoiceId: invoice.id
                });
              });
            }
          });

          // Add unallocated row if exists (now at level 1)
          if (txn.unallocatedAmount > 0) {
            flattened.push({
              id: `${txn.id}-unallocated`,
              type: 'unallocated',
              level: 1,
              data: { ...txn, unallocatedAmount: txn.unallocatedAmount },
              parentId: txn.id,
              fileId: file.id,
              transactionId: txn.id,
              invoiceId: null
            });
          }
        }
      });
    }
  });

  return flattened;
};

const columnHelper = createColumnHelper();

const LockboxValidationScreen = () => {
  const [files, setFiles] = useState(mockLockboxFiles);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [skippedTransactions, setSkippedTransactions] = useState(new Set());
  const [selectedForEdit, setSelectedForEdit] = useState(new Set());
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Toggle skip status for a transaction
  const toggleSkipTransaction = useCallback((transactionId) => {
    setSkippedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  }, []);

  // Toggle selection for editing
  const toggleSelectForEdit = useCallback((transactionId) => {
    setSelectedForEdit(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  }, []);

  // Open multi-edit modal
  const openMultiEditModal = () => {
    if (selectedForEdit.size > 0) {
      setCurrentEditIndex(0);
      setShowMultiEditModal(true);
    }
  };

  // Navigate to next transaction in multi-edit
  const goToNext = () => {
    if (currentEditIndex < selectedForEdit.size - 1) {
      setCurrentEditIndex(prev => prev + 1);
    }
  };

  // Navigate to previous transaction in multi-edit
  const goToPrevious = () => {
    if (currentEditIndex > 0) {
      setCurrentEditIndex(prev => prev - 1);
    }
  };

  // Close multi-edit modal
  const closeMultiEditModal = () => {
    setShowMultiEditModal(false);
    setSelectedForEdit(new Set());
    setCurrentEditIndex(0);
  };

  // Select all transactions
  const toggleSelectAll = useCallback(() => {
    // Get all transaction IDs from all files
    const allTransactionIds = files.flatMap(file =>
      file.transactions.map(txn => txn.id)
    );

    if (selectedForEdit.size === allTransactionIds.length) {
      // Deselect all
      setSelectedForEdit(new Set());
    } else {
      // Select all
      setSelectedForEdit(new Set(allTransactionIds));
    }
  }, [files, selectedForEdit.size]);

  // Toggle expand/collapse for any item
  const toggleExpanded = (type, fileId, transactionId = null, invoiceId = null) => {
    setFiles(prevFiles => {
      return prevFiles.map(file => {
        if (file.id !== fileId) return file;

        if (type === 'file') {
          return { ...file, expanded: !file.expanded };
        }

        if (type === 'transaction') {
          return {
            ...file,
            transactions: file.transactions.map(txn =>
              txn.id === transactionId
                ? { ...txn, expanded: !txn.expanded }
                : txn
            )
          };
        }

        if (type === 'invoice') {
          return {
            ...file,
            transactions: file.transactions.map(txn =>
              txn.id === transactionId
                ? {
                    ...txn,
                    invoices: txn.invoices.map(inv =>
                      inv.id === invoiceId
                        ? { ...inv, expanded: !inv.expanded }
                        : inv
                    )
                  }
                : txn
            )
          };
        }

        return file;
      });
    });
  };

  // Prepare flattened data for TanStack Table
  const data = useMemo(() => flattenData(files), [files]);

  // Define columns for TanStack Table
  const columns = useMemo(() => [
    // 1. NUMBER COLUMN
    columnHelper.display({
      id: 'number',
      header: '#',
      size: 50,
      cell: ({ row }) => {
        const { type, id } = row.original;
        // Only show numbers for transaction rows (top-level payments)
        if (type === 'transaction') {
          // Count only transaction rows up to this point in the data array
          const transactionRows = data.filter(r => r.type === 'transaction');
          const transactionIndex = transactionRows.findIndex(r => r.id === id);
          const rowNumber = transactionIndex + 1;
          
          return (
            <div className="flex justify-center">
              <span className="text-xs text-slate-500 font-medium">{rowNumber}</span>
            </div>
          );
        }
        
        return null;
      }
    }),

    // 2. SELECT COLUMN (combined with Actions)
    columnHelper.display({
      id: 'select',
      header: 'Select | Actions',
      size: 150,
      cell: ({ row }) => {
        const { type, transactionId, data: itemData } = row.original;

        // For transaction rows: show checkbox, edit button, and skip button
        if (type === 'transaction') {
          const isSelected = selectedForEdit.has(transactionId);
          const isSkipped = skippedTransactions.has(transactionId);

          return (
            <div className="flex items-center justify-center space-x-2">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelectForEdit(transactionId);
                }}
                className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                title={isSelected ? "Selected for editing" : "Select for editing"}
              />
              
              {/* Separator */}
              <span className="text-slate-300">|</span>
              
              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem({ type: 'transaction', item: itemData, fileId: row.original.fileId, transactionId });
                  setShowCorrectionModal(true);
                }}
                className="p-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-blue-100 hover:border-blue-300 transition-colors w-6 h-6 flex items-center justify-center"
                title="Edit Allocation"
              >
                ✏️
              </button>

              {/* Separator */}
              <span className="text-slate-300">|</span>

              {/* Skip emoji button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSkipTransaction(transactionId);
                }}
                className={`p-1 rounded text-sm transition-all ${
                  isSkipped
                    ? 'bg-red-100 border border-red-300 opacity-100'
                    : 'border border-slate-200 opacity-40 hover:opacity-100 hover:bg-slate-50'
                }`}
                title={isSkipped ? "Will be skipped at posting (click to unskip)" : "Skip at posting"}
              >
                ⏩
              </button>
            </div>
          );
        }

        // For other row types, show the renderActions result
        return (
          <div className="flex justify-center">
            {renderActions(type, itemData, row.original.fileId, row.original.transactionId, row.original.invoiceId)}
          </div>
        );
      }
    }),

    // 3. TYPE COLUMN
    columnHelper.accessor((row) => {
      const typeSortOrder = {
        'transaction': 0,
        'invoice': 1,
        'unallocated': 1,
        'lineItem': 2
      };
      return typeSortOrder[row.type] || 999;
    }, {
      id: 'type',
      header: 'Type',
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const { type, level, data: itemData } = row.original;
        const paddingLeft = level * 24 + 8;

        const typeLabels = {
          transaction: 'Payment',
          invoice: 'Invoice',
          lineItem: 'Item',
          unallocated: 'Unallocated'
        };

        const canExpand = (type === 'transaction' && itemData.invoices?.length > 0) ||
                         (type === 'invoice' && itemData.lineItems?.length > 0);

        return (
          <div className="flex items-center space-x-2" style={{ paddingLeft: `${paddingLeft}px` }}>
            {canExpand ? (
              <button
                onClick={() => {
                  if (type === 'transaction') {
                    toggleExpanded('transaction', row.original.fileId, itemData.id);
                  } else if (type === 'invoice') {
                    toggleExpanded('invoice', row.original.fileId, row.original.transactionId, itemData.id);
                  }
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <div className="w-4 h-4"></div>
            )}
            <span className="text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded whitespace-nowrap">
              {typeLabels[type] || type}
            </span>
          </div>
        );
      }
    }),

    // 4. ID COLUMN
    columnHelper.accessor('id', {
      id: 'id',
      header: 'ID',
      size: 180,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return <span className="text-sm font-medium text-slate-800">{itemData.id.split('-')[1]}</span>;
        } else if (type === 'invoice') {
          return <span className="text-sm font-medium text-slate-800">{itemData.invoiceNumber}</span>;
        } else if (type === 'lineItem') {
          return <span className="text-sm text-slate-700">{itemData.description}</span>;
        } else if (type === 'unallocated') {
          return (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Unallocated Amount</span>
            </div>
          );
        }

        return null;
      }
    }),

    // 5. AMOUNT COLUMN
    columnHelper.accessor('amount', {
      id: 'amount',
      header: 'Amount',
      size: 120,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        let amount = 0;
        let colorClass = 'text-slate-800';

        if (type === 'transaction') {
          amount = itemData.amount;
        } else if (type === 'invoice') {
          amount = itemData.proposedAmount;
        } else if (type === 'lineItem') {
          amount = itemData.amount;
        } else if (type === 'unallocated') {
          amount = itemData.unallocatedAmount;
          colorClass = 'text-orange-600';
        }

        return <span className={`text-sm font-medium ${colorClass}`}>{formatCurrency(amount)}</span>;
      }
    }),

    // 6. ACCOUNT NAME COLUMN
    columnHelper.accessor('account', {
      id: 'account',
      header: 'Account Name',
      size: 180,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return <span className="text-xs text-slate-600">{itemData.otherParty}</span>;
        } else if (type === 'invoice') {
          return <span className="text-xs text-slate-600">{itemData.customerName}</span>;
        } else if (type === 'lineItem') {
          return <span className="text-xs text-slate-600">-</span>;
        }

        return <span className="text-xs text-slate-600">-</span>;
      }
    }),

    // 7. DESCRIPTION COLUMN
    columnHelper.accessor('description', {
      id: 'description',
      header: 'Description',
      size: 200,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return <span className="text-xs text-slate-600">{itemData.reference || 'Payment transaction'}</span>;
        } else if (type === 'invoice') {
          return <span className="text-xs text-slate-600">{itemData.invoiceNumber ? `Invoice ${itemData.invoiceNumber}` : 'Invoice allocation'}</span>;
        } else if (type === 'lineItem') {
          return <span className="text-xs text-slate-600">{itemData.matchDescription || itemData.description || 'Line item'}</span>;
        }

        return <span className="text-xs text-slate-600">-</span>;
      }
    }),

    // 8. MATCHING RULES COLUMN (Enhanced)
    columnHelper.accessor('matchingRules', {
      id: 'matchingRules',
      header: 'Matching Rules',
      size: 350,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        // Show matching rules for different row types
        if (type === 'transaction') {
          return (
            <div className="flex flex-col space-y-1">
              {/* Lockbox Match Rule */}
              {itemData.accountMatchExplanation && (
                <div className="text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mr-2">
                    Lockbox
                  </span>
                  <span className="text-gray-700">{itemData.accountMatchExplanation}</span>
                </div>
              )}
              {/* Invoice Match Rule */}
              {itemData.invoiceMatchExplanation && (
                <div className="text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 mr-2">
                    Invoice
                  </span>
                  <span className="text-gray-700">{itemData.invoiceMatchExplanation}</span>
                </div>
              )}
              {/* Default rule if none specified */}
              {!itemData.accountMatchExplanation && !itemData.invoiceMatchExplanation && (
                <div className="text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                    Auto-match
                  </span>
                </div>
              )}
            </div>
          );
        }

        // Show invoice-specific matching for invoice rows
        if (type === 'invoice' && itemData.matchDescription) {
          return (
            <div className="text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 mr-2">
                Invoice
              </span>
              <span className="text-gray-600">{itemData.matchDescription}</span>
            </div>
          );
        }

        return null;
      }
    })
  ], [files, skippedTransactions, toggleSkipTransaction, selectedForEdit, toggleSelectForEdit, data]);

  // Create TanStack Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableSorting: false,
    enableExpanding: true,
    getRowCanExpand: (row) => {
      const { type, data: itemData } = row.original;
      return (type === 'transaction' && itemData.invoices?.length > 0) ||
             (type === 'invoice' && itemData.lineItems?.length > 0);
    },
    state: {
      expanded
    },
    onExpandedChange: setExpanded
  });

  // Update status for any item
  const updateItemStatus = (type, fileId, transactionId, invoiceId, lineItemId, newStatus) => {
    setFiles(prevFiles => {
      return prevFiles.map(file => {
        if (file.id !== fileId) return file;

        return {
          ...file,
          transactions: file.transactions.map(txn => {
            if (txn.id !== transactionId) return txn;

            if (type === 'transaction') {
              // Clear issues when approving (setting to 'valid')
              const updatedTxn = { ...txn, status: newStatus };
              if (newStatus === 'valid') {
                updatedTxn.issues = [];
              }
              return updatedTxn;
            }

            return {
              ...txn,
              invoices: txn.invoices.map(inv => {
                if (inv.id !== invoiceId) return inv;

                if (type === 'invoice') {
                  return { ...inv, status: newStatus };
                }

                return {
                  ...inv,
                  lineItems: inv.lineItems.map(line =>
                    line.id === lineItemId
                      ? { ...line, status: newStatus }
                      : line
                  )
                };
              })
            };
          })
        };
      });
    });
  };

  // Get status display with pastel colored pill styling
  const getStatusDisplay = (status, hasIssues = false) => {
    const displays = {
      'needs_review': {
        color: 'text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Partially Allocated'
      },
      'valid': {
        color: 'text-blue-700 bg-blue-100 border border-blue-200 px-2 py-1 rounded-full',
        icon: <Edit className="h-3 w-3" />,
        label: 'Allocated'
      },
      'proposed': {
        color: 'text-blue-700 bg-blue-100 border border-blue-200 px-2 py-1 rounded-full',
        icon: <Edit className="h-3 w-3" />,
        label: 'Allocated'
      },
      'error': {
        color: 'text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-full',
        icon: <X className="h-3 w-3" />,
        label: 'Error'
      }
    };

    const display = displays[status] || displays['proposed'];

    if (hasIssues && status !== 'needs_review') {
      return displays['needs_review'];
    }

    return display;
  };

  // Calculate summary statistics
  const calculateStats = () => {
    let totalFiles = files.length;
    let totalTransactions = 0;
    let totalAmount = 0;
    let needsReview = 0;
    let valid = 0;

    files.forEach(file => {
      file.transactions.forEach(txn => {
        totalTransactions++;
        totalAmount += txn.amount;

        if (txn.status === 'needs_review' || txn.issues.length > 0) {
          needsReview++;
        } else if (txn.status === 'valid') {
          valid++;
        }
      });
    });

    return { totalFiles, totalTransactions, totalAmount, needsReview, valid };
  };

  const stats = calculateStats();

  // Render action buttons for each row type
  const renderActions = (type, item, fileId, transactionId = null, invoiceId = null) => {
    if (type === 'transaction') {
      return (
        <div className="flex space-x-1 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem({ type: 'transaction', item, fileId, transactionId });
              setShowCorrectionModal(true);
            }}
            className="p-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-blue-100 hover:border-blue-300 transition-colors w-6 h-6 flex items-center justify-center"
            title="Edit Allocation"
          >
            ✏️
          </button>
        </div>
      );
    }

    if (type === 'invoice') {
      return (
        <div className="flex space-x-1 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem({ type: 'invoice', item, fileId, transactionId, invoiceId });
              setShowCorrectionModal(true);
            }}
            className="p-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-yellow-100 hover:border-yellow-300 transition-colors w-6 h-6 flex items-center justify-center"
            title="Edit"
          >
            ✏️
          </button>
        </div>
      );
    }

    return null;
  };


  // Calculate if ready to post
  const canPost = files.every(file =>
    file.transactions.every(txn =>
      txn.status === 'valid' &&
      txn.issues.length === 0 &&
      txn.unallocatedAmount === 0
    )
  );

  // Multi-Edit Modal for cycling through selected transactions
  const MultiEditModal = () => {
    if (!showMultiEditModal || selectedForEdit.size === 0) return null;

    // Get array of selected transaction IDs
    const selectedIds = Array.from(selectedForEdit);
    const currentTransactionId = selectedIds[currentEditIndex];

    // Find the current transaction data
    let currentTransaction = null;

    for (const file of files) {
      for (const txn of file.transactions) {
        if (txn.id === currentTransactionId) {
          currentTransaction = txn;
          break;
        }
      }
      if (currentTransaction) break;
    }

    if (!currentTransaction) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header with progress */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Multi-Edit: Payment Allocations
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Transaction {currentEditIndex + 1} of {selectedForEdit.size}
              </p>
            </div>
            <button
              onClick={closeMultiEditModal}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Transaction Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-800">Current Payment</h4>
              <span className="text-xs text-slate-500">ID: {currentTransaction.id.split('-')[1]}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Other Party:</p>
                <p className="font-medium text-slate-800">{currentTransaction.otherParty}</p>
              </div>
              <div>
                <p className="text-slate-500">Reference:</p>
                <p className="font-medium text-slate-800">{currentTransaction.reference}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Amount:</p>
                <p className="font-medium text-green-600">{formatCurrency(currentTransaction.amount)}</p>
              </div>
              <div>
                <p className="text-slate-500">Unallocated:</p>
                <p className="font-medium text-orange-600">{formatCurrency(currentTransaction.unallocatedAmount)}</p>
              </div>
            </div>
          </div>

          {/* Allocation Editor */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Edit Allocations</h4>

            {/* Current Invoices */}
            {currentTransaction.invoices.map((invoice, idx) => (
              <div key={invoice.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">Invoice {idx + 1}</span>
                  <button className="text-xs text-red-600 hover:text-red-700">Remove</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Customer/Account</label>
                    <input
                      type="text"
                      defaultValue={invoice.customerName}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      defaultValue={invoice.invoiceNumber}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="Invoice #"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Allocated Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={invoice.proposedAmount}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Allocation */}
            <button className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
              + Add New Invoice Allocation
            </button>

            {/* Quick Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h5 className="text-xs font-medium text-slate-700 mb-2">Quick Actions</h5>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50">
                  Auto-Match
                </button>
                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50">
                  Split Evenly
                </button>
                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50">
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex space-x-2">
              <button
                onClick={goToPrevious}
                disabled={currentEditIndex === 0}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  currentEditIndex === 0
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={goToNext}
                disabled={currentEditIndex === selectedForEdit.size - 1}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  currentEditIndex === selectedForEdit.size - 1
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Next →
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={closeMultiEditModal}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              {currentEditIndex < selectedForEdit.size - 1 ? (
                <button
                  onClick={() => {
                    // Save current changes and move to next
                    goToNext();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Save & Next →
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Save current changes and close
                    closeMultiEditModal();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  Save & Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Simple correction modal (placeholder)
  const CorrectionModal = () => {
    if (!selectedItem || !showCorrectionModal) return null;

    const currentTransaction = selectedItem.item;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Edit Payment Allocation
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Review and adjust allocation details for this payment.
              </p>
            </div>
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Transaction Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-800">Current Payment</h4>
              <span className="text-xs text-slate-500">ID: {currentTransaction.id.split('-')[1]}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Other Party:</p>
                <p className="font-medium text-slate-800">{currentTransaction.otherParty}</p>
              </div>
              <div>
                <p className="text-slate-500">Reference:</p>
                <p className="font-medium text-slate-800">{currentTransaction.reference}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Amount:</p>
                <p className="font-medium text-green-600">{formatCurrency(currentTransaction.amount)}</p>
              </div>
              <div>
                <p className="text-slate-500">Unallocated:</p>
                <p className="font-medium text-orange-600">{formatCurrency(currentTransaction.unallocatedAmount)}</p>
              </div>
            </div>
          </div>

          {/* Allocation Editor */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Edit Allocations</h4>

            {/* Current Invoices */}
            {currentTransaction.invoices.map((invoice, idx) => (
              <div key={invoice.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">Invoice {idx + 1}</span>
                  <button className="text-xs text-red-600 hover:text-red-700">Remove</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Customer/Account</label>
                    <input
                      type="text"
                      defaultValue={invoice.customerName}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      defaultValue={invoice.invoiceNumber}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="Invoice #"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Allocated Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={invoice.proposedAmount}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Allocation */}
            <button className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
              + Add New Invoice Allocation
            </button>

            {/* Quick Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h5 className="text-xs font-medium text-slate-700 mb-2">Quick Actions</h5>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50">
                  Auto-Match
                </button>
                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50">
                  Split Evenly
                </button>
                <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50">
                  Clear All
                </button>
              </div>
            </div>

            {/* Audit Log placeholder */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-800 mb-2">Audit Log</h4>
              <p className="text-xs text-slate-500 mb-3">
                Audit log entries for this payment will appear here.
              </p>
              <div className="h-20 bg-slate-50 border border-dashed border-slate-200 rounded flex items-center justify-center text-xs text-slate-400">
                No audit entries yet
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end mt-6 pt-4 border-t space-x-2">
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedItem.type === 'transaction') {
                  updateItemStatus('transaction', selectedItem.fileId, selectedItem.transactionId, null, null, 'valid');
                }
                setShowCorrectionModal(false);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* BILLINGPLATFORM-STYLE HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-600">Lockbox Files</span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm font-medium text-gray-900">file-30-11-2025.csv</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded text-sm font-medium cursor-not-allowed opacity-75"
              >
                Posted
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-full mx-auto px-6 py-6 space-y-6">

        {/* FILE STATUS OVERVIEW */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">file-30-11-2025.csv</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{stats.totalTransactions}</span> payments
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{formatCurrency(stats.totalAmount)}</span> total
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{Math.round((stats.valid / stats.totalTransactions) * 100)}%</span> Reconciled
                  </div>
                </div>
              </div>
              <div className="flex-1 max-w-xs mx-8">
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.valid / stats.totalTransactions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECONCILED VS UNRECONCILED STATS */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">RECONCILED</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.valid}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">UNRECONCILED</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.needsReview}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT ALLOCATIONS TABLE */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Payment Allocations - Hierarchical View
                </h3>
                {selectedForEdit.size > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedForEdit.size} Selected
                  </span>
                )}
                {skippedTransactions.size > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {skippedTransactions.size} to Skip
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {selectedForEdit.size > 0 && (
                  <button
                    onClick={openMultiEditModal}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Selected
                  </button>
                )}
                <span className="text-xs text-gray-500">Showing 1 to 10 of {data.length} rows</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, index, array) => (
                        <th
                          key={header.id}
                          className={`text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            index < array.length - 1 ? 'border-r border-gray-200' : ''
                          }`}
                          style={{ width: `${header.getSize()}px` }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())
                          }
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
              <tbody>
                {(() => {
                  // Pre-calculate transaction groupings for efficient row coloring
                  const allRows = table.getRowModel().rows;
                  const transactionIds = [...new Set(allRows.map(r => r.original.transactionId).filter(Boolean))];
                  
                  // Pre-calculate unallocated status for all transactions
                  const unallocatedMap = new Map();
                  files.forEach(file => {
                    file.transactions.forEach(txn => {
                      unallocatedMap.set(txn.id, txn.unallocatedAmount > 0);
                    });
                  });

                  return allRows.map((row) => {
                    const { type, transactionId, data: itemData } = row.original;
                    const isSkipped = transactionId && skippedTransactions.has(transactionId);
                    const isSelected = transactionId && selectedForEdit.has(transactionId);
                    
                    // Check if transaction has unallocated amount (partially allocated)
                    let hasUnallocated = false;
                    if (type === 'transaction' && itemData?.unallocatedAmount > 0) {
                      hasUnallocated = true;
                    } else if (transactionId && (type === 'invoice' || type === 'lineItem' || type === 'unallocated')) {
                      // For child rows, check the parent transaction's unallocated amount
                      hasUnallocated = unallocatedMap.get(transactionId) || false;
                    }

                    // Calculate background color based on payment grouping (stable positioning)
                    let backgroundClass;
                    if (hasUnallocated) {
                      backgroundClass = 'bg-yellow-50'; // Partially allocated rows get yellow background
                    } else if (isSelected) {
                      backgroundClass = 'bg-blue-50'; // Selected rows get blue background
                    } else if (isSkipped) {
                      backgroundClass = 'bg-red-50 opacity-60'; // Skipped rows get light red background
                    } else {
                      // Use payment ID position for stable alternating colors, regardless of status
                      const transactionIndex = transactionIds.indexOf(transactionId);
                      const isEvenPayment = transactionIndex % 2 === 0;
                      backgroundClass = isEvenPayment ? 'bg-white' : 'bg-gray-50';
                    }

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-200 transition-all duration-200 ${backgroundClass} ${isSkipped ? 'line-through text-gray-400' : ''} ${
                        hasUnallocated
                          ? 'hover:bg-yellow-100'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {row.getVisibleCells().map((cell, index, array) => (
                        <td
                          key={cell.id}
                          className={`px-3 py-2 text-sm ${
                            index < array.length - 1 ? 'border-r border-gray-200' : ''
                          }`}
                          style={{ width: `${cell.column.getSize()}px` }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    );
                  });
                })()}
              </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}
      <MultiEditModal />
      <CorrectionModal />
    </div>
  );
};

export default LockboxValidationScreen;