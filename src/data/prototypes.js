// Portfolio-style prototype statuses for creative workflow
export const PROTOTYPE_STATUSES = {
  early: { label: 'Early Concept', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  iteration: { label: 'In Iteration', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  archive: { label: 'Archived', color: 'bg-gray-100 text-gray-800 border-gray-300' }
};

let prototypeData = [
    {
      id: 'payment-links',
      title: 'Payment Links',
      description: 'WYSIWYG editor for creating and managing payment links with real-time preview capabilities',
      category: 'Payments',
      status: 'iteration',
      priority: 'high',
      lastUpdated: '2025-06-17',
      author: 'Product Team',
      comments: 0,
      tags: ['payments', 'links', 'invoice', 'customer-experience'],
      thumbnail: '💳',
      progress: 90,
      route: '/prototypes/payment-links',
      featured: true,
      screenshot: '/src/assets/link_profile.png',
      insights: 'Strong user engagement with 85% completion rate'
    },
    {
      id: 'cash-app',
      title: 'Cash Application / Lockbox',
      description: 'Auto-allocation dashboard for cash application and lockbox processing with file import and transaction matching',
      category: 'Payments',
      status: 'early',
      priority: 'high',
      lastUpdated: '2025-11-23',
      author: 'Product Team',
      comments: 0,
      tags: ['payments', 'cash-app', 'lockbox', 'reconciliation', 'allocation'],
      thumbnail: '💰',
      progress: 5,
      route: '/prototypes/cash-app',
      featured: false,
      screenshot: '/src/assets/lockdash2.png',
      insights: 'Initial wireframes showing promising workflow automation'
    },
    {
      id: 'lockbox',
      title: 'Lockbox Processing Dashboard',
      description: 'Executive dashboard for lockbox processing with KPIs, exception management, and action-oriented workflow',
      category: 'Payments',
      status: 'iteration',
      priority: 'high',
      lastUpdated: '2025-11-23',
      author: 'Product Team',
      comments: 0,
      tags: ['payments', 'lockbox', 'dashboard', 'reconciliation', 'exceptions'],
      thumbnail: '📊',
      progress: 60,
      route: '/prototypes/lockbox',
      featured: true,
      screenshot: '/src/assets/allocation_dashboard.png',
      insights: 'Dashboard reduces processing time by 40%'
    },
    // {
    //   id: 'lockbox-validation',
    //   title: 'Lockbox Pre-Post Validation',
    //   description: 'Pre-posting validation interface for lockbox processing - review and correct allocations before posting with full rule transparency',
    //   category: 'Payments',
    //   status: 'iteration',
    //   priority: 'critical',
    //   lastUpdated: '2025-12-01',
    //   author: 'Product Team',
    //   comments: 0,
    //   tags: ['payments', 'lockbox', 'validation', 'pre-post-review', 'rule-transparency', 'allocation-correction'],
    //   thumbnail: '✅',
    //   progress: 85,
    //   route: '/prototypes/lockbox-validation',
    //   featured: false,
    //   screenshot: '/api/placeholder/400/250',
    //   insights: 'Validation accuracy improved to 98.5%'
    // },
    // {
    //   id: 'user-onboarding',
    //   title: 'User Onboarding Flow',
    //   description: 'Step-by-step onboarding experience for new customers with progress tracking',
    //   category: 'User Experience',
    //   status: 'early',
    //   priority: 'medium',
    //   lastUpdated: '2025-01-10',
    //   author: 'UX Team',
    //   comments: 5,
    //   tags: ['onboarding', 'user-flow', 'registration'],
    //   thumbnail: '👋',
    //   progress: 25,
    //   route: '/prototypes/user-onboarding',
    //   featured: false,
    //   screenshot: '/api/placeholder/400/250',
    //   insights: 'User feedback indicates 90% satisfaction with flow'
    // },
    {
      id: 'api-docs',
      title: 'Payment Links API Documentation',
      description: 'Interactive API documentation for the Pay By Link Public API with Swagger UI',
      category: 'Developer Tools',
      status: 'archive',
      priority: 'high',
      lastUpdated: '2025-12-30',
      author: 'Engineering Team',
      comments: 0,
      tags: ['api', 'documentation', 'openapi', 'swagger', 'payments'],
      thumbnail: '📋',
      progress: 100,
      route: '/prototypes/api-docs',
      featured: false,
      screenshot: '/src/assets/link_api.png',
      insights: 'Documentation completed and deployed to production'
    },
    // ... more prototypes
  ];

export const prototypes = prototypeData;

// Function to update prototype status
export const updatePrototypeStatus = (prototypeId, newStatus) => {
  const index = prototypeData.findIndex(p => p.id === prototypeId);
  if (index !== -1) {
    prototypeData[index].status = newStatus;
    prototypeData[index].lastUpdated = new Date().toISOString().split('T')[0];
    return true;
  }
  return false;
};