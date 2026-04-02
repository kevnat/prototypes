import React, { useState, useMemo } from 'react';
import {
  Upload, Search, FileText, Settings, ListChecks, X, DollarSign,
  AlertCircle, CheckCircle, TrendingUp, FileCheck, AlertTriangle,
  ChevronDown, ChevronRight, Edit3, Zap, Brain, Target,
  CreditCard, Sparkles, ArrowRight, Clock, User, Calculator
} from 'lucide-react';

// Mock data for enhanced features
const mockEnhancedFiles = [
  {
    id: 'file-1',
    name: 'LB-FRW-20251201.csv',
    dateFrom: '2025-12-01',
    totalTransactions: 156,
    totalAmount: 89750.50,
    numberToProcess: 23,
    status: 'partial'
  }
];

const mockUnallocatedPayments = [
  {
    id: 'payment-001',
    amount: 1200.00,
    reference: 'INV001-INV015',
    otherParty: 'Acme Corporation',
    date: '2025-11-30',
    unallocatedRemainder: 400.00,
    allocatedAmount: 800.00,
    status: 'has_remainder',
    suggestedActions: ['credit_note', 'prepayment', 'discount_applied']
  },
  {
    id: 'payment-002',
    amount: 2200.00,
    reference: 'INV-201 INV-202 INV-203',
    otherParty: 'Echo Enterprises',
    date: '2025-11-30',
    unallocatedRemainder: 230.00,
    allocatedAmount: 1970.00,
    status: 'has_remainder',
    suggestedActions: ['round_difference', 'fees_applied']
  },
  {
    id: 'payment-003',
    amount: 1500.00,
    reference: 'Payment for services',
    otherParty: 'Gamma LLC',
    date: '2025-11-30',
    unallocatedRemainder: 1500.00,
    allocatedAmount: 0,
    status: 'fully_unallocated',
    suggestedActions: ['manual_search', 'create_prepayment', 'contact_customer']
  }
];

const mockSmartSuggestions = [
  {
    id: 'suggestion-1',
    type: 'smart_match',
    title: 'Similar Customer Pattern Detected',
    description: 'Found 3 customers with similar payment patterns in last 30 days',
    confidence: 85,
    action: 'Review suggested matches'
  },
  {
    id: 'suggestion-2',
    type: 'remainder_handling',
    title: 'Remainder Allocation Opportunity',
    description: 'Small remainder amounts could be write-offs or discounts',
    confidence: 92,
    action: 'Apply bulk remainder rules'
  }
];

const EnhancedLockboxPrototype = () => {
  const [selectedFile, setSelectedFile] = useState(mockEnhancedFiles[0]);
  const [activeMatchingMode, setActiveMatchingMode] = useState('payment');
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const [showRemainderPanel, setShowRemainderPanel] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  // Enhanced KPIs
  const totalUnallocatedAmount = mockUnallocatedPayments.reduce((sum, p) => sum + p.unallocatedRemainder, 0);
  const remainderPayments = mockUnallocatedPayments.filter(p => p.status === 'has_remainder').length;
  const fullyUnallocated = mockUnallocatedPayments.filter(p => p.status === 'fully_unallocated').length;

  return (
    <div className="w-full bg-slate-50">
      {/* HEADER */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Enhanced Lockbox Processing</h1>
              <p className="text-sm text-slate-600 mt-1">Advanced matching with intelligent remainder handling</p>
            </div>
            {/* NEW: Enhancement Indicator */}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg px-4 py-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Enhanced Features Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6 pb-20">
        {/* ENHANCED KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Files Today</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{mockEnhancedFiles.length}</p>
                <p className="text-xs text-slate-400 mt-1">Enhanced processing</p>
              </div>
              <FileCheck className="h-8 w-8 text-slate-500" />
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Processed</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(89750.50)}</p>
                <p className="text-xs text-slate-400 mt-1">156 transactions</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* NEW: Unallocated Remainder KPI */}
          <div className="bg-white border rounded-lg shadow-sm p-4 ring-2 ring-orange-200 ring-opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 uppercase tracking-wide font-medium">Unallocated Remainder</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{formatCurrency(totalUnallocatedAmount)}</p>
                <p className="text-xs text-orange-500 mt-1">{remainderPayments} partial + {fullyUnallocated} full</p>
              </div>
              <Calculator className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          {/* NEW: Smart Matching Rate */}
          <div className="bg-white border rounded-lg shadow-sm p-4 ring-2 ring-green-200 ring-opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Smart Match Rate</p>
                <p className="text-2xl font-bold text-green-700 mt-1">94%</p>
                <p className="text-xs text-green-500 mt-1">AI-enhanced matching</p>
              </div>
              <Brain className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* NEW: Processing Efficiency */}
          <div className="bg-white border rounded-lg shadow-sm p-4 ring-2 ring-purple-200 ring-opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">Efficiency Gain</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">+67%</p>
                <p className="text-xs text-purple-500 mt-1">vs. standard processing</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* NEW: SMART SUGGESTIONS PANEL */}
        {showSmartSuggestions && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Smart Processing Suggestions</h3>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">NEW</span>
              </div>
              <button
                onClick={() => setShowSmartSuggestions(false)}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockSmartSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 text-sm">{suggestion.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{suggestion.description}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <Target className="h-3 w-3" />
                      <span>{suggestion.confidence}%</span>
                    </div>
                  </div>
                  <button className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors">
                    <span>{suggestion.action}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ENHANCED MANUAL TRANSACTION MATCHING */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Enhanced Transaction Matching</h2>
              <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">Enhanced Interface</span>
              </div>
            </div>

            {/* NEW: Enhanced Find & Match Section */}
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 mb-6 bg-purple-50/30">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Advanced Find & Match</h3>
                <p className="text-sm text-purple-600">Multiple search modes with intelligent suggestions</p>
              </div>

              {/* NEW: Enhanced Match Mode Tabs */}
              <div className="flex justify-center space-x-1 mb-6 bg-white rounded-lg p-1 border border-purple-200">
                {[
                  { id: 'payment', label: 'Payment Match', icon: CreditCard },
                  { id: 'account', label: 'Account Match', icon: User },
                  { id: 'invoice', label: 'Invoice Match', icon: FileText },
                  { id: 'smart', label: 'Smart Match', icon: Brain, new: true }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMatchingMode(mode.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeMatchingMode === mode.id
                        ? mode.id === 'smart'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                          : 'bg-blue-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <mode.icon className="h-4 w-4" />
                    <span>{mode.label}</span>
                    {mode.new && (
                      <span className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-xs font-bold">NEW</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Enhanced Search Interface */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search Query</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={activeMatchingMode === 'smart' ? 'AI will suggest matches...' : 'Search by account name, ID, or customer...'}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* NEW: Smart Filter Options */}
                  {activeMatchingMode === 'smart' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">AI Confidence Threshold</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
                        <option>High Confidence (90%+)</option>
                        <option>Medium Confidence (70%+)</option>
                        <option>All Suggestions (50%+)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-3">
                  <button className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Search className="h-4 w-4" />
                    <span>Search & Match</span>
                  </button>

                  {/* NEW: Smart Actions */}
                  {activeMatchingMode === 'smart' && (
                    <button className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                      <Brain className="h-4 w-4" />
                      <span>AI Auto-Match</span>
                      <Sparkles className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* NEW: Lockbox Record Display (Enhanced) */}
            <div className="border rounded-lg p-4 bg-slate-50 mb-6">
              <h4 className="font-medium text-slate-800 mb-3 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Lockbox Record</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Enhanced View</span>
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Account Name</p>
                  <p className="font-medium">RTP Lockbox 20260108121</p>
                </div>
                <div>
                  <p className="text-slate-500">Amount</p>
                  <p className="font-medium">{formatCurrency(540.65)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Reference</p>
                  <p className="font-medium">INV#1593347</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment Date</p>
                  <p className="font-medium">20/01/2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: UNALLOCATED REMAINDER MANAGEMENT PANEL */}
        {showRemainderPanel && (
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-orange-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Unallocated Remainder Management</h2>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">NEW FEATURE</span>
                </div>
                <button
                  onClick={() => setShowRemainderPanel(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {mockUnallocatedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border-2 border-orange-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-slate-800">{payment.otherParty}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'has_remainder'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status === 'has_remainder' ? 'Partial Remainder' : 'Fully Unallocated'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">
                          Remainder: {formatCurrency(payment.unallocatedRemainder)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Total: {formatCurrency(payment.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        <span>Ref: {payment.reference}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(payment.date)}</span>
                      </div>

                      {/* NEW: Smart Action Suggestions */}
                      <div className="flex items-center space-x-2">
                        {payment.suggestedActions.slice(0, 2).map((action, index) => (
                          <button
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors flex items-center space-x-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span className="capitalize">{action.replace('_', ' ')}</span>
                          </button>
                        ))}
                        <button className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors flex items-center space-x-1">
                          <Edit3 className="h-3 w-3" />
                          <span>Allocate</span>
                        </button>
                      </div>
                    </div>

                    {/* NEW: Progress bar showing allocation completion */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Allocation Progress</span>
                        <span>{Math.round((payment.allocatedAmount / payment.amount) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(payment.allocatedAmount / payment.amount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* NEW: Bulk Actions for Remainder Management */}
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-3 flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Bulk Remainder Actions</span>
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    <Calculator className="h-4 w-4" />
                    <span>Auto Write-off (&lt;$5)</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FileText className="h-4 w-4" />
                    <span>Create Credit Notes</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Brain className="h-4 w-4" />
                    <span>Smart Distribute</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: PAYMENT GATEWAY INTEGRATION STATUS */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-800">Payment Gateway Integration</h3>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">CONNECTED</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Real-time sync enabled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-800">Stripe</p>
              <p className="text-xs text-green-600">Connected</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <FileCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-blue-800">PayPal</p>
              <p className="text-xs text-blue-600">Active</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-purple-800">Square</p>
              <p className="text-xs text-purple-600">Syncing</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="font-medium text-slate-600">Bank Direct</p>
              <p className="text-xs text-slate-500">Pending Setup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLockboxPrototype;