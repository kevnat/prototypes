import React, { useState, useMemo } from 'react';
import {
  Upload, Search, FileText, Settings, ListChecks, X,
  AlertCircle, CheckCircle, TrendingUp,
  DollarSign, FileCheck, AlertTriangle,
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
  mockFiles,
  mockBatches,
  mockTransactionsByFile,
  mockRules,
  mockAllocations
} from '../../data/cashAppMockData';
import LockboxValidationScreen from './LockboxValidationScreen';

const columnHelper = createColumnHelper();

const LockboxPrototype = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [onlyUncompleted, setOnlyUncompleted] = useState(false);
  const [expanded, setExpanded] = useState({});

  // Configuration flags for modular sections
  const [hasLockboxConfig, setHasLockboxConfig] = useState(true);
  const [hasCashAppConfig, setHasCashAppConfig] = useState(true);

  const transactions = selectedFile ? mockTransactionsByFile[selectedFile.id] || [] : [];

  const handleFileUpload = (e) => {
    console.log('File selected:', e.target.files[0]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate KPIs
  const totalAmount = mockFiles.reduce((sum, file) => sum + file.totalAmount, 0);
  const totalTransactions = mockFiles.reduce((sum, file) => sum + file.totalTransactions, 0);
  const totalToProcess = mockFiles.reduce((sum, file) => sum + file.numberToProcess, 0);
  const allTransactions = Object.values(mockTransactionsByFile).flat();
  const allocatedTransactions = allTransactions.filter(t => t.remaining === 0).length;
  const allocationSuccessRate = allTransactions.length > 0
    ? Math.round((allocatedTransactions / allTransactions.length) * 100)
    : 0;

  // Transform transactions to hierarchical format for TanStack Table
  const flattenTransactionData = (transactions) => {
    const flattened = [];

    transactions.forEach(txn => {
      // Add main transaction row
      flattened.push({
        id: txn.id,
        type: 'transaction',
        level: 0,
        data: txn,
        parentId: null
      });

      // Add allocation rows if expanded
      if (txn.allocations && txn.allocations.length > 0) {
        txn.allocations.forEach(allocId => {
          const allocation = mockAllocations[allocId];
          if (allocation) {
            flattened.push({
              id: `${txn.id}-${allocation.id}`,
              type: 'allocation',
              level: 1,
              data: allocation,
              parentId: txn.id
            });
          }
        });
      }

      // Add rules if expanded
      if (txn.rulesApplied && txn.rulesApplied.length > 0) {
        txn.rulesApplied.forEach(ruleId => {
          const rule = mockRules[ruleId];
          if (rule) {
            flattened.push({
              id: `${txn.id}-${rule.id}`,
              type: 'rule',
              level: 1,
              data: rule,
              parentId: txn.id
            });
          }
        });
      }
    });

    return flattened;
  };

  // Prepare data for TanStack Table
  const tableData = useMemo(() =>
    flattenTransactionData(transactions),
    [transactions]
  );

  // Status display function
  const getStatusDisplay = (status, remaining) => {
    if (remaining === 0) {
      return {
        color: 'text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-full',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Fully Allocated'
      };
    } else if (remaining > 0 && remaining < status.amount) {
      return {
        color: 'text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-full',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Partially Allocated'
      };
    } else {
      return {
        color: 'text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full',
        icon: <AlertCircle className="h-3 w-3" />,
        label: 'Unallocated'
      };
    }
  };

  // Toggle expand/collapse for transactions
  const toggleTransactionExpanded = (transactionId) => {
    setExpanded(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };

  // Define columns for TanStack Table
  const columns = useMemo(() => [
    columnHelper.accessor('checkbox', {
      id: 'checkbox',
      header: '',
      size: 40,
      enableSorting: false,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return (
            <input
              type="checkbox"
              checked={itemData.skip}
              readOnly
              className="rounded"
            />
          );
        }

        return null;
      }
    }),

    columnHelper.accessor('type', {
      id: 'type',
      header: 'Type',
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const { type, level, data: itemData } = row.original;
        const paddingLeft = level * 24 + 8;

        if (type === 'transaction') {
          const canExpand = (itemData.allocations?.length > 0 || itemData.rulesApplied?.length > 0);

          return (
            <div className="flex items-center space-x-2" style={{ paddingLeft: `${paddingLeft}px` }}>
              {canExpand ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTransactionExpanded(itemData.id);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {expanded[itemData.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <div className="w-4 h-4"></div>
              )}
              <span className="text-sm font-medium text-slate-800">Transaction</span>
            </div>
          );
        } else if (type === 'allocation') {
          return (
            <div className="flex items-center space-x-2" style={{ paddingLeft: `${paddingLeft}px` }}>
              <div className="w-4 h-4"></div>
              <span className="text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded whitespace-nowrap">
                Allocation
              </span>
            </div>
          );
        } else if (type === 'rule') {
          return (
            <div className="flex items-center space-x-2" style={{ paddingLeft: `${paddingLeft}px` }}>
              <div className="w-4 h-4"></div>
              <span className="text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded whitespace-nowrap">
                Rule
              </span>
            </div>
          );
        }

        return null;
      }
    }),

    columnHelper.accessor('date', {
      id: 'date',
      header: 'Date',
      size: 100,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return <span className="text-sm text-slate-600">{formatDate(itemData.date)}</span>;
        } else if (type === 'allocation') {
          return <span className="text-xs text-slate-500">{formatDateTime(itemData.allocatedOn)}</span>;
        } else if (type === 'rule') {
          return <span className="text-xs text-slate-500">{formatDateTime(itemData.createdOn)}</span>;
        }

        return null;
      }
    }),

    columnHelper.accessor('description', {
      id: 'description',
      header: 'Description',
      size: 200,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return <span className="text-sm font-medium text-slate-800">{itemData.otherParty}</span>;
        } else if (type === 'allocation') {
          return (
            <div>
              <span className="text-xs text-slate-600">{itemData.customerName}</span>
              <br />
              <span className="text-xs text-slate-500">Invoice: {itemData.invoiceNumber}</span>
            </div>
          );
        } else if (type === 'rule') {
          return <span className="text-xs text-slate-600">{itemData.name}</span>;
        }

        return null;
      }
    }),

    columnHelper.accessor('amount', {
      id: 'amount',
      header: 'Amount',
      size: 120,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return <span className="text-sm font-medium text-slate-800">{formatCurrency(itemData.amount)}</span>;
        } else if (type === 'allocation') {
          return <span className="text-sm font-medium text-green-600">{formatCurrency(itemData.allocatedAmount)}</span>;
        }

        return null;
      }
    }),

    columnHelper.accessor('remaining', {
      id: 'remaining',
      header: 'Remaining',
      size: 120,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return (
            <span className={`text-sm font-medium ${itemData.remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(itemData.remaining)}
            </span>
          );
        }

        return null;
      }
    }),

    columnHelper.accessor('matchStatus', {
      id: 'matchStatus',
      header: 'Match Status',
      size: 120,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          return (
            itemData.rulesApplied && itemData.rulesApplied.length > 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Matched
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                No Match
              </span>
            )
          );
        }

        return null;
      }
    }),

    columnHelper.accessor('allocationStatus', {
      id: 'allocationStatus',
      header: 'Allocation Status',
      size: 150,
      cell: ({ row }) => {
        const { type, data: itemData } = row.original;

        if (type === 'transaction') {
          if (itemData.remaining === 0) {
            return (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Fully Allocated
              </span>
            );
          } else if (itemData.allocations.length > 0) {
            return (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Partially Allocated
              </span>
            );
          } else {
            return (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                Unallocated
              </span>
            );
          }
        } else if (type === 'allocation') {
          return (
            <span className="inline-flex items-center space-x-1 text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              <span>{itemData.allocationType}</span>
            </span>
          );
        } else if (type === 'rule') {
          return (
            <span className="inline-flex items-center space-x-1 text-xs text-blue-700 bg-blue-100 border border-blue-200 px-2 py-1 rounded-full">
              <Settings className="h-3 w-3" />
              <span>Priority {itemData.priority}</span>
            </span>
          );
        }

        return null;
      }
    })
  ], [transactions, expanded]);

  // Create TanStack Table instance
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableSorting: false,
    enableExpanding: true,
    getRowCanExpand: (row) => {
      const { type, data: itemData } = row.original;
      return type === 'transaction' &&
        (itemData.allocations?.length > 0 || itemData.rulesApplied?.length > 0);
    },
    state: { expanded },
    onExpandedChange: setExpanded
  });

  const filteredFiles = mockFiles.filter(file => {
    if (onlyUncompleted && file.numberToProcess === 0) return false;
    return true;
  });

  const getFileStatus = (file) => {
    if (file.numberToProcess === 0) return { label: 'Complete', color: 'bg-green-100 text-green-700' };
    if (file.numberToProcess < file.totalTransactions * 0.5) return { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Needs Review', color: 'bg-red-100 text-red-700' };
  };

  // const getBatchStatus = (status) => {
  //   const statusMap = {
  //     'Posted': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  //     'Accepted': { color: 'bg-blue-100 text-blue-700', icon: Clock },
  //     'Pending': { color: 'bg-yellow-100 text-yellow-700', icon: Clock }
  //   };
  //   return statusMap[status] || { color: 'bg-gray-100 text-gray-700', icon: Clock };
  // };

  return (
    <div className="w-full bg-slate-50">
      {/* HEADER */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-800">Lockbox Processing Dashboard</h1>
        </div>
      </div>

      {/* MAIN CONTENT - Narrow container with margins */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6 pb-20">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Files Today</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{mockFiles.length}</p>
                <p className="text-xs text-slate-400 mt-1">{mockBatches.length} batches created</p>
              </div>
              <FileCheck className="h-8 w-8 text-slate-500" />
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Processed</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-slate-400 mt-1">{totalTransactions.toLocaleString()} transactions</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Allocation Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{allocationSuccessRate}%</p>
                <p className="text-xs text-slate-400 mt-1">{allocatedTransactions} of {allTransactions.length} matched</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{allTransactions.length}</p>
                <p className="text-xs text-slate-400 mt-1">All editable</p>
              </div>
              <ListChecks className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* FILE MANAGEMENT SECTION - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Import and Search Controls */}
          <div className="flex flex-col space-y-4">
            {/* Import Controls */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">Import File</p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="text-xs flex-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-300 file:text-xs file:bg-white file:text-slate-700 hover:file:bg-slate-50 file:cursor-pointer border-0"
                />
                <button className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium flex items-center space-x-1 whitespace-nowrap">
                  <Upload className="h-3 w-3" />
                  <span>Import</span>
                </button>
              </div>
            </div>

            {/* Search Controls */}
            <div className="bg-white border rounded-lg shadow-sm p-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">Search Files</p>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs text-slate-600 whitespace-nowrap">From</label>
                  <input type="date" className="border border-slate-300 rounded px-2 py-1 text-xs" />
                  <label className="text-xs text-slate-600 whitespace-nowrap">To</label>
                  <input type="date" className="border border-slate-300 rounded px-2 py-1 text-xs" />
                </div>
                <button className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center space-x-1 whitespace-nowrap">
                  <Search className="h-3 w-3" />
                  <span>Search</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="uncompleted"
                  checked={onlyUncompleted}
                  onChange={(e) => setOnlyUncompleted(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="uncompleted" className="text-xs text-slate-600">
                  Only uncompleted files
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Files List */}
          <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col min-h-0">
            <h2 className="text-lg font-semibold text-slate-800 mb-3 flex-shrink-0">Files</h2>
            <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-slate-700">Date Range</th>
                      <th className="text-right p-2 font-medium text-slate-700">Trans.</th>
                      <th className="text-right p-2 font-medium text-slate-700">Amount</th>
                      <th className="text-right p-2 font-medium text-slate-700">To Process</th>
                      <th className="text-center p-2 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => {
                      const status = getFileStatus(file);
                      return (
                        <tr
                          key={file.id}
                          onClick={() => setSelectedFile(file)}
                          className={`border-b cursor-pointer hover:bg-slate-50 transition-colors ${
                            selectedFile?.id === file.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="p-2 whitespace-nowrap">{formatDate(file.dateFrom)}</td>
                          <td className="text-right p-2">{file.totalTransactions.toLocaleString()}</td>
                          <td className="text-right p-2">{formatCurrency(file.totalAmount)}</td>
                          <td className="text-right p-2 font-medium">{file.numberToProcess}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* LOCKBOX VALIDATION SCREEN - Replaces Transactions Section */}
        <LockboxValidationScreen />

        {/* MODULAR SECTIONS: Rules and Allocation (always visible) */}
        {(hasLockboxConfig || hasCashAppConfig) && (
          <div className={`grid gap-6 ${hasLockboxConfig && hasCashAppConfig ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* RULES SECTION - Conditional */}
            {hasCashAppConfig && (
              <div className="bg-white border rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-slate-700" />
                  <span>Cash Application Rules</span>
                </h3>

                <div className="min-h-[200px]">
                  {!selectedTransaction ? (
                    <div className="text-center py-8">
                      <Settings className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">Select a transaction to view rules or <button className="text-blue-600 hover:text-blue-700 underline">view all rules</button></p>
                    </div>
                  ) : selectedTransaction.rulesApplied.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-10 w-10 text-orange-400 mx-auto mb-3" />
                      <p className="text-sm text-orange-600 font-medium">No rules matched</p>
                      <p className="text-xs text-slate-500 mt-1">This transaction requires manual allocation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTransaction.rulesApplied.map((ruleId) => {
                        const rule = mockRules[ruleId];
                        if (!rule) return null;

                        return (
                          <div key={rule.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                Priority {rule.priority}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
                              <p className="font-medium">Action: {rule.action.type}</p>
                              <p className="text-slate-500">Created by: {rule.createdBy}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ALLOCATION SECTION - Conditional */}
            {hasLockboxConfig && (
              <div className="bg-white border rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-slate-700" />
                  <span>Lockbox Allocation Details</span>
                </h3>

                <div className="min-h-[200px]">
                  {!selectedTransaction ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">Select a transaction to view allocation details</p>
                    </div>
                  ) : selectedTransaction.allocations.length === 0 ? (
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50/50">
                      <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-orange-700 text-center">Unallocated Transaction</p>
                      <p className="text-xs text-slate-600 text-center mt-1 mb-4">
                        Amount: {formatCurrency(selectedTransaction.amount)}
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700">Suggested Actions:</p>
                        <button className="w-full px-3 py-2 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 flex items-center justify-center space-x-2">
                          <Search className="h-3 w-3" />
                          <span>Search Similar Customers</span>
                        </button>
                        <button className="w-full px-3 py-2 bg-slate-600 text-white rounded text-xs hover:bg-slate-700 flex items-center justify-center space-x-2">
                          <FileText className="h-3 w-3" />
                          <span>Manual Allocation</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTransaction.allocations.map((allocId) => {
                        const alloc = mockAllocations[allocId];
                        if (!alloc) return null;

                        return (
                          <div key={alloc.id} className="border border-green-200 rounded-lg p-4 bg-green-50/30">
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Allocated</span>
                              </span>
                              <span className="text-xs text-slate-500">{alloc.allocationType}</span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-slate-500 mb-1">Customer</p>
                                  <p className="font-semibold text-slate-800">{alloc.customerName}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 mb-1">Customer ID</p>
                                  <p className="font-semibold text-slate-800">{alloc.customerId}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-slate-500 mb-1">Invoice</p>
                                  <p className="font-semibold text-slate-800">{alloc.invoiceNumber}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 mb-1">Amount</p>
                                  <p className="font-semibold text-green-600">{formatCurrency(alloc.allocatedAmount)}</p>
                                </div>
                              </div>

                              <div className="pt-2 mt-2 border-t border-green-200">
                                <p className="text-slate-500">Allocated by: {alloc.allocatedBy}</p>
                                <p className="text-slate-500">On: {formatDateTime(alloc.allocatedOn)}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex justify-end gap-2">
                              <button className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors">
                                Edit
                              </button>
                              <button className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LockboxPrototype;
