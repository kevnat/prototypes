import React, { useState } from 'react';
import { Upload, Search, FileText, Settings, ListChecks, X } from 'lucide-react';
import {
  mockFiles,
  mockBatches,
  mockTransactionsByFile,
  mockRules,
  mockAllocations
} from '../../data/cashAppMockData';

// Prototype scaffold for new Cash App / Lockbox module
// Inspired by legacy CBIL auto-allocation dashboard
// Provides three major sections: File Import, Transactions, Allocation Details

const CashAppPrototype = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [dateFrom, setDateFrom] = useState('2025-11-18');
  const [dateTo, setDateTo] = useState('2025-11-20');
  const [onlyUncompleted, setOnlyUncompleted] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    // TODO: parse uploaded file and create new batch
    console.log('File uploaded:', file);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setTransactions(mockTransactionsByFile[file.id] || []);
    setSelectedTransaction(null);
  };

  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleSkipToggle = (transactionId, e) => {
    e.stopPropagation();
    // TODO: Toggle skip status
    console.log('Toggle skip for:', transactionId);
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
    return new Date(dateString).toLocaleString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = mockFiles.filter(file => {
    if (onlyUncompleted && file.numberToProcess === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
      {/* HEADER */}
      <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-slate-800">Cash Application / Lockbox Prototype</h1>
        <div className="text-xs text-slate-500">
          Selected File: {selectedFile ? `${formatDate(selectedFile.dateFrom)}` : 'None'}
        </div>
      </div>

      {/* MAIN LAYOUT: 2 COLUMNS */}
      <div className="grid grid-cols-2 gap-3 p-4 pb-8 items-start">
        {/* LEFT COLUMN: FILES + TRANSACTIONS */}
        <div className="flex flex-col gap-3">
          {/* FILES SECTION */}
          <div className="bg-white border rounded-xl shadow-sm p-3 flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-800 flex items-center space-x-2">
                <Search className="h-5 w-5 text-slate-700" />
                <span>Files</span>
              </h2>
            </div>

            {/* Search Controls */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-600">Date From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-600">Date To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                />
              </div>
              <button className="px-3 py-1 bg-slate-700 text-white rounded text-xs hover:bg-slate-800">
                Search
              </button>
            </div>

            <div className="flex items-center space-x-2 mb-3">
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

            {/* Files Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left whitespace-nowrap">Date From</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">Date To</th>
                    <th className="px-2 py-2 text-right whitespace-nowrap">Total Trans.</th>
                    <th className="px-2 py-2 text-right whitespace-nowrap">Total Am.</th>
                    <th className="px-2 py-2 text-right whitespace-nowrap">Skipped</th>
                    <th className="px-2 py-2 text-right whitespace-nowrap">To Process</th>
                    <th className="px-2 py-2 text-right whitespace-nowrap">Amount</th>
                    <th className="px-2 py-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => handleFileSelect(file)}
                      className={`cursor-pointer hover:bg-slate-50 border-b ${
                        selectedFile?.id === file.id ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-2 py-2 whitespace-nowrap">{formatDate(file.dateFrom)}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{formatDate(file.dateTo)}</td>
                      <td className="px-2 py-2 text-right">{file.totalTransactions.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(file.totalAmount)}</td>
                      <td className="px-2 py-2 text-right">{file.numberSkipped}</td>
                      <td className="px-2 py-2 text-right font-medium">{file.numberToProcess.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right font-medium">{formatCurrency(file.amountToProcess)}</td>
                      <td className="px-2 py-2 text-center">
                        <button className="text-red-500 hover:text-red-700" onClick={(e) => e.stopPropagation()}>
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TRANSACTIONS SECTION */}
          <div className="bg-white border rounded-xl shadow-sm p-3 flex flex-col flex-1">
            <h2 className="text-lg font-medium text-slate-800 mb-3 flex items-center space-x-2">
              <ListChecks className="h-5 w-5 text-slate-700" />
              <span>Transactions</span>
              {selectedFile && (
                <span className="text-xs text-slate-500 ml-2">
                  ({transactions.length} transactions)
                </span>
              )}
            </h2>

            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left">Skip</th>
                    <th className="px-2 py-2 text-left">Bank Account</th>
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-left">Particulars</th>
                    <th className="px-2 py-2 text-left">Code</th>
                    <th className="px-2 py-2 text-left">Other Party</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedFile ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-center text-slate-400">
                        Select a file to view transactions
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-center text-slate-400">
                        No transactions found in this file
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        onClick={() => handleTransactionSelect(txn)}
                        className={`cursor-pointer hover:bg-slate-50 border-b ${
                          selectedTransaction?.id === txn.id ? 'bg-yellow-50' : ''
                        } ${txn.remaining === 0 ? 'text-slate-500' : 'text-slate-900'}`}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={txn.skip}
                            onChange={(e) => handleSkipToggle(txn.id, e)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs">{txn.bankAccount}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{formatDate(txn.date)}</td>
                        <td className="px-2 py-2 font-medium">{txn.particulars}</td>
                        <td className="px-2 py-2">{txn.code}</td>
                        <td className="px-2 py-2">{txn.otherParty}</td>
                        <td className="px-2 py-2 text-right font-medium">{formatCurrency(txn.amount)}</td>
                        <td className={`px-2 py-2 text-right font-bold ${
                          txn.remaining === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(txn.remaining)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BATCH + RULES + ALLOCATION */}
        <div className="flex flex-col gap-3">
          {/* BATCH SECTION */}
          <div className="bg-white border rounded-xl shadow-sm p-3 flex flex-col h-[240px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-800 flex items-center space-x-2">
                <Upload className="h-5 w-5 text-slate-700" />
                <span>Import & Batches</span>
              </h2>
            </div>

            {/* Import Controls */}
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="file"
                onChange={handleFileUpload}
                className="text-xs flex-1 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-800 file:cursor-pointer border border-slate-300 rounded-md p-1"
              />
              <button className="px-3 py-1 bg-slate-700 text-white rounded text-xs hover:bg-slate-800">
                Import File
              </button>
            </div>

            {/* Batches Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left">Batch No.</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-right">Trans</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mockBatches.map((batch) => (
                    <tr key={batch.batchNumber} className="hover:bg-slate-50 border-b">
                      <td className="px-2 py-2 font-mono">{batch.batchNumber}</td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          batch.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                          batch.status === 'Posted' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">{formatDate(batch.date)}</td>
                      <td className="px-2 py-2 text-right">{batch.numberTransactions.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(batch.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RULES SECTION */}
          <div className="bg-white border rounded-xl shadow-sm p-3 flex flex-col flex-1">
            <h3 className="text-md font-medium text-slate-800 mb-3 flex items-center space-x-2">
              <Settings className="h-4 w-4 text-slate-700" />
              <span>Rules Applied</span>
            </h3>

            <div className="flex-1 overflow-auto">
              {!selectedTransaction ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Select a transaction to view applied rules
                </p>
              ) : selectedTransaction.rulesApplied.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No rules matched this transaction
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTransaction.rulesApplied.map((ruleId) => {
                    const rule = mockRules[ruleId];
                    if (!rule) return null;
                    return (
                      <div key={rule.id} className="border rounded-lg p-3 bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm text-slate-800">{rule.name}</div>
                          <div className="text-xs text-slate-500">{rule.createdBy}</div>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          {rule.criteria.map((crit, idx) => (
                            <div key={idx} className="font-mono">
                              {crit.field} {crit.operator} "{crit.value}"
                            </div>
                          ))}
                          <div className="mt-2 text-xs text-slate-500">
                            Created: {formatDateTime(rule.createdOn)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ALLOCATION SECTION */}
          <div className="bg-white border rounded-xl shadow-sm p-3 flex flex-col flex-1">
            <h3 className="text-md font-medium text-slate-800 mb-3 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-slate-700" />
              <span>Allocation Details</span>
            </h3>

            <div className="flex-1 overflow-auto">
              {!selectedTransaction ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Select a transaction to view allocation details
                </p>
              ) : selectedTransaction.allocations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400 mb-3">No allocation yet</p>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Create Allocation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTransaction.allocations.map((allocId) => {
                    const alloc = mockAllocations[allocId];
                    if (!alloc) return null;
                    return (
                      <div key={alloc.id} className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-slate-800">
                            Billing Period: {alloc.billingPeriod}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alloc.status === 'Allocated' ? 'bg-green-100 text-green-700' :
                            alloc.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {alloc.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Customer:</span>
                            <span className="font-medium">{alloc.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Customer ID:</span>
                            <span className="font-mono text-xs">{alloc.customerId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Invoice:</span>
                            <span className="font-mono text-xs">{alloc.invoiceNumber}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-bold text-green-600">{formatCurrency(alloc.allocatedAmount)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 pt-2 border-t">
                            <span>{alloc.allocationType} by {alloc.allocatedBy}</span>
                            <span>{formatDateTime(alloc.allocatedOn)}</span>
                          </div>
                        </div>

                        {!alloc.processed && (
                          <div className="mt-3 flex space-x-2">
                            <button className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                              Process
                            </button>
                            <button className="flex-1 px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-50">
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashAppPrototype;
