// ===========================================
// 6. Adding New Prototypes
// ===========================================

// To add a new prototype:

// 1. Add to prototypes.js:
const newPrototype = {
  id: 'new-feature',
  title: 'New Feature Name',
  description: 'Description of the new feature',
  category: 'Category',
  status: 'draft',
  priority: 'medium',
  lastUpdated: '2025-01-16',
  author: 'Your Team',
  comments: 0,
  tags: ['tag1', 'tag2'],
  thumbnail: '🚀',
  progress: 0,
  route: '/prototypes/new-feature'
};

// 2. Create component: components/prototypes/NewFeaturePrototype.jsx
// 3. Add route to App.jsx:
// <Route path="new-feature" element={<NewFeaturePrototype />} />
