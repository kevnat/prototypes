import { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw, Search, SlidersHorizontal, CheckCircle, AlertTriangle,
  SkipForward, Edit2, X, CreditCard, User, FileText, LayoutGrid,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';

const fmt = (n) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Mock data ─────────────────────────────────────────────────────────────────

const FILE = {
  batchId: '14707',
  name: 'lockbox_20260130_bankwest.csv',
  totalAmount: 26997.43,
  recordsTotal: 5,
  reconciledCount: 0,
  status: 'PENDING',
  lockboxConfig: 'Freightways lockbox configuration – Manual Upload',
  source: '',
  errorReport: 'No Errors',
  error: '',
};

// Main payments table rows
const RECORDS = [
  { id: '796601', amount: 490.96,   alloc: 445.00,    splits: 5, lbMatch: true,  allocMatch: false },
  { id: '796602', amount: 2000.00,  alloc: 2000.00,   splits: 2, lbMatch: true,  allocMatch: false },
  { id: '796605', amount: 28.83,    alloc: 28.83,     splits: 1, lbMatch: true,  allocMatch: false },
  { id: '796604', amount: 20784.00, alloc: 20727.00,  splits: 6, lbMatch: true,  allocMatch: false },
  { id: '796603', amount: 3693.64,  alloc: 3454.50,   splits: 2, lbMatch: true,  allocMatch: false },
];

// Invoice allocations shown in the bottom table
const INVOICE_ALLOCS = {
  '796601': [
    { id: '838215', accountName: '281348', invoiceId: '1610211', closedDate: '16/02/2026 17:09:01 +13:00', dueAmount: 0.00,   paymentAmount: 100.00 },
    { id: '838216', accountName: '72619',  invoiceId: '1606628', closedDate: '16/02/2026 16:09:01 +13:00', dueAmount: 145.00, paymentAmount: 0.00   },
    { id: '838217', accountName: '281320', invoiceId: '1606575', closedDate: '21/01/2026 15:17:10 +13:00', dueAmount: 0.00,   paymentAmount: 100.00 },
    { id: '838218', accountName: '281314', invoiceId: '1593338', closedDate: '02/01/2026 19:33:02 +13:00', dueAmount: 0.00,   paymentAmount: 100.00 },
    { id: '838219', accountName: '72619',  invoiceId: null,      closedDate: null,                          dueAmount: null,   paymentAmount: null   },
  ],
  '796602': [
    { id: '838301', accountName: '94070', invoiceId: '1602441', closedDate: '10/02/2026 09:00:00 +13:00', dueAmount: 2000.00, paymentAmount: 2000.00 },
    { id: '838302', accountName: '94070', invoiceId: null,       closedDate: null,                          dueAmount: null,    paymentAmount: null    },
  ],
  '796604': [
    { id: '838401', accountName: '93546', invoiceId: '1598812', closedDate: '05/02/2026 11:30:00 +13:00', dueAmount: 5200.00, paymentAmount: 5200.00 },
    { id: '838402', accountName: '93546', invoiceId: '1601034', closedDate: '08/02/2026 14:00:00 +13:00', dueAmount: 8000.00, paymentAmount: 8000.00 },
    { id: '838403', accountName: '93546', invoiceId: '1603210', closedDate: '12/02/2026 10:00:00 +13:00', dueAmount: 4527.00, paymentAmount: 4527.00 },
    { id: '838404', accountName: '93546', invoiceId: '1603988', closedDate: '14/02/2026 09:00:00 +13:00', dueAmount: 3000.00, paymentAmount: 3000.00 },
  ],
};

// Lockbox record detail for modal header
const RECORD_DETAIL = {
  '796601': [
    ['Account Name', 'ACV HEALTH PRODUCTS LTD-GSS', 'ACH Bank Account Number', ''],
    ['Amount', '490.96',                             'Bank Reference Number', ''],
    ['Customer Bank Account Number', '0608010571567000', 'Invoice Id', ''],
    ['Memo', '',                                     'Payment Date', '30/01/2026'],
    ['Balance', '',                                  'Batch', '0000'],
    ['Brand', 'D',                                   'Code', ''],
    ['Debit', '',                                    'Origin', '405390'],
    ['Particulars', '',                              'Reference', ''],
    ['Serial', '000000000000',                       'Trn', '050'],
    ['Type', 'DC',                                   '', ''],
  ],
};

// Modal invoice lists per record
const MODAL_INVOICES = {
  '796601': {
    selected: [
      { invoiceNumber: '1610211', accountId: '281348', accountName: '281348', outstanding: 100.00, allocated: 0.00 },
      { invoiceNumber: '1606628', accountId: '72619',  accountName: '72619',  outstanding: 145.00, allocated: 145.00 },
      { invoiceNumber: '1606575', accountId: '281320', accountName: '281320', outstanding: 100.00, allocated: 0.00 },
      { invoiceNumber: '1593338', accountId: '281314', accountName: '281314', outstanding: 100.00, allocated: 0.00 },
    ],
    available: [
      { invoiceNumber: '1581044', accountId: '281320', accountName: '281320', outstanding: 200.00 },
      { invoiceNumber: '1574892', accountId: '281348', accountName: '281348', outstanding: 50.00  },
      { invoiceNumber: '1568311', accountId: '72619',  accountName: '72619',  outstanding: 75.00  },
    ],
  },
};

// ─── Manual Transaction Matching modal ────────────────────────────────────────

const FIND_MATCH_TABS = [
  { id: 'payment',  label: 'Match to\nPayment',  icon: CreditCard,  color: 'bg-green-500'  },
  { id: 'account',  label: 'Match to\nAccount',  icon: User,        color: 'bg-blue-500'   },
  { id: 'invoice',  label: 'Match to\nInvoice',  icon: FileText,    color: 'bg-blue-900'   },
  { id: 'invoices', label: 'Match to\nInvoices', icon: LayoutGrid,  color: 'bg-orange-500' },
];

function MatchingModal({ recordId, onClose }) {
  const record = RECORDS.find((r) => r.id === recordId);
  const detail = RECORD_DETAIL[recordId] || [];
  const invoiceData = MODAL_INVOICES[recordId] || { selected: [], available: [] };

  const [findTab, setFindTab]           = useState('invoices');
  const [recordExpanded, setRecordExpanded] = useState(false);
  const [allocations, setAllocations] = useState(() => {
    const m = {};
    invoiceData.selected.forEach((inv) => { m[inv.invoiceNumber] = inv.allocated; });
    return m;
  });
  const [selectedSet, setSelectedSet] = useState(
    () => new Set(invoiceData.selected.map((i) => i.invoiceNumber))
  );
  const [unallocOption, setUnallocOption] = useState('selected');

  const totalAllocated = useMemo(
    () => Array.from(selectedSet).reduce((s, id) => s + (allocations[id] || 0), 0),
    [selectedSet, allocations]
  );
  const paymentAmt  = record?.amount || 0;
  const remainingDue = Math.max(0, paymentAmt - totalAllocated);

  const removeInvoice = (invNum) => {
    setSelectedSet((prev) => { const n = new Set(prev); n.delete(invNum); return n; });
  };

  const addInvoice = (inv) => {
    setSelectedSet((prev) => new Set([...prev, inv.invoiceNumber]));
    setAllocations((prev) => ({ ...prev, [inv.invoiceNumber]: Math.min(inv.outstanding, Math.max(0, paymentAmt - totalAllocated)) }));
  };

  const updateAlloc = (invNum, val) => {
    const n = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    setAllocations((prev) => ({ ...prev, [invNum]: n }));
  };

  const allInvoiceRows = useMemo(() => {
    const sel = invoiceData.selected.map((inv) => ({ ...inv, isSelected: true }));
    const avail = invoiceData.available.map((inv) => ({ ...inv, isSelected: selectedSet.has(inv.invoiceNumber) }));
    return [...sel, ...avail];
  }, [invoiceData, selectedSet]);

  const selectedCount    = selectedSet.size;
  const hasValidationError = totalAllocated === 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-8 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded border border-gray-300 shadow-2xl w-full max-w-[880px]">

        {/* Modal title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Manual Transaction Matching</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">

          {/* Nav arrows */}
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center border border-blue-400 text-blue-600 rounded hover:bg-blue-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-blue-400 bg-blue-500 text-white rounded hover:bg-blue-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lockbox Record detail */}
          <div>
            <button
              onClick={() => setRecordExpanded((v) => !v)}
              className="w-full flex items-center justify-between pb-2 border-b border-gray-300 group"
            >
              <h3 className="text-base font-medium text-gray-800">Lockbox Record</h3>
              <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-150 ${recordExpanded ? 'rotate-180' : ''}`} />
            </button>
            {recordExpanded && (
              <div className="mt-2 border border-gray-200 rounded overflow-hidden">
                {detail.map((row, i) => (
                  <div key={i} className={`grid grid-cols-2 divide-x divide-gray-200 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex">
                      <span className="w-56 flex-shrink-0 text-right text-xs text-gray-500 px-3 py-1.5">{row[0]}</span>
                      <span className="text-xs text-gray-800 px-3 py-1.5">{row[1]}</span>
                    </div>
                    <div className="flex">
                      <span className="w-52 flex-shrink-0 text-right text-xs text-gray-500 px-3 py-1.5">{row[2]}</span>
                      <span className="text-xs text-gray-800 px-3 py-1.5">{row[3]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Find & Match */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-300">Find &amp; Match</h3>
            <div className="flex gap-2 mb-4">
              {FIND_MATCH_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = findTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFindTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
                      active
                        ? 'border-orange-400 bg-orange-50 text-gray-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`${tab.color} text-white rounded p-1 flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-left leading-tight whitespace-pre-line text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3-number summary */}
            <div className="grid grid-cols-3 bg-gray-100 border border-gray-200 rounded mb-4">
              <div className="px-6 py-4 text-center border-r border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Payment Amount</p>
                <p className="text-2xl font-semibold text-green-600">{fmt(paymentAmt)}</p>
              </div>
              <div className="px-6 py-4 text-center border-r border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Allocated</p>
                <p className="text-2xl font-semibold text-gray-800">{fmt(totalAllocated)}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Unallocated Remainder</p>
                <p className={`text-2xl font-semibold ${remainingDue > 0 ? 'text-orange-500' : 'text-gray-800'}`}>{fmt(remainingDue)}</p>
              </div>
            </div>

            {/* Unified invoice list — matched at top, divider, then all others */}
            <div className="border border-gray-200 rounded overflow-hidden mb-4">
              <table className="w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 w-8" />
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-600 text-left">Invoice Number</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-600 text-left">Account ID</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-600 text-left">Account Name</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-600 text-right">Outstanding</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-600 text-right">Allocated Amount</th>
                    <th className="px-4 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Section header: Matched invoices */}
                  <tr>
                    <td colSpan={7} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-200">
                      Matched invoices
                    </td>
                  </tr>

                  {/* Rule-matched invoices, pre-ticked */}
                  {invoiceData.selected.map((inv) => {
                    const isSel = selectedSet.has(inv.invoiceNumber);
                    return (
                      <tr key={inv.invoiceNumber} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-center">
                          <input type="checkbox" checked={isSel}
                            onChange={() => isSel ? removeInvoice(inv.invoiceNumber) : addInvoice(inv)}
                            className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{inv.accountId}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{inv.accountName}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-700">{fmt(inv.outstanding)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <input type="text"
                            value={(allocations[inv.invoiceNumber] || 0).toFixed(2)}
                            onChange={(e) => { if (isSel) updateAlloc(inv.invoiceNumber, e.target.value); }}
                            disabled={!isSel}
                            className={`w-24 text-right text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                              isSel ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5 text-center" />
                      </tr>
                    );
                  })}

                  {/* Search bar row */}
                  <tr>
                    <td colSpan={7} className="px-4 py-2 bg-gray-50 border-y border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-xs">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input type="text" placeholder="Search invoices..."
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                        </div>
                        <button className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Section header: All invoices */}
                  <tr>
                    <td colSpan={7} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-200">
                      All invoices
                    </td>
                  </tr>

                  {/* Remaining unselected invoices */}
                  {invoiceData.available.map((inv) => {
                    const isSel = selectedSet.has(inv.invoiceNumber);
                    return (
                      <tr key={inv.invoiceNumber} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-center">
                          <input type="checkbox" checked={isSel}
                            onChange={() => isSel ? removeInvoice(inv.invoiceNumber) : addInvoice(inv)}
                            className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{inv.accountId}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{inv.accountName}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-700">{fmt(inv.outstanding)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <input type="text"
                            value={(allocations[inv.invoiceNumber] || 0).toFixed(2)}
                            onChange={(e) => { if (isSel) updateAlloc(inv.invoiceNumber, e.target.value); }}
                            disabled={!isSel}
                            className={`w-24 text-right text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                              isSel ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5 text-center" />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 text-right text-xs text-gray-400 border-t border-gray-100">
                Showing 1 to {allInvoiceRows.length} of {allInvoiceRows.length} rows
              </div>
            </div>

            {/* Unallocated Remainder */}
            {remainingDue > 0 && (
              <div className="border border-green-400 rounded-lg p-4 mb-2 bg-white">
                <p className="text-base font-semibold text-gray-800 mb-1">
                  Unallocated Remainder: <span className="text-green-600">{fmt(remainingDue)}</span>
                </p>
                <p className="text-sm text-gray-500 mb-3">This amount will be applied as an unallocated payment to the selected account.</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="unalloc" checked={unallocOption === 'selected'}
                      onChange={() => setUnallocOption('selected')} className="accent-blue-600" />
                    Select from selected accounts
                  </label>
                  {unallocOption === 'selected' && (
                    <div className="ml-5">
                      <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                        {[...new Set(invoiceData.selected.map((i) => i.accountId))].map((id) => (
                          <option key={id}>{id}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="unalloc" checked={unallocOption === 'search'}
                      onChange={() => setUnallocOption('search')} className="accent-blue-600" />
                    Search for different account
                  </label>
                  {unallocOption === 'search' && (
                    <div className="ml-5 relative">
                      <input type="text" placeholder=""
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasValidationError && (
              <p className="text-sm text-red-500">Allocation amount must be greater than 0.</p>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={hasValidationError}
            className={`px-4 py-2 text-sm rounded font-medium transition-colors ${
              hasValidationError
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {hasValidationError ? 'Fix validation errors to proceed' : 'Save allocations'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Matching Status cell ──────────────────────────────────────────────────────

function MatchingStatus({ lbMatch, allocMatch }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">Lockbox</span>
        {lbMatch
          ? <><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-xs text-green-600">Matched</span></>
          : <><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-xs text-red-500">No match</span></>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">Allocation</span>
        {allocMatch
          ? <><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-xs text-green-600">Matched</span></>
          : <><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-xs text-red-500">No invoice match found</span></>}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LockboxWorkbenchPrototype() {
  const [selectedId, setSelectedId]   = useState('796601');
  const [matchFilter, setMatchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal]     = useState(false);

  const reconciledPct = Math.round((FILE.reconciledCount / FILE.recordsTotal) * 100);

  const filtered = useMemo(() => {
    let rows = RECORDS;
    if (matchFilter === 'reconciled')   rows = rows.filter((r) => r.lbMatch && r.allocMatch);
    if (matchFilter === 'unreconciled') rows = rows.filter((r) => !r.lbMatch || !r.allocMatch);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((r) => r.id.includes(q));
    }
    return rows;
  }, [matchFilter, searchQuery]);

  const reconciledCount   = RECORDS.filter((r) => r.lbMatch && r.allocMatch).length;
  const unreconciledCount = RECORDS.filter((r) => !r.lbMatch || !r.allocMatch).length;

  const selectedRecord = RECORDS.find((r) => r.id === selectedId);
  const invoiceAllocs  = INVOICE_ALLOCS[selectedId] || [];

  const allocatedAmount  = invoiceAllocs.reduce((s, r) => s + (r.paymentAmount || 0), 0);
  const unallocatedAmount = selectedRecord ? selectedRecord.amount - allocatedAmount : 0;

  const FILTER_TABS = [
    { key: 'all',           label: 'ALL TRANSACTIONS', count: RECORDS.length,    icon: <RefreshCw className="w-4 h-4" />,      bg: 'bg-gray-500'   },
    { key: 'reconciled',    label: 'RECONCILED',       count: reconciledCount,    icon: <CheckCircle className="w-4 h-4" />,    bg: 'bg-green-500'  },
    { key: 'unreconciled',  label: 'UNRECONCILED',     count: unreconciledCount,  icon: <AlertTriangle className="w-4 h-4" />,  bg: 'bg-orange-500' },
    { key: 'excluded',      label: 'EXCLUDED',         count: 0,                  icon: <SkipForward className="w-4 h-4" />,    bg: 'bg-blue-600'   },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="max-w-[1210px] mx-auto px-6 py-6 space-y-4">

        {/* Page title */}
        <h1 className="text-xl font-semibold text-gray-900">Lockbox Files: {FILE.batchId}</h1>

        {/* Refresh */}
        <div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* File banner */}
        <div className="bg-white border border-gray-200 rounded flex overflow-hidden">
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
              <p className="text-sm text-blue-600 font-medium">{FILE.name}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center px-8 py-4 flex-1 border-r border-gray-200">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Records Total: {FILE.recordsTotal}</span>
            </div>
            <div className="flex h-2.5 rounded overflow-hidden bg-gray-200">
              <div className="bg-green-500" style={{ width: `${reconciledPct}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{reconciledPct}% Reconciled</p>
          </div>
          <div className="flex flex-col items-center justify-center px-8 py-4 bg-blue-600 min-w-[180px]">
            <p className="text-white font-bold text-sm tracking-wide mb-2">STATUS: {FILE.status}</p>
            <button className="px-5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded transition-colors">
              Post
            </button>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="divide-y divide-gray-200">
              {[['Batch ID', FILE.batchId], ['Total Amount', FILE.totalAmount.toLocaleString('en-US', {minimumFractionDigits:2})], ['Error Report', FILE.errorReport]].map(([label, val]) => (
                <div key={label} className="flex px-6 py-2 gap-4">
                  <span className="text-xs text-gray-500 w-32 flex-shrink-0 text-right">{label}</span>
                  <span className="text-xs text-gray-900">{val}</span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-gray-200">
              {[['Lockbox Configuration', FILE.lockboxConfig, true], ['Source', FILE.source, false], ['Error', FILE.error, false]].map(([label, val, link]) => (
                <div key={label} className="flex px-6 py-2 gap-4">
                  <span className="text-xs text-gray-500 w-44 flex-shrink-0 text-right">{label}</span>
                  <span className={`text-xs ${link ? 'text-blue-600' : 'text-gray-900'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border border-gray-200 rounded overflow-hidden bg-white">
          {FILTER_TABS.map((tab, i) => {
            const active = matchFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMatchFilter(tab.key)}
                className={`flex items-center gap-3 px-5 py-3 transition-colors border-r border-gray-200 last:border-r-0 flex-1 ${
                  active ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className={`${tab.bg} text-white rounded p-1.5 flex-shrink-0`}>
                  {tab.icon}
                </span>
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{tab.label}</p>
                  <p className="text-lg font-semibold text-gray-800 leading-tight">{tab.count}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Payments table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Allocation Amount</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Splits</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Matching Status</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400">No records found</td></tr>
              ) : filtered.map((rec) => {
                const isSelected = selectedId === rec.id;
                const allocDiffers = rec.alloc < rec.amount;
                return (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedId(rec.id)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-600 text-white text-xs font-bold">P</span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-800">{rec.id}</td>
                    <td className="px-3 py-3 text-right text-gray-800">{fmt(rec.amount)}</td>
                    <td className={`px-3 py-3 text-right font-medium ${allocDiffers ? 'text-orange-500' : 'text-gray-800'}`}>
                      {fmt(rec.alloc)}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">{rec.splits}</td>
                    <td className="px-3 py-3">
                      <MatchingStatus lbMatch={rec.lbMatch} allocMatch={rec.allocMatch} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedId(rec.id); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                        title="Edit allocation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-right text-xs text-gray-400 border-t border-gray-100">
            Showing 1 to {filtered.length} of {filtered.length} rows
          </div>
        </div>

        {/* Invoice Allocations */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-base font-semibold text-gray-800">Invoice Allocations</h2>
              <button
                onClick={() => setShowModal(true)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                title="Edit allocations"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            {selectedRecord && (
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <span>Lockbox Record ID: <strong className="text-gray-800">{selectedId}</strong></span>
                <span className="text-gray-300">|</span>
                <span>Payment amount: <strong className="text-gray-800">{fmt(selectedRecord.amount)}</strong></span>
                <span className="text-gray-300">|</span>
                <span>Allocated amount: <strong className="text-gray-800">{fmt(allocatedAmount)}</strong></span>
                <span className="text-gray-300">|</span>
                <span>Unallocated amount: <strong className="text-gray-800">{fmt(unallocatedAmount)}</strong></span>
                <span className="text-gray-300">|</span>
                <span>Payment splits: <strong className="text-gray-800">{selectedRecord.splits}</strong></span>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search..."
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-64" />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                {['ID', 'Account Name', 'Invoice ID', 'Invoice Closed Date', 'Invoice Due Amount', 'Payment Amount'].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoiceAllocs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No invoice allocations — click edit to match</td></tr>
              ) : invoiceAllocs.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-gray-700">{row.id}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{row.accountName}</td>
                  <td className="px-4 py-2.5 text-sm">
                    {row.invoiceId
                      ? <span className="text-blue-600 hover:underline cursor-pointer">{row.invoiceId}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{row.closedDate || '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-gray-700">{row.dueAmount != null ? fmt(row.dueAmount) : '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-gray-800 font-medium">{row.paymentAmount != null ? fmt(row.paymentAmount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-right text-xs text-gray-400 border-t border-gray-100">
            Showing 1 to {invoiceAllocs.length} of {invoiceAllocs.length} rows
          </div>
        </div>

      </div>

      {showModal && selectedId && (
        <MatchingModal recordId={selectedId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
