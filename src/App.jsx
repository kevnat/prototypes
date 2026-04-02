import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrototypeMenu from './components/prototypes/PrototypeMenu';
import PrototypeLayout from './components/prototypes/PrototypeLayout';
import PaymentLinksPrototype from './components/prototypes/PaymentLinksPrototype';
import CashAppPrototype from './components/prototypes/CashAppPrototype';
import LockboxPrototype from './components/prototypes/LockboxPrototype';
import LockboxValidationScreen from './components/prototypes/LockboxValidationScreen';
import EnhancedLockboxPrototype from './components/prototypes/EnhancedLockboxPrototype';
import ApiDocsPrototype from './components/prototypes/ApiDocsPrototype';
import PaymentsOpsDashboard from './components/prototypes/PaymentsOpsDashboard';
// import AnalyticsDashboard from './components/prototypes/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main prototype dashboard */}
        <Route path="/" element={<PrototypeMenu />} />
        <Route path="/prototypes" element={<PrototypeMenu />} />
        
        {/* Individual prototypes wrapped in layout */}
        <Route path="/prototypes/payment-links" element={<PrototypeLayout />}>
          <Route index element={<PaymentLinksPrototype />} />
        </Route>
        <Route path="/prototypes/cash-app" element={<PrototypeLayout />}>
          <Route index element={<CashAppPrototype />} />
        </Route>
        <Route path="/prototypes/lockbox" element={<PrototypeLayout />}>
          <Route index element={<LockboxPrototype />} />
        </Route>
        <Route path="/prototypes/lockbox-validation" element={<PrototypeLayout />}>
          <Route index element={<LockboxValidationScreen />} />
        </Route>
        <Route path="/prototypes/enhanced-lockbox" element={<PrototypeLayout />}>
          <Route index element={<EnhancedLockboxPrototype />} />
        </Route>
        <Route path="/prototypes/payments-ops" element={<PrototypeLayout />}>
          <Route index element={<PaymentsOpsDashboard />} />
        </Route>
        <Route path="/prototypes/api-docs" element={<PrototypeLayout />}>
          <Route index element={<ApiDocsPrototype />} />
        </Route>

        {/* Standalone docs route */}
        <Route path="/docs" element={<ApiDocsPrototype />} />

        {/* <Route path="/prototypes/analytics-dashboard" element={<AnalyticsDashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;