import React, { useState, useEffect } from 'react';
import { Eye, Settings, Download, Plus, MessageSquare, Send, User, Edit2, Trash2, Receipt, DollarSign, CreditCard, FileText, Wallet, Calendar, Pencil, UserPlus } from 'lucide-react';
import { useSupabaseComments } from '../../hooks/useComments';
import { useParams } from 'react-router-dom';
import RegistrationFlow from './RegistrationFlow';

const PaymentLinksPrototype = () => {
  const { prototypeId } = useParams();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('paymentLinksActiveTab') || 'preview';
  });
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('paymentLinksUserName') || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [adHocForm, setAdHocForm] = useState({
    attributionType: 'invoice',
    selectedInvoice: '',
    customAmount: '',
    accountId: '',
    description: '',
    expirationDays: 90
  });
  const [settings, setSettings] = useState({
    autoGenerate: {
      enabled: true,
      mode: 'closed_invoices' // 'closed_invoices' or 'all_accounts'
    },
    accountLevelDisable: true,
    adHocEnabled: true,
    attributionTypes: {
      invoice: true,
      openAmount: true,
      accountBalance: true
    },
    allowPartialPayments: true,
    allowOverpayments: true,
    partialPaymentPercentage: 25,
    overpaymentPercentage: 150,
    showInvoiceDetails: true,
    enablePdfOptions: true,
    minimumPartialPayment: 25,
    maximumOverpayment: 150,
    linkExpirationDays: 90,
    paymentGatewayProfiles: {
      creditCard: 'BP Pay Merchant-Credit Card',
      directDebit: 'BP Pay Merchant-ACH'
    },
    appliedTo: {
      type: 'all_accounts',
      formula: "Account.tier = 'enterprise'",
      priority: 1
    }
  });

  const [paymentAmount, setPaymentAmount] = useState('125.00');
  const [paymentType, setPaymentType] = useState('credit');
  const [currency, setCurrency] = useState('USD');
  const [mandateAccepted, setMandateAccepted] = useState(false);
  const [showMandateModal, setShowMandateModal] = useState(false);
  const [_commentText, _setCommentText] = useState('');
  const [_commentError, _setCommentError] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Ensure payment amount is set to invoice amount on mount
  useEffect(() => {
    setPaymentAmount('125.00');
  }, []);

  // Use the Supabase comments hook
  const {
    comments,
    loading: _commentsLoading,
    error: _commentsError,
    addComment,
    deleteComment,
    updateComment
  } = useSupabaseComments(prototypeId || 'payment-links');

  // Save userName to localStorage whenever it changes
  useEffect(() => {
    if (userName) {
      localStorage.setItem('paymentLinksUserName', userName);
    }
  }, [userName]);


  // Sample data for ad-hoc creation
  const availableInvoices = [
    { id: 'INV-2025-001', amount: '125.00', customer: 'Acme Corp', date: '2025-01-15' },
    { id: 'INV-2025-002', amount: '250.00', customer: 'Beta LLC', date: '2025-01-14' },
    { id: 'INV-2025-003', amount: '75.00', customer: 'Gamma Inc', date: '2025-01-13' }
  ];

  const availableAccounts = [
    { id: 'ACC-001', name: 'Acme Corp', balance: '450.00' },
    { id: 'ACC-002', name: 'Beta LLC', balance: '1250.00' },
    { id: 'ACC-003', name: 'Gamma Inc', balance: '320.00' }
  ];

  // Sample invoice data
  const invoice = {
    id: 'INV-2025-001',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    amount: '125.00',
    description: 'Monthly Service Fee - January 2025',
    status: 'Due',
    merchantName: 'Acme Software Solutions',
    merchantEmail: 'billing@acmesoftware.com',
    merchantPhone: '(555) 123-4567'
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('paymentLinksActiveTab', tab);
  };

  const handleToggle = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAutoGenerateChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      autoGenerate: {
        ...prev.autoGenerate,
        [field]: value
      }
    }));
  };

  const handleAppliedToChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      appliedTo: {
        ...prev.appliedTo,
        [field]: value
      }
    }));
  };

  const handlePaymentGatewayChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      paymentGatewayProfiles: {
        ...prev.paymentGatewayProfiles,
        [field]: value
      }
    }));
  };

  const handleStartEditingName = () => {
    setTempUserName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempUserName.trim()) {
      setUserName(tempUserName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempUserName('');
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditName();
    }
  };

  const handlePayment = () => {
    console.log('Processing payment of:', paymentAmount);

    // Check if CAD currency with mandate acceptance
    if (currency === 'CAD' && mandateAccepted) {
      setShowMandateModal(true);
    } else {
      // Process payment normally for other currencies or without mandate
      console.log('Processing payment normally');
    }
  };

  const handlePreviewInvoice = () => {
    console.log('Opening invoice preview');
  };

  const handleDownloadInvoice = () => {
    console.log('Downloading invoice PDF');
  };

  const handleAttributionChange = (type, enabled) => {
    setSettings(prev => ({
      ...prev,
      attributionTypes: {
        ...prev.attributionTypes,
        [type]: enabled
      }
    }));
  };

  const handleAdHocFormChange = (field, value) => {
    setAdHocForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAdHocLink = () => {
    console.log('Creating ad-hoc payment link:', adHocForm);
    setActiveTab('preview');
    setAdHocForm({
      attributionType: 'invoice',
      selectedInvoice: '',
      customAmount: '',
      accountId: '',
      description: '',
      expirationDays: 90
    });
  };

  const getEnabledAttributionTypes = () => {
    return Object.entries(settings.attributionTypes)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName) return;

    try {
      await addComment({
        text: newComment,
        author: userName,
        tab: activeTab
      });
      setNewComment(''); // Clear the input after successful submission
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleStartEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleSaveEditedComment = async (e) => {
    e.preventDefault();
    if (!editingCommentId || !editingCommentText.trim()) return;

    try {
      await updateComment(editingCommentId, {
        text: editingCommentText
      });
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      // The comments will be automatically updated through the useEffect
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleClearName = () => {
    setUserName('');
    setIsEditingName(false);
    setTempUserName('');
    localStorage.removeItem('paymentLinksUserName');
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to generate avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-slate-700', 'bg-gray-700', 'bg-zinc-700', 'bg-neutral-700', 
      'bg-stone-700', 'bg-red-700', 'bg-orange-700', 'bg-amber-700'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Filter comments for current tab
  const currentTabComments = comments.filter(comment => comment.tab === activeTab);

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-5 w-10 items-center rounded-full transition-colors
        ${enabled ? 'bg-slate-700' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm
          ${enabled ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  );

  const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block ml-2">
      <div className="h-4 w-4 rounded-full bg-black flex items-center justify-center cursor-help">
        <span className="text-white text-xs font-bold">?</span>
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg w-64 text-center">
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        {text}
      </div>
    </div>
  );

  const SidebarNavItem = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`
        flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-slate-800 text-white shadow-lg'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        }
        w-full md:w-auto
      `}
    >
      <Icon className="h-4 w-4 mr-3" strokeWidth={2} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const _formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar - Collapsible on mobile */}
        <div className="w-full md:w-80 bg-white border-b md:border-r border-slate-200 flex-shrink-0 flex flex-col shadow-sm">
          {/* Navigation - Horizontal on mobile, vertical on desktop */}
          <div className="p-5 border-b border-slate-200">
            <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-3">
              <SidebarNavItem
                id="preview"
                label="Preview"
                icon={Eye}
                isActive={activeTab === 'preview'}
                onClick={handleTabChange}
              />
              <SidebarNavItem
                id="adhoc"
                label="Ad-hoc Creation"
                icon={Plus}
                isActive={activeTab === 'adhoc'}
                onClick={handleTabChange}
              />
              <SidebarNavItem
                id="settings"
                label="Settings"
                icon={Settings}
                isActive={activeTab === 'settings'}
                onClick={handleTabChange}
              />
              <SidebarNavItem
                id="profile"
                label="Profile"
                icon={User}
                isActive={activeTab === 'profile'}
                onClick={handleTabChange}
              />
              <SidebarNavItem
                id="registration"
                label="Registration"
                icon={UserPlus}
                isActive={activeTab === 'registration'}
                onClick={handleTabChange}
              />
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            {!userName && !isEditingName ? (
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-3">Set your name to add comments</p>
                <button
                  onClick={handleStartEditingName}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Set Name
                </button>
              </div>
            ) : isEditingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  onKeyDown={handleNameKeyPress}
                  placeholder="Enter your name"
                  className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveName}
                    disabled={!tempUserName.trim()}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-white text-xs font-medium ${getAvatarColor(userName)} shadow-sm`}>
                    {getUserInitials(userName)}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{userName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleStartEditingName}
                    className="text-xs text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleClearName}
                    className="text-xs text-red-600 hover:text-red-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Comments</h3>
            </div>
            <div className="p-4 border-b border-slate-200">
              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentTabComments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {comment.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{comment.author}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingCommentId === comment.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEditedComment(comment.id)}
                              className="text-xs text-slate-600 hover:text-slate-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => handleCancelEditComment()}
                              className="text-xs text-slate-600 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartEditingComment(comment)}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <form
                        onSubmit={handleSaveEditedComment}
                        className="mt-2"
                      >
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={handleCancelEditComment}
                            className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700">{comment.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {activeTab === 'registration' ? (
            <div className="flex-1">
              <RegistrationFlow />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
              {activeTab === 'preview' && (
                // Preview Mode
                <div className="bg-white rounded-xl shadow-xl border border-slate-200">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-6">
                    {/* Payment Form - Left Side */}
                    <div className="space-y-6">
                      {/* Currency Selector */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => {
                            setCurrency(e.target.value);
                            // Reset mandate acceptance when currency changes
                            if (e.target.value !== 'CAD') {
                              setMandateAccepted(false);
                            }
                          }}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                        </select>
                      </div>

                      {/* Payment Amount and Method */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between">
                          {/* Payment Amount */}
                          <div className="flex-1">
                            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                              <DollarSign className="h-4 w-4 mr-2" strokeWidth={2} />
                              Payment Amount
                            </label>
                            <div className="flex items-center">
                              <span className="text-sm text-slate-500 mr-3 font-medium">{currency}</span>
                              <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="block w-32 px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-base font-semibold"
                              />
                            </div>
                            {settings.allowPartialPayments && (
                              <p className="text-xs text-slate-500 mt-1">
                                Minimum: ${(parseFloat(invoice.amount) * settings.minimumPartialPayment / 100).toFixed(2)}
                              </p>
                            )}
                            {settings.allowOverpayments && (
                              <p className="text-xs text-slate-500 mt-1">
                                Maximum: ${(parseFloat(invoice.amount) * settings.maximumOverpayment / 100).toFixed(2)}
                              </p>
                            )}
                          </div>

                          {/* Payment Method Selection */}
                          <div className="flex-1 ml-8">
                            <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Method</h3>
                            <div className="flex flex-col space-y-3">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="paymentType"
                                  value="credit"
                                  checked={paymentType === 'credit'}
                                  onChange={(e) => setPaymentType(e.target.value)}
                                  className="h-4 w-4 text-slate-600"
                                />
                                <CreditCard className="h-4 w-4 ml-2 mr-1 text-slate-600" strokeWidth={2} />
                                <span className="text-sm text-slate-700">Credit Card</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="paymentType"
                                  value="debit"
                                  checked={paymentType === 'debit'}
                                  onChange={(e) => setPaymentType(e.target.value)}
                                  className="h-4 w-4 text-slate-600"
                                />
                                <Wallet className="h-4 w-4 ml-2 mr-1 text-slate-600" strokeWidth={2} />
                                <span className="text-sm text-slate-700">Direct Debit</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Direct Debit Mandate for CAD */}
                      {currency === 'CAD' && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <label className="flex items-start">
                            <input
                              type="checkbox"
                              checked={mandateAccepted}
                              onChange={(e) => setMandateAccepted(e.target.checked)}
                              className="h-4 w-4 text-slate-600 border-slate-300 focus:ring-slate-500 mt-0.5 mr-3"
                            />
                            <div>
                              <span className="text-sm font-medium text-slate-700">
                                I authorize direct debit mandate for future payments
                              </span>
                              <p className="text-xs text-slate-500 mt-1">
                                Required for CAD payments to enable automated future transactions
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      {/* Payment Form Fields */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="border border-slate-200 rounded-xl p-4 bg-white">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-2">
                                {paymentType === 'credit' ? 'Credit Card Number' : 'Account Number'} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder={paymentType === 'credit' ? '4111 1111 1111 1111' : 'Account Number'}
                                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                              />
                            </div>
                            
                            {paymentType === 'credit' ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-2">
                                    Expiration Date <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="MM/YYYY"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-2">
                                    CVC <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="000"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">
                                  Routing Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="123456789"
                                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                                />
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Full Name"
                                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-2">Email</label>
                              <input
                                type="email"
                                placeholder="email@example.com"
                                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                              />
                              <p className="text-xs text-slate-500 mt-1">Optional - for payment confirmation</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pay Button */}
                      <button
                        onClick={handlePayment}
                        disabled={currency === 'CAD' && !mandateAccepted}
                        className={`w-full py-3 px-4 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors shadow-lg ${
                          currency === 'CAD' && !mandateAccepted
                            ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 text-white hover:bg-slate-900'
                        }`}
                      >
                        Pay {currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : ''}{paymentAmount}
                      </button>
                      
                      <p className="text-xs text-slate-500 text-center">
                        Your payment will be processed securely.
                      </p>
                    </div>

                    {/* Invoice Details - Right Side */}
                    {settings.showInvoiceDetails && (
                      <div className="order-1 xl:order-2 bg-white rounded-xl border border-slate-200 p-5">
                        <div className="space-y-5">
                          {/* Invoice Details */}
                          <div>
                            <div className="flex items-center mb-4">
                              <Receipt className="h-5 w-5 text-slate-700 mr-3" strokeWidth={2} />
                              <h3 className="text-lg font-semibold text-slate-900">Invoice Details</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Invoice Number:</span>
                                <span className="text-sm font-medium text-slate-900">{invoice.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Invoice Date:</span>
                                <span className="text-sm font-medium text-slate-900">{invoice.date}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Due Date:</span>
                                <span className="text-sm font-medium text-slate-900">{invoice.dueDate}</span>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                <span className="text-sm font-semibold text-slate-900">Total Amount Due:</span>
                                <span className="text-xl font-bold text-slate-900">${invoice.amount}</span>
                              </div>
                            </div>
                            
                            {/* Invoice Actions */}
                            {settings.enablePdfOptions && (
                              <div className="flex space-x-3 mt-4">
                                <button
                                  onClick={handlePreviewInvoice}
                                  className="flex items-center px-3 py-2 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  <Eye className="h-4 w-4 mr-2" strokeWidth={2} />
                                  Preview
                                </button>
                                <button
                                  onClick={handleDownloadInvoice}
                                  className="flex items-center px-3 py-2 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  <Download className="h-4 w-4 mr-2" strokeWidth={2} />
                                  Download PDF
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Invoice Description */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-slate-600" strokeWidth={2} />
                              Description
                            </h4>
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{invoice.description}</p>
                          </div>

                          {/* Merchant Information */}
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                              <User className="h-5 w-5 mr-3 text-slate-700" strokeWidth={2} />
                              Merchant Information
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-slate-900">{invoice.merchantName}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-slate-600">Email: </span>
                                  <a href={`mailto:${invoice.merchantEmail}`} className="text-xs text-slate-700 hover:text-slate-900 font-medium">
                                    {invoice.merchantEmail}
                                  </a>
                                </div>
                                <div>
                                  <span className="text-xs text-slate-600">Phone: </span>
                                  <a href={`tel:${invoice.merchantPhone}`} className="text-xs text-slate-700 hover:text-slate-900 font-medium">
                                    {invoice.merchantPhone}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'adhoc' && (
                // Ad-hoc Link Creation Mode
                <div className="bg-white rounded-xl shadow-xl border border-slate-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <Plus className="h-6 w-6 text-slate-700 mr-3" strokeWidth={2} />
                          <h2 className="text-xl font-semibold text-slate-900">Create Ad-Hoc Payment Link</h2>
                        </div>
                        <p className="text-sm text-slate-600">Generate a custom payment link</p>
                      </div>
                    </div>

                    {/* Attribution Type Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-3">Attribution Type</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getEnabledAttributionTypes().includes('invoice') && (
                          <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            adHocForm.attributionType === 'invoice' ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <input
                              type="radio"
                              name="attributionType"
                              value="invoice"
                              checked={adHocForm.attributionType === 'invoice'}
                              onChange={(e) => handleAdHocFormChange('attributionType', e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <Receipt className="mx-auto h-8 w-8 text-slate-600 mb-3" strokeWidth={2} />
                              <h3 className="text-sm font-medium text-slate-900">Invoice</h3>
                              <p className="text-xs text-slate-500 mt-1">Link to specific invoice</p>
                            </div>
                          </label>
                        )}

                        {getEnabledAttributionTypes().includes('openAmount') && (
                          <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            adHocForm.attributionType === 'openAmount' ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <input
                              type="radio"
                              name="attributionType"
                              value="openAmount"
                              checked={adHocForm.attributionType === 'openAmount'}
                              onChange={(e) => handleAdHocFormChange('attributionType', e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <DollarSign className="mx-auto h-8 w-8 text-slate-600 mb-3" strokeWidth={2} />
                              <h3 className="text-sm font-medium text-slate-900">Open Amount</h3>
                              <p className="text-xs text-slate-500 mt-1">Custom payment amount</p>
                            </div>
                          </label>
                        )}

                        {getEnabledAttributionTypes().includes('accountBalance') && (
                          <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            adHocForm.attributionType === 'accountBalance' ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <input
                              type="radio"
                              name="attributionType"
                              value="accountBalance"
                              checked={adHocForm.attributionType === 'accountBalance'}
                              onChange={(e) => handleAdHocFormChange('attributionType', e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <Wallet className="mx-auto h-8 w-8 text-slate-600 mb-3" strokeWidth={2} />
                              <h3 className="text-sm font-medium text-slate-900">Account Balance</h3>
                              <p className="text-xs text-slate-500 mt-1">Total account balance</p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Form Fields */}
                    <div className="space-y-5">
                      {adHocForm.attributionType === 'invoice' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Select Invoice</label>
                          <select
                            value={adHocForm.selectedInvoice}
                            onChange={(e) => handleAdHocFormChange('selectedInvoice', e.target.value)}
                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                          >
                            <option value="">Choose an invoice...</option>
                            {availableInvoices.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.id} - {inv.customer} - ${inv.amount} ({inv.date})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {adHocForm.attributionType === 'openAmount' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount</label>
                          <div className="flex items-center">
                            <span className="text-sm text-slate-500 mr-3 font-medium">USD</span>
                            <input
                              type="number"
                              value={adHocForm.customAmount}
                              onChange={(e) => handleAdHocFormChange('customAmount', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="block w-32 px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {adHocForm.attributionType === 'accountBalance' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Select Account</label>
                          <select
                            value={adHocForm.accountId}
                            onChange={(e) => handleAdHocFormChange('accountId', e.target.value)}
                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                          >
                            <option value="">Choose an account...</option>
                            {availableAccounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} - Current Balance: ${acc.balance}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Common Fields */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                        <textarea
                          value={adHocForm.description}
                          onChange={(e) => handleAdHocFormChange('description', e.target.value)}
                          placeholder="Add a description for this payment link..."
                          rows={3}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-slate-600" strokeWidth={2} />
                          Link Expiration
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={adHocForm.expirationDays}
                            onChange={(e) => handleAdHocFormChange('expirationDays', parseInt(e.target.value))}
                            min="1"
                            max="365"
                            className="block w-20 px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                          />
                          <span className="ml-3 text-sm text-slate-500">days</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Payment link will expire after this many days</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-8 pt-5 border-t border-slate-200">
                      <button
                        onClick={() => setActiveTab('preview')}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateAdHocLink}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-transparent rounded-lg hover:bg-slate-900 transition-colors shadow-lg"
                      >
                        Create Payment Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                // Organization Link Settings Mode
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 mb-6">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <Settings className="h-6 w-6 text-slate-700 mr-3" strokeWidth={2} />
                          <h2 className="text-xl font-semibold text-slate-900">Organization Link Settings</h2>
                        </div>
                        <p className="text-sm text-slate-600">Configure how payment links are created and managed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Org Settings Panel - Left 2/3 */}
                      <div className="lg:col-span-2">
                        <div className="space-y-6">
                          {/* Auto-Generate Payment Links */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-base font-medium text-slate-900">Auto-Generate Payment Links</h3>
                                  <InfoTooltip text="Automatically create payment links for approved invoices" />
                                </div>
                                <p className="text-sm text-slate-600 mt-1">
                                  When enabled, payment links will be automatically generated based on the selected criteria.
                                </p>
                              </div>
                              <ToggleSwitch
                                enabled={settings.autoGenerate.enabled}
                                onChange={(value) => handleAutoGenerateChange('enabled', value)}
                              />
                            </div>

                            {/* Generate payment links for */}
                            {settings.autoGenerate.enabled && (
                              <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-4">
                                <div>
                                  <div className="flex items-center mb-3">
                                    <label className="text-sm font-medium text-slate-700">Generate payment links for:</label>
                                    <InfoTooltip text="Choose when payment links should be automatically created" />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="flex items-start">
                                      <input
                                        type="radio"
                                        name="autoGenerateMode"
                                        value="closed_invoices"
                                        checked={settings.autoGenerate.mode === 'closed_invoices'}
                                        onChange={(e) => handleAutoGenerateChange('mode', e.target.value)}
                                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 mt-0.5"
                                      />
                                      <div className="ml-3">
                                        <span className="text-sm text-slate-700 font-medium">All closed invoices</span>
                                        <p className="text-xs text-slate-500 mt-0.5">Payment links generated when invoices are marked as closed/final</p>
                                      </div>
                                    </label>

                                    <label className="flex items-start">
                                      <input
                                        type="radio"
                                        name="autoGenerateMode"
                                        value="all_accounts"
                                        checked={settings.autoGenerate.mode === 'all_accounts'}
                                        onChange={(e) => handleAutoGenerateChange('mode', e.target.value)}
                                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 mt-0.5"
                                      />
                                      <div className="ml-3">
                                        <span className="text-sm text-slate-700 font-medium">All accounts</span>
                                        <p className="text-xs text-slate-500 mt-0.5">Payment links generated for all invoice activity across accounts</p>
                                      </div>
                                    </label>
                                  </div>
                                </div>

                                {/* Allow account-level disable */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-700">Allow account-level disable</span>
                                    <InfoTooltip text="Individual accounts can override this setting" />
                                  </div>
                                  <ToggleSwitch
                                    enabled={settings.accountLevelDisable}
                                    onChange={(value) => handleToggle('accountLevelDisable', value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Ad-hoc Payment Links */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-base font-medium text-slate-900">Ad-hoc Payment Links</h3>
                                  <InfoTooltip text="Allow manual creation of payment links for various purposes" />
                                </div>
                                <p className="text-sm text-slate-600 mt-1">
                                  When enabled, users can create payment links manually with configurable attribution.
                                </p>
                              </div>
                              <ToggleSwitch
                                enabled={settings.adHocEnabled}
                                onChange={(value) => handleToggle('adHocEnabled', value)}
                              />
                            </div>

                            {/* Attribution Types */}
                            {settings.adHocEnabled && (
                              <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-slate-700 mb-3">Attribution Types</h4>
                                  <p className="text-xs text-slate-500 mb-3">Select which attribution types are available</p>

                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="text-sm text-slate-700">Invoice</span>
                                        <span className="ml-2 text-xs text-slate-500">(Default)</span>
                                      </div>
                                      <ToggleSwitch
                                        enabled={settings.attributionTypes.invoice}
                                        onChange={(value) => handleAttributionChange('invoice', value)}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-700">Open Amount</span>
                                      <ToggleSwitch
                                        enabled={settings.attributionTypes.openAmount}
                                        onChange={(value) => handleAttributionChange('openAmount', value)}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-700">Account Balance</span>
                                      <ToggleSwitch
                                        enabled={settings.attributionTypes.accountBalance}
                                        onChange={(value) => handleAttributionChange('accountBalance', value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* API Model - Right 1/3 */}
                      <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-sm sticky top-6">
                          <div className="px-4 py-4 border-b border-slate-700">
                            <h3 className="text-base font-medium text-white">API Model</h3>
                            <p className="text-sm text-slate-400 mt-1">JSON representation of org settings</p>
                          </div>

                          <div className="p-4">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({
  autoGenerate: {
    enabled: settings.autoGenerate.enabled,
    mode: settings.autoGenerate.mode
  },
  accountLevelDisable: settings.accountLevelDisable,
  adHocEnabled: settings.adHocEnabled,
  attributionTypes: {
    invoice: settings.attributionTypes.invoice,
    openAmount: settings.attributionTypes.openAmount,
    accountBalance: settings.attributionTypes.accountBalance
  }
}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                // Payment Link Profile Mode
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 mb-6">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <User className="h-6 w-6 text-slate-700 mr-3" strokeWidth={2} />
                          <h2 className="text-xl font-semibold text-slate-900">Payment Link Profile</h2>
                        </div>
                        <p className="text-sm text-slate-600">Configure payment experience and UX settings</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Profile Settings Panel - Left 2/3 */}
                      <div className="lg:col-span-2">
                        <div className="space-y-6">
                          {/* Applied To and Payment Gateway Profiles - Side by Side */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Applied To */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                              <div>
                                <h3 className="text-base font-medium text-slate-900">Applied To</h3>
                                <p className="text-sm text-slate-600 mt-1">Configure which accounts this profile applies to</p>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-3">Application Scope</h4>
                                <div className="space-y-3">
                                  <label className="flex items-start">
                                    <input
                                      type="radio"
                                      name="appliedToType"
                                      value="all_accounts"
                                      checked={settings.appliedTo.type === 'all_accounts'}
                                      onChange={(e) => handleAppliedToChange('type', e.target.value)}
                                      className="h-4 w-4 text-slate-600 border-slate-300 focus:ring-slate-500 mt-0.5"
                                    />
                                    <div className="ml-3">
                                      <span className="text-sm font-medium text-slate-700">All Accounts</span>
                                      <p className="text-xs text-slate-500 mt-0.5">Apply to all accounts in the system</p>
                                    </div>
                                  </label>

                                  <label className="flex items-start">
                                    <input
                                      type="radio"
                                      name="appliedToType"
                                      value="conditional"
                                      checked={settings.appliedTo.type === 'conditional'}
                                      onChange={(e) => handleAppliedToChange('type', e.target.value)}
                                      className="h-4 w-4 text-slate-600 border-slate-300 focus:ring-slate-500 mt-0.5"
                                    />
                                    <div className="ml-3">
                                      <span className="text-sm font-medium text-slate-700">Conditional</span>
                                      <p className="text-xs text-slate-500 mt-0.5">Apply based on specific criteria</p>
                                    </div>
                                  </label>
                                </div>
                              </div>

                              {/* Conditional Settings */}
                              {settings.appliedTo.type === 'conditional' && (
                                <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-4">
                                  <div>
                                    <div className="flex items-center mb-2">
                                      <label className="text-sm font-medium text-slate-700">Formula</label>
                                      <InfoTooltip text="Define the condition using dot notation for account properties" />
                                    </div>
                                    <input
                                      type="text"
                                      value={settings.appliedTo.formula}
                                      onChange={(e) => handleAppliedToChange('formula', e.target.value)}
                                      placeholder="Account.tier = 'enterprise'"
                                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-mono"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                      Examples: Account.tier = 'enterprise', Account.balance &gt; 1000, Account.type = 'premium'
                                    </p>
                                  </div>

                                  <div>
                                    <div className="flex items-center mb-2">
                                      <label className="text-sm font-medium text-slate-700">Priority</label>
                                      <InfoTooltip text="Higher numbers take precedence when multiple conditions match" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        value={settings.appliedTo.priority}
                                        onChange={(e) => handleAppliedToChange('priority', parseInt(e.target.value) || 1)}
                                        min="1"
                                        max="100"
                                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                                      />
                                      <span className="text-sm text-slate-500">(1 = lowest, 100 = highest)</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Payment Gateway Profiles */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                              <div>
                                <h3 className="text-base font-medium text-slate-900">Payment Gateway Profiles</h3>
                                <p className="text-sm text-slate-600 mt-1">Configure payment processing gateways</p>
                              </div>

                              <div className="space-y-4">
                                {/* Credit Card Gateway */}
                                <div>
                                  <div className="flex items-center mb-2">
                                    <label className="text-sm font-medium text-slate-700">Credit Card Gateway</label>
                                    <InfoTooltip text="Select the payment gateway for credit card transactions" />
                                  </div>
                                  <select
                                    value={settings.paymentGatewayProfiles.creditCard}
                                    onChange={(e) => handlePaymentGatewayChange('creditCard', e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                                  >
                                    <option value="BP Pay Merchant-Credit Card">BP Pay Merchant-Credit Card</option>
                                  </select>
                                </div>

                                {/* Direct Debit Gateway */}
                                <div>
                                  <div className="flex items-center mb-2">
                                    <label className="text-sm font-medium text-slate-700">Direct Debit Gateway</label>
                                    <InfoTooltip text="Select the payment gateway for direct debit/ACH transactions" />
                                  </div>
                                  <select
                                    value={settings.paymentGatewayProfiles.directDebit}
                                    onChange={(e) => handlePaymentGatewayChange('directDebit', e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                                  >
                                    <option value="BP Pay Merchant-ACH">BP Pay Merchant-ACH</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Display Options */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                            <div>
                              <h3 className="text-base font-medium text-slate-900">Display Options</h3>
                              <p className="text-sm text-slate-600 mt-1">Configure customer-facing interface</p>
                            </div>

                            <div className="space-y-4">
                              {/* Link Expiration */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-700">Link Expiration</span>
                                    <InfoTooltip text="Set how many days payment links remain active before expiring" />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={settings.linkExpirationDays}
                                      onChange={(e) => handleToggle('linkExpirationDays', parseInt(e.target.value) || 90)}
                                      min="1"
                                      max="365"
                                      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                    <span className="text-sm text-slate-500">days</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500">Payment links will automatically expire after this period</p>
                              </div>

                              {/* Show Invoice Details */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-slate-700">Show Invoice Details</span>
                                  <InfoTooltip text="Display invoice information section on payment link pages" />
                                </div>
                                <ToggleSwitch
                                  enabled={settings.showInvoiceDetails}
                                  onChange={(value) => handleToggle('showInvoiceDetails', value)}
                                />
                              </div>

                              {/* Enable PDF Options */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-slate-700">Enable PDF Preview & Download</span>
                                  <InfoTooltip text="Allow customers to preview and download invoice PDFs" />
                                </div>
                                <ToggleSwitch
                                  enabled={settings.enablePdfOptions}
                                  onChange={(value) => handleToggle('enablePdfOptions', value)}
                                  disabled={!settings.showInvoiceDetails}
                                />
                              </div>
                              {!settings.showInvoiceDetails && (
                                <p className="text-xs text-slate-500 ml-4">PDF options require invoice details to be shown</p>
                              )}
                            </div>
                          </div>

                          {/* Payment Options */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                            <div>
                              <h3 className="text-base font-medium text-slate-900">Payment Options</h3>
                              <p className="text-sm text-slate-600 mt-1">Configure payment flexibility</p>
                            </div>

                            <div className="space-y-4">
                              {/* Allow Partial Payments */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-700">Allow Partial Payments</span>
                                    <InfoTooltip text="Enable customers to pay less than the full amount" />
                                  </div>
                                  <ToggleSwitch
                                    enabled={settings.allowPartialPayments}
                                    onChange={(value) => handleToggle('allowPartialPayments', value)}
                                  />
                                </div>

                                {/* Partial Payment Percentage */}
                                {settings.allowPartialPayments && (
                                  <div className="ml-4 pl-4 border-l-2 border-slate-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium text-slate-700">Minimum Partial Payment</span>
                                        <InfoTooltip text="Minimum percentage of total amount for partial payments" />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="number"
                                          value={settings.partialPaymentPercentage}
                                          onChange={(e) => handleToggle('partialPaymentPercentage', parseInt(e.target.value) || 25)}
                                          min="1"
                                          max="99"
                                          className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                        />
                                        <span className="text-sm text-slate-500">%</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Allow Overpayments */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-700">Allow Overpayments</span>
                                    <InfoTooltip text="Enable customers to pay more than the amount due" />
                                  </div>
                                  <ToggleSwitch
                                    enabled={settings.allowOverpayments}
                                    onChange={(value) => handleToggle('allowOverpayments', value)}
                                  />
                                </div>

                                {/* Overpayment Percentage */}
                                {settings.allowOverpayments && (
                                  <div className="ml-4 pl-4 border-l-2 border-slate-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium text-slate-700">Maximum Overpayment</span>
                                        <InfoTooltip text="Maximum percentage above total amount for overpayments" />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="number"
                                          value={settings.overpaymentPercentage}
                                          onChange={(e) => handleToggle('overpaymentPercentage', parseInt(e.target.value) || 150)}
                                          min="101"
                                          max="500"
                                          className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                        />
                                        <span className="text-sm text-slate-500">%</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* API Model - Right 1/3 */}
                      <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-sm sticky top-6">
                          <div className="px-4 py-4 border-b border-slate-700">
                            <h3 className="text-base font-medium text-white">API Model</h3>
                            <p className="text-sm text-slate-400 mt-1">JSON representation of profile settings</p>
                          </div>

                          <div className="p-4">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({
  applied_to: settings.appliedTo.type === 'all_accounts'
    ? { type: "all_accounts" }
    : {
        type: "conditional",
        formula: settings.appliedTo.formula,
        priority: settings.appliedTo.priority
      },
  paymentGatewayProfiles: {
    creditCard: settings.paymentGatewayProfiles.creditCard,
    directDebit: settings.paymentGatewayProfiles.directDebit
  },
  displayOptions: {
    linkExpirationDays: settings.linkExpirationDays,
    showInvoiceDetails: settings.showInvoiceDetails,
    enablePdfOptions: settings.showInvoiceDetails ? settings.enablePdfOptions : null
  },
  paymentOptions: {
    allowPartialPayments: settings.allowPartialPayments,
    allowOverpayments: settings.allowOverpayments,
    partialPaymentPercentage: settings.allowPartialPayments ? settings.partialPaymentPercentage : null,
    overpaymentPercentage: settings.allowOverpayments ? settings.overpaymentPercentage : null
  }
}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Direct Debit Mandate Modal */}
      {showMandateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Direct Debit Mandate</h3>
              <button
                onClick={() => setShowMandateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4">
                Your payment has been initiated. To complete the direct debit mandate setup for future payments, please review the mandate documentation.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('Opening mandate document');
                  // In a real implementation, this would open the mandate document
                }}
                className="flex-1 bg-slate-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Click here to view mandate
              </button>
              <button
                onClick={() => setShowMandateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentLinksPrototype;
