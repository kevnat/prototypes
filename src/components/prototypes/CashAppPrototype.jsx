import { useState, useMemo } from 'react';
import { RefreshCw, Search, SlidersHorizontal, SkipForward, Edit, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockLockboxFile, mockTransactions } from '../../data/cashAppMockData';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

const StatusBadge = ({ status }) => {
  if (status === 'R') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-600 text-white text-xs font-bold">
        R
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-500 text-white text-xs font-bold">
      U
    </span>
  );
};

const MatchingStatusCell = ({ lockboxMatched, allocationMatched, splitCount = 1 }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5">
      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        Lockbox
      </span>
      {lockboxMatched ? (
        <CheckCircle className="w-3 h-3 text-green-500" />
      ) : (
        <AlertTriangle className="w-3 h-3 text-red-400" />
      )}
      <span className={`text-xs ${lockboxMatched ? 'text-green-600' : 'text-red-500'}`}>
        {lockboxMatched ? 'Matched' : 'No match'}
      </span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
        Allocation
      </span>
      {allocationMatched ? (
        <CheckCircle className="w-3 h-3 text-green-500" />
      ) : (
        <AlertTriangle className="w-3 h-3 text-red-400" />
      )}
      <span className={`text-xs ${allocationMatched ? 'text-green-600' : 'text-red-500'}`}>
        {allocationMatched ? 'Matched' : 'No match'}
      </span>
    </div>
  </div>
);

const CashAppPrototype = () => {
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [matchFilter, setMatchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [splitSearch, setSplitSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const file = mockLockboxFile;
  const reconciledPct = Math.round((file.reconciledCount / file.recordsTotal) * 100);

  // Group transactions into one row per unique lockbox record
  const groupedRecords = useMemo(() => {
    const map = new Map();
    for (const t of mockTransactions) {
      if (!map.has(t.lockboxRecordId)) {
        map.set(t.lockboxRecordId, []);
      }
      map.get(t.lockboxRecordId).push(t);
    }

    return Array.from(map.entries()).map(([recordId, splits]) => {
      const allLockboxMatched = splits.every(s => s.lockboxMatched);
      const allAllocMatched = splits.every(s => s.allocationMatched);
      const splitCount = splits.length;
      const uniqueAccounts = [...new Set(splits.map(s => s.accountName))];
      const uniqueInvoices = [...new Set(splits.map(s => s.invoiceId).filter(Boolean))];

      return {
        lockboxRecordId: recordId,
        splitCount,
        status: allLockboxMatched && allAllocMatched ? 'R' : 'U',
        accountKey: splitCount === 1 ? splits[0].accountKey : '—',
        accountName: splitCount === 1 ? splits[0].accountName : `Multiple (${uniqueAccounts.length})`,
        frwInvoiceId: splits[0].frwInvoiceId,
        invoiceId: uniqueInvoices.length === 0 ? '' : uniqueInvoices.length === 1 ? uniqueInvoices[0] : `Multiple (${uniqueInvoices.length})`,
        amount: splits[0].allocationAmount, // total lockbox record amount
        matchingRule: splits[0].matchingRule,
        allocationAmount: splits[0].allocationAmount,
        lockboxMatched: allLockboxMatched,
        allocationMatched: splitCount > 1 ? true : allAllocMatched,
      };
    });
  }, []);

  const filtered = useMemo(() => {
    let rows = groupedRecords;

    if (matchFilter === 'reconciled') {
      rows = rows.filter(r => r.lockboxMatched && r.allocationMatched);
    } else if (matchFilter === 'unreconciled') {
      rows = rows.filter(r => !r.lockboxMatched || !r.allocationMatched);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r =>
        r.lockboxRecordId.includes(q) ||
        r.accountName.toLowerCase().includes(q) ||
        r.accountKey.toLowerCase().includes(q) ||
        r.invoiceId.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [groupedRecords, matchFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pagedRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const reconciledCount = groupedRecords.filter(r => r.lockboxMatched && r.allocationMatched).length;
  const unreconciledCount = groupedRecords.filter(r => !r.lockboxMatched || !r.allocationMatched).length;

  const handleFilterChange = (f) => {
    setMatchFilter(f);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // All splits for the selected lockbox record
  const recordSplits = useMemo(() => {
    if (!selectedRecordId) return [];
    const allSplits = mockTransactions.filter(t => t.lockboxRecordId === selectedRecordId);
    const q = splitSearch.toLowerCase();
    if (!q) return allSplits;
    return allSplits.filter(t =>
      t.accountName.toLowerCase().includes(q) ||
      t.accountKey.toLowerCase().includes(q) ||
      t.invoiceId.toLowerCase().includes(q)
    );
  }, [selectedRecordId, splitSearch]);

  // Context info for the selected lockbox record
  const selectedRecordContext = useMemo(() => {
    if (!selectedRecordId) return null;
    const allSplits = mockTransactions.filter(t => t.lockboxRecordId === selectedRecordId);
    const totalAmount = allSplits[0]?.allocationAmount ?? '$0.00';
    const splitCount = allSplits.length;
    const reconciled = allSplits.filter(t => t.lockboxMatched && t.allocationMatched).length;
    return { totalAmount, splitCount, reconciled };
  }, [selectedRecordId]);

  const sessionNotes = [
    {
      category: 'Lockbox Records Table',
      items: [
        'Grouped rows by unique lockbox record ID — one row per record (not one row per split)',
        'Multi-split records show "Multiple (N)" for account and invoice columns',
        'Allocation shown as Matched when a record has multiple splits (payment was distributed)',
        'Removed Matching Rule column',
        'Simplified matching status text to "Matched / No match"',
      ],
    },
    {
      category: 'Invoice Allocations Panel',
      items: [
        'Clicking a row loads all splits for that lockbox record — showing how the total amount is distributed across invoices',
        'Context header shows: Lockbox Record ID, Total Amount, split count, reconciled ratio',
        'Columns: Account Key, Account Name, Invoice ID, Invoice Closed Date, Invoice Due Amount, Split Amount',
        'Actions column shows Edit only — skipping is only available at the lockbox record level (top table)',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-16 py-2 text-xs text-gray-500">
        Accounting&nbsp;/&nbsp;Cash Management&nbsp;/&nbsp;
        <span className="text-blue-600 font-medium">Lockbox Files [{file.batchId}]</span>
      </div>

      <div className="flex items-start gap-5 px-16 py-5">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
        {/* Title + Refresh */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Lockbox Files: {file.batchId}</h1>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>

        {/* File Banner */}
        <div className="bg-white border border-gray-200 rounded flex overflow-hidden">
          {/* Left: file name */}
          <div className="flex items-center gap-4 px-6 py-4 flex-1 border-r border-gray-200">
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-600 flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Lockbox File Name</p>
              <p className="text-sm text-blue-600 font-medium">{file.name}</p>
            </div>
          </div>

          {/* Middle: progress */}
          <div className="flex flex-col justify-center px-8 py-4 flex-1 border-r border-gray-200">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Records Total: {file.recordsTotal}</span>
            </div>
            <div className="flex h-2.5 rounded overflow-hidden bg-gray-100">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${reconciledPct}%` }}
              />
              <div
                className="bg-yellow-400"
                style={{ width: `${100 - reconciledPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{reconciledPct}% Reconciled</p>
          </div>

          {/* Right: status */}
          <div className="flex flex-col items-center justify-center px-8 py-4 bg-blue-600 min-w-[180px]">
            <p className="text-white font-bold text-sm tracking-wide mb-2">STATUS: {file.status}</p>
            <button className="px-5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded transition-colors">
              Post
            </button>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="divide-y divide-gray-200">
              <div className="flex px-6 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0 text-right">Batch ID</span>
                <span className="text-xs text-gray-900">{file.batchId}</span>
              </div>
              <div className="flex px-6 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0 text-right">Total Amount</span>
                <span className="text-xs text-gray-900">{file.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex px-6 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0 text-right">Error Report</span>
                <span className="text-xs text-gray-900">{file.errorReport}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="flex px-6 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-48 flex-shrink-0 text-right">Lockbox Configuration</span>
                <span className="text-xs text-blue-600">{file.lockboxConfig}</span>
              </div>
              <div className="flex px-6 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-48 flex-shrink-0 text-right">Source</span>
                <span className="text-xs text-gray-900">{file.source}</span>
              </div>
              <div className="flex px-6 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-48 flex-shrink-0 text-right">Error</span>
                <span className="text-xs text-gray-900">{file.error}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${
              matchFilter === 'all'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-xs uppercase tracking-wide">All Transactions</span>
            <span className={`text-sm font-bold ${matchFilter === 'all' ? 'text-white' : 'text-gray-800'}`}>
              {groupedRecords.length}
            </span>
          </button>
          <button
            onClick={() => handleFilterChange('reconciled')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${
              matchFilter === 'reconciled'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs uppercase tracking-wide">Reconciled</span>
            <span className={`text-sm font-bold ${matchFilter === 'reconciled' ? 'text-white' : 'text-gray-800'}`}>
              {reconciledCount}
            </span>
          </button>
          <button
            onClick={() => handleFilterChange('unreconciled')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${
              matchFilter === 'unreconciled'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs uppercase tracking-wide">Unreconciled</span>
            <span className={`text-sm font-bold ${matchFilter === 'unreconciled' ? 'text-white' : 'text-gray-800'}`}>
              {unreconciledCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search..."
            className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Account Key</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Account Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">FRW Invoice ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Invoice ID</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Amount</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Allocation Amount</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Matching Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-gray-400 text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((rec) => {
                    const isSelected = selectedRecordId === rec.lockboxRecordId;
                    const allocationIsOrange = !rec.allocationMatched && rec.allocationAmount !== '$0.00';
                    return (
                      <tr
                        key={rec.lockboxRecordId}
                        onClick={() => {
                          setSelectedRecordId(isSelected ? null : rec.lockboxRecordId);
                          setSplitSearch('');
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-3">
                          <StatusBadge status={rec.status} />
                        </td>
                        <td className="px-3 py-3 text-gray-900 font-medium whitespace-nowrap">{rec.lockboxRecordId}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{rec.accountKey}</td>
                        <td className="px-3 py-3 text-gray-900">{rec.accountName}</td>
                        <td className="px-3 py-3 text-gray-500">{rec.frwInvoiceId || ''}</td>
                        <td className="px-3 py-3 text-gray-700">{rec.invoiceId || ''}</td>
                        <td className="px-3 py-3 text-right text-gray-900 font-medium whitespace-nowrap">{rec.amount}</td>
                        <td className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${
                          allocationIsOrange ? 'text-orange-500' : 'text-gray-900'
                        }`}>
                          {rec.allocationAmount}
                        </td>
                        <td className="px-3 py-3">
                          <MatchingStatusCell
                            lockboxMatched={rec.lockboxMatched}
                            allocationMatched={rec.allocationMatched}
                            splitCount={rec.splitCount}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                              title="Skip"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-gray-400">...</span>}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
                {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} rows
              </span>
              <div className="flex items-center gap-1.5">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-200 rounded px-1.5 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ROWS_PER_PAGE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span>rows per page</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Allocations — shows all splits of the selected lockbox record */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Invoice Allocations</h2>
                {selectedRecordId && selectedRecordContext ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
                    <span>Lockbox Record: <strong className="text-gray-900">{selectedRecordId}</strong></span>
                    <span>Total Amount: <strong className="text-gray-900">{selectedRecordContext.totalAmount}</strong></span>
                    <span>Payment Splits: <strong className="text-gray-900">{selectedRecordContext.splitCount}</strong></span>
                    <span>
                      Reconciled:{' '}
                      <strong className={selectedRecordContext.reconciled === selectedRecordContext.splitCount ? 'text-green-600' : 'text-amber-600'}>
                        {selectedRecordContext.reconciled}/{selectedRecordContext.splitCount}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Select a row above to see how its lockbox record amount is split across invoices</p>
                )}
              </div>
              {selectedRecordId && (
                <div className="relative flex-shrink-0 w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={splitSearch}
                    onChange={(e) => setSplitSearch(e.target.value)}
                    placeholder="Search splits..."
                    className="w-full pl-8 pr-4 py-1.5 border border-gray-200 rounded text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Account Key</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Account Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Invoice ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Invoice Closed Date</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Invoice Due Amount</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Split Amount</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!selectedRecordId ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-xs">
                      Select a transaction above to view invoice allocations
                    </td>
                  </tr>
                ) : recordSplits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-xs">
                      No splits found
                    </td>
                  </tr>
                ) : (
                  recordSplits.map((split) => {
                    const inv = split.invoiceAllocations[0];
                    return (
                      <tr key={split.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{split.accountKey}</td>
                        <td className="px-4 py-2.5 text-gray-900">{split.accountName}</td>
                        <td className="px-4 py-2.5 text-gray-700">{split.invoiceId || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                          {inv?.invoiceClosedDate ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-900 font-medium">
                          {inv?.invoiceDueAmount ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">
                          {split.amount}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors" title="Edit">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {selectedRecordId && recordSplits.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 text-right text-xs text-gray-400">
                Showing {recordSplits.length} of {mockTransactions.filter(t => t.lockboxRecordId === selectedRecordId).length} splits
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Notes panel */}
        <div className="w-72 flex-shrink-0 sticky top-4 space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-yellow-200 bg-yellow-100">
              <h3 className="text-xs font-semibold text-yellow-900 uppercase tracking-wide">Session Notes</h3>
              <p className="text-xs text-yellow-700 mt-0.5">Changes made this session</p>
            </div>
            <div className="px-4 py-3 space-y-4 max-h-[80vh] overflow-y-auto">
              {sessionNotes.map((section) => (
                <div key={section.category}>
                  <p className="text-xs font-semibold text-yellow-900 mb-1.5">{section.category}</p>
                  <ul className="space-y-1.5">
                    {section.items.map((note, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-yellow-800">
                        <span className="mt-1 w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashAppPrototype;
