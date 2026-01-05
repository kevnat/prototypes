import React, { useState, useEffect } from 'react';
import { Save, Eye, Settings, Download, Plus, MessageSquare, Send, User, ArrowLeft, Search, Filter, Grid, List, Star, Clock, CheckCircle, AlertCircle, Users, Calendar, Tag } from 'lucide-react';

// Main Prototype Management Component
const PrototypeFramework = () => {
  const [currentView, setCurrentView] = useState('menu'); // 'menu' or specific prototype ID
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [prototypes] = useState([
    {
      id: 'payment-links',
      title: 'Payment Links Experience',
      description: 'WYSIWYG editor for creating and managing payment links with real-time preview capabilities',
      category: 'Payments',
      status: 'in-progress', // 'draft', 'in-progress', 'review', 'completed'
      priority: 'high',
      lastUpdated: '2025-01-15',
      author: 'Product Team',
      comments: 12,
      tags: ['payments', 'links', 'invoice', 'customer-experience'],
      thumbnail: '💳',
      progress: 85
    },
    {
      id: 'user-onboarding',
      title: 'User Onboarding Flow',
      description: 'Step-by-step onboarding experience for new customers with progress tracking',
      category: 'User Experience',
      status: 'draft',
      priority: 'medium',
      lastUpdated: '2025-01-10',
      author: 'UX Team',
      comments: 5,
      tags: ['onboarding', 'user-flow', 'registration'],
      thumbnail: '👋',
      progress: 25
    },
    {
      id: 'dashboard-analytics',
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics dashboard with real-time metrics and customizable widgets',
      category: 'Analytics',
      status: 'review',
      priority: 'high',
      lastUpdated: '2025-01-12',
      author: 'Data Team',
      comments: 18,
      tags: ['analytics', 'dashboard', 'metrics', 'reporting'],
      thumbnail: '📊',
      progress: 90
    },
    {
      id: 'mobile-app',
      title: 'Mobile App Prototype',
      description: 'Native mobile app experience with offline capabilities and push notifications',
      category: 'Mobile',
      status: 'completed',
      priority: 'high',
      lastUpdated: '2025-01-08',
      author: 'Mobile Team',
      comments: 32,
      tags: ['mobile', 'ios', 'android', 'offline'],
      thumbnail: '📱',
      progress: 100
    },
    {
      id: 'admin-portal',
      title: 'Admin Management Portal',
      description: 'Administrative interface for managing users, permissions, and system settings',
      category: 'Administration',
      status: 'in-progress',
      priority: 'medium',
      lastUpdated: '2025-01-14',
      author: 'Platform Team',
      comments: 7,
      tags: ['admin', 'permissions', 'management'],
      thumbnail: '⚙️',
      progress: 60
    },
    {
      id: 'checkout-flow',
      title: 'Checkout Experience',
      description: 'Streamlined checkout process with multiple payment options and guest checkout',
      category: 'E-commerce',
      status: 'draft',
      priority: 'high',
      lastUpdated: '2025-01-13',
      author: 'Commerce Team',
      comments: 3,
      tags: ['checkout', 'payments', 'conversion'],
      thumbnail: '🛒',
      progress: 15
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'review': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredPrototypes = prototypes.filter(prototype => {
    const matchesSearch = prototype.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prototype.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prototype.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || prototype.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Main Menu Component
  const PrototypeMenu = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prototype Studio</h1>
              <p className="text-sm text-gray-600 mt-1">Design, iterate, and collaborate on product prototypes</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              New Prototype
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search prototypes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Prototypes</p>
                <p className="text-2xl font-semibold text-gray-900">{prototypes.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Grid className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prototypes.filter(p => p.status === 'in-progress').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prototypes.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Review</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prototypes.filter(p => p.status === 'review').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Prototypes Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrototypes.map((prototype) => (
              <div
                key={prototype.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md cursor-pointer group"
                onClick={() => setCurrentView(prototype.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">{prototype.thumbnail}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {prototype.title}
                        </h3>
                        <p className="text-sm text-gray-600">{prototype.category}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prototype.status)}`}>
                      {prototype.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{prototype.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs text-gray-700 font-medium">{prototype.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${prototype.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {prototype.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                    {prototype.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        +{prototype.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{prototype.author}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{prototype.comments}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{prototype.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Prototype</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-2">Author</div>
                <div className="col-span-2">Last Updated</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredPrototypes.map((prototype) => (
                <div
                  key={prototype.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentView(prototype.id)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{prototype.thumbnail}</div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{prototype.title}</h3>
                          <p className="text-xs text-gray-500">{prototype.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prototype.status)}`}>
                        {prototype.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${prototype.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-700">{prototype.progress}%</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">{prototype.author}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">{prototype.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredPrototypes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prototypes found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  // Payment Links Prototype Component (existing component with back button)
  const PaymentLinksPrototype = () => {
    const [activeTab, setActiveTab] = useState('preview');
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState([]);
    const [userName, setUserName] = useState('');
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
      autoGenerate: true,
      accountLevelDisable: true,
      adHocEnabled: true,
      attributionTypes: {
        invoice: true,
        openAmount: true,
        accountBalance: true
      },
      allowPartialPayments: true,
      allowOverpayments: true,
      showInvoiceDetails: true,
      enablePdfOptions: true,
      minimumPartialPayment: 25,
      maximumOverpayment: 150,
      linkExpirationDays: 90
    });

    const [paymentAmount, setPaymentAmount] = useState('125.00');
    const [paymentType, setPaymentType] = useState('credit');

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

    const handleToggle = (key, value) => {
      setSettings(prev => ({
        ...prev,
        [key]: value
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
        .filter(([key, enabled]) => enabled)
        .map(([key]) => key);
    };

    const handleAddComment = () => {
      if (newComment.trim() && userName.trim()) {
        const comment = {
          id: Date.now(),
          text: newComment,
          author: userName,
          timestamp: new Date().toLocaleString(),
          tab: activeTab
        };
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAddComment();
      }
    };

    const getUserInitials = (name) => {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getAvatarColor = (name) => {
      const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
        'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
      ];
      const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-5 w-10 items-center rounded-full transition-colors
          ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
    );

    const InfoTooltip = ({ text }) => (
      <div className="group relative inline-block ml-1">
        <svg className="h-3.5 w-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="m9,9 0,0a3,3 0 1,1 6,0c0,2 -3,3 -3,3"/>
          <path d="m12,17 .01,0"/>
        </svg>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {text}
        </div>
      </div>
    );

    const SidebarNavItem = ({ id, icon: Icon, label, isActive, onClick }) => (
      <button
        onClick={() => onClick(id)}
        className={`
          w-full flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors
          ${isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
      >
        <Icon className="h-4 w-4 mr-2" />
        {label}
      </button>
    );

    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('menu')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base font-semibold text-gray-900">Payment Links Prototype</h1>
                <p className="text-xs text-gray-500">WYSIWYG editor for payment link experiences</p>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </button>
          </div>
        </div>

        {/* Rest of the Payment Links component remains the same... */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
            {/* User Profile Section */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              {!userName && !isEditingName ? (
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Set your name to start commenting</p>
                  <button
                    onClick={handleStartEditingName}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Set Name
                  </button>
                </div>
              ) : isEditingName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    onKeyDown={handleNameKeyPress}
                    placeholder="Enter your name"
                    className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveName}
                      disabled={!tempUserName.trim()}
                      className="flex-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-medium ${getAvatarColor(userName)}`}>
                      {getUserInitials(userName)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{userName}</span>
                  </div>
                  <button
                    onClick={handleStartEditingName}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="p-3 border-b border-gray-200">
              <nav className="space-y-1">
                <SidebarNavItem
                  id="preview"
                  icon={Eye}
                  label="Preview"
                  isActive={activeTab === 'preview'}
                  onClick={setActiveTab}
                />
                <SidebarNavItem
                  id="adhoc"
                  icon={Plus}
                  label="Create Link"
                  isActive={activeTab === 'adhoc'}
                  onClick={setActiveTab}
                />
                <SidebarNavItem
                  id="settings"
                  icon={Settings}
                  label="Settings"
                  isActive={activeTab === 'settings'}
                  onClick={setActiveTab}
                />
              </nav>
            </div>

            {/* Comments Section */}
            <div className="border-b border-gray-200">
              {/* Comments Header */}
              <div className="px-3 py-2 bg-gray-50">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                  <div className="flex items-center">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    <span className="uppercase tracking-wide">Comments</span>
                  </div>
                  <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                    {comments.filter(c => c.tab === activeTab).length}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
                </div>
              </div>

              {/* Add Comment Form */}
              {userName && (
                <div className="px-3 py-2 bg-white border-t border-gray-100">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Add a comment as ${userName}...`}
                    rows={2}
                    className="block w-full px-2 py-1 text-xs border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-gray-500">Enter to send</span>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="flex items-center px-2 py-0.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div className="space-y-2">
                {!userName ? (
                  <div className="text-center py-4 text-gray-400">
                    <p className="text-xs">Set your name above to start commenting</p>
                  </div>
                ) : comments.filter(comment => comment.tab === activeTab).length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <p className="text-xs">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to comment!</p>
                  </div>
                ) : (
                  comments
                    .filter(comment => comment.tab === activeTab)
                    .sort((a, b) => b.id - a.id)
                    .map((comment) => (
                      <div key={comment.id} className="text-xs">
                        <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex-shrink-0">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(comment.author)}`}>
                              {getUserInitials(comment.author)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-0.5">
                              <span className="font-medium text-gray-900">{comment.author}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500 text-xs">{comment.timestamp}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed break-words">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area - Same as before but truncated for space */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {activeTab === 'preview' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Preview</h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Payment Interface</h3>
                          <p className="text-blue-700">Interactive payment form would be rendered here with all the configured settings and options.</p>
                          <div className="mt-4 p-4 bg-white rounded border">
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-700">Invoice: {invoice.id}</p>
                              <p className="text-sm text-gray-600">Amount: ${invoice.amount}</p>
                              <p className="text-sm text-gray-600">Due: {invoice.dueDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'adhoc' && (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Ad-Hoc Payment Link</h2>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">Ad-hoc payment link creation interface would be implemented here with all the form fields and options.</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings Configuration</h2>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800">Settings panel would be implemented here with toggles, inputs, and configuration options for the payment links system.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Router logic
  if (currentView === 'menu') {
    return <PrototypeMenu />;
  } else if (currentView === 'payment-links') {
    return <PaymentLinksPrototype />;
  } else {
    // For other prototypes, show a placeholder
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('menu')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {prototypes.find(p => p.id === currentView)?.title || 'Prototype'}
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Prototype Coming Soon</h2>
            <p className="text-gray-600 mb-4">This prototype is still in development.</p>
            <button
              onClick={() => setCurrentView('menu')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Prototypes
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default PrototypeFramework;