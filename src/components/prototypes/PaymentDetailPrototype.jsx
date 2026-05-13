import React, { useState, useRef, useLayoutEffect } from 'react';
import './PaymentDetailPrototype.css';

const STORIES = {
  1: {
    label: 'Payment summary fields',
    desc: 'Payment Amount, Allocated Amount, and Unallocated Amount are now surfaced directly in the header so the payment\'s disposition is immediately clear without scrolling to the allocations table. The "Allocate to Other Accounts" button is moved inline with the Unallocated Amount row — contextually placed where the action is relevant.',
  },
  2: {
    label: 'Lockbox File link',
    desc: 'A direct link to the source Lockbox File record is now shown in the payment header, making it easy to trace a payment back to the lockbox batch it arrived in without leaving the page or running a separate search.',
  },
  3: {
    label: 'Account ID & Name columns',
    desc: 'Account ID and Account Name are now separate columns in the allocations table. This makes cross-account allocations immediately visible — when a payment from a parent account is applied to a sub-account invoice, the different account IDs are scannable at a glance. Account IDs are hyperlinked to navigate directly to the account record.',
  },
  4: {
    label: 'Invoice ID hyperlink',
    desc: 'Invoice IDs in the allocations table are now clickable deep links, navigating directly to the invoice detail page. Previously the ID was display-only, requiring a separate search to find the invoice.',
  },
  5: {
    label: 'Credit Amount column',
    desc: 'The Credits column previously showed a count of credit records (e.g. "1"). It now shows the credit dollar amount, so the effect on the invoice balance is directly visible without having to open the credit record to find the value.',
  },
};

function computePosition(cardEl, targetEl) {
  const rect = targetEl.getBoundingClientRect();
  const cardW = 300;
  const cardH = cardEl ? cardEl.offsetHeight : 160;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isHeader = targetEl.tagName === 'TH';
  let left, top;

  if (isHeader) {
    if (rect.top - cardH - margin > 0) {
      top = rect.top - cardH - margin;
      left = rect.left;
    } else if (rect.right + cardW + margin < vw) {
      left = rect.right + margin;
      top = rect.top;
    } else {
      left = rect.left - cardW - margin;
      top = rect.top;
    }
  } else {
    if (rect.right + cardW + margin < vw) {
      left = rect.right + margin;
      top = rect.top;
    } else if (rect.left - cardW - margin > 0) {
      left = rect.left - cardW - margin;
      top = rect.top;
    } else {
      left = rect.left;
      top = rect.bottom + margin;
    }
  }

  return {
    top: Math.max(8, Math.min(top, vh - cardH - 8)),
    left: Math.max(8, Math.min(left, vw - cardW - 8)),
  };
}

export default function PaymentDetailPrototype() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [overlayPos, setOverlayPos] = useState({ top: -9999, left: -9999 });
  const anchorRefs = useRef({});
  const overlayRef = useRef(null);

  useLayoutEffect(() => {
    if (activeStory === null) return;
    const anchor = anchorRefs.current[activeStory];
    const card = overlayRef.current;
    if (anchor && card) setOverlayPos(computePosition(card, anchor));
  }, [activeStory]);

  function toggleStory(n) {
    setActiveStory(prev => (prev === n ? null : n));
  }

  function t(n) {
    return activeStory === n ? ' story-target' : '';
  }

  const story = activeStory ? STORIES[activeStory] : null;

  return (
    <div className="pd-root">

      {/* TOP NAV */}
      <div className="topnav">
        <div className="topnav-logo">Billing<span>Platform</span></div>
        <div className="topnav-badge">DEV</div>
        <div className="topnav-search">🔍 Search…</div>
        <div className="topnav-user">Kevin Nathan</div>
      </div>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="#">Accounting</a>
        <span className="sep">/</span>
        <a href="#">Accounts Receivable</a>
        <span className="sep">/</span>
        <a href="#">Account Details [Partmaster Head Office BU eDPT]</a>
        <span className="sep">/</span>
        <span className="current">Payments [749611]</span>
      </div>

      <div className="layout">

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-item">Home</div>
            <div className="sidebar-item">Products</div>
            <div className="sidebar-item">Accounts</div>
            <div className="sidebar-item">Quotes</div>
            <div className="sidebar-item">Collections</div>
          </div>
          <div className="sidebar-group-label">Accounting</div>
          <div className="sidebar-section">
            <div className="sidebar-item">Manage Invoices</div>
            <div className="sidebar-item">Accounts Receivable</div>
            <div className="sidebar-item sub">Account Details</div>
            <div className="sidebar-item sub">Credits</div>
            <div className="sidebar-item sub active">Payments [749611]</div>
            <div className="sidebar-item sub" style={{ paddingLeft: 44 }}>Refunds</div>
            <div className="sidebar-item sub" style={{ paddingLeft: 44 }}>Payment Allocation</div>
            <div className="sidebar-item sub" style={{ paddingLeft: 44 }}>Scheduled Payment Retries</div>
            <div className="sidebar-item">Manage Payments</div>
            <div className="sidebar-item">Bulk Admin Tools</div>
            <div className="sidebar-item">Payment Batch Mgmt</div>
            <div className="sidebar-item">Accounting Mgmt</div>
            <div className="sidebar-item">Financial Mgmt</div>
          </div>
          <div className="sidebar-group-label">Freightways Data</div>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* STORY PANEL */}
          <div className="story-panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="story-panel-label">Changes</div>
              <div style={{ fontSize: 10, color: '#a07830', fontWeight: 400 }}>Click each to review</div>
            </div>
            <div className="story-pills">
              {Object.entries(STORIES).map(([n, s]) => (
                <div
                  key={n}
                  className={`story-pill${activeStory === +n ? ' active' : ''}`}
                  onClick={() => toggleStory(+n)}
                >
                  <span className="pill-num">{n}</span> {s.label}
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <button
                onClick={() => setShowCurrent(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: showCurrent ? '#172b4d' : '#fff',
                  border: '1.5px solid #172b4d',
                  borderRadius: 20, padding: '4px 12px 4px 8px',
                  fontSize: 11.5, fontWeight: 600,
                  color: showCurrent ? '#fff' : '#172b4d',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: showCurrent ? '#fff' : '#172b4d', color: showCurrent ? '#172b4d' : '#fff',
                  fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {showCurrent ? '▲' : '▼'}
                </span>
                Current screen
              </button>
            </div>
          </div>

          {/* CURRENT SCREEN COMPARISON */}
          {showCurrent && (
            <div style={{
              background: '#fff', border: '1.5px solid #172b4d', borderRadius: 6,
              marginBottom: 16, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(23,43,77,0.12)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 14px', background: '#172b4d',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  Current screen
                </span>
                <button
                  onClick={() => setShowCurrent(false)}
                  style={{ background: 'none', border: 'none', color: '#8ba3c7', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
                >×</button>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <img
                  src="/images/current-payment-detail.png"
                  alt="Current payment detail screen"
                  style={{ width: '100%', borderRadius: 4, border: '1px solid #dfe1e6', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* PAGE HEADER */}
          <div className="page-header">
            <div className="page-title">
              <div className="page-title-icon" />
              Payments: 749611
            </div>
            <div className="btn-group">
              <button className="btn btn-default">Edit</button>
              <button className="btn btn-default">New</button>
              <button className="btn btn-default">Refresh</button>
              <button className="btn btn-primary">Actions ▾</button>
              <button className="btn btn-icon">↺</button>
            </div>
          </div>

          {/* PAYMENT DETAIL CARD */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Payment Details</div>
            </div>
            <div className="detail-grid">

              {/* LEFT COL */}
              <div className="detail-col">
                <div className="detail-row">
                  <div className="detail-label">Name of Other Party</div>
                  <div className="detail-value">Partmaster Head Office BU eDPT</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Customer Key</div>
                  <div className="detail-value mono">A 1008403</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Account Number</div>
                  <div className="detail-value"><a href="#" className="link">1008403</a></div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Account Name</div>
                  <div className="detail-value">Partmaster Head Office BU eDPT</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Name of Other Party <span className="info-icon">i</span></div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Payment Write Off Created</div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Written Off Payment</div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Payment Allocation Offset</div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Payment Date</div>
                  <div className="detail-value mono">19/11/2025 10:58:02 +00:00</div>
                </div>

                {/* Story 1 anchor — amount summary rows */}
                <div
                  className={`overlay-anchor${t(1)}`}
                  ref={el => { anchorRefs.current[1] = el; }}
                  style={{ borderRadius: 4, margin: '4px -16px', padding: '0 16px' }}
                >
                  <div className="detail-row">
                    <div className="detail-label">Payment Amount</div>
                    <div className="detail-value amount">$20,000.00</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Allocated Amount</div>
                    <div className="detail-value amount" style={{ color: 'var(--green)' }}>$15,000.00</div>
                  </div>
                  <div className="detail-row" style={{ alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                    <div className="detail-label" style={{ color: '#7a5700' }}>Unallocated Amount</div>
                    <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="amount" style={{ color: '#e8930a', fontWeight: 700 }}>$5,000.00</span>
                      <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }}>Allocate to Other Accounts</button>
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-label">Refund Amount</div>
                  <div className="detail-value amount">$0.00</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Payment &amp; Credit Allocation Method</div>
                  <div className="detail-value">Allocate To Invoice</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Notes</div>
                  <div className="detail-value">
                    <div className="notes-box">[11/19/2025 06:58 PM: Kevin.Baterina.dev]<br />Remittance received via lockbox batch #3847. Applied to outstanding invoices per customer instruction.</div>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">External Reference ID</div>
                  <div className="detail-value mono">749611</div>
                </div>
              </div>

              {/* RIGHT COL */}
              <div className="detail-col">
                <div className="detail-row">
                  <div className="detail-label">Billing Entity</div>
                  <div className="detail-value mono">74872</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Payment Type</div>
                  <div className="detail-value"><span className="badge badge-blue">BANK UPLOAD</span></div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Automatic Payment</div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Payment Status</div>
                  <div className="detail-value"><span className="badge badge-green">CLEARED</span></div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Voided</div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Voided Amount</div>
                  <div className="detail-value muted">—</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Migrated Payment</div>
                  <div className="detail-value muted">—</div>
                </div>

                {/* Story 2 anchor — lockbox file row */}
                <div
                  className={`detail-row overlay-anchor${t(2)}`}
                  ref={el => { anchorRefs.current[2] = el; }}
                >
                  <div className="detail-label">Lockbox File</div>
                  <div className="detail-value">
                    <a href="#" className="link">LBX-2025-11193847</a>
                    <div style={{ fontSize: 11, color: 'var(--text-meta)', marginTop: 2 }}>Received 11/19/2025 — NZC Bank Batch #3847</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PAYMENT ALLOCATIONS CARD */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">Payment Allocations</div>
              <div className="card-actions">
                <button className="btn btn-default" style={{ fontSize: 11 }}>⬇ Export</button>
                <button className="btn btn-icon">•••</button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th
                      className={activeStory === 3 ? 'story-target' : ''}
                      ref={el => { anchorRefs.current[3] = el; }}
                    >Account ID</th>
                    <th className={activeStory === 3 ? 'story-target' : ''}>Account Name</th>
                    <th>Due Date</th>
                    <th
                      className={activeStory === 4 ? 'story-target' : ''}
                      ref={el => { anchorRefs.current[4] = el; }}
                    >Invoice ID</th>
                    <th className="amount">Grand Total</th>
                    <th className="amount">Amount Paid</th>
                    <th
                      className={`amount${activeStory === 5 ? ' story-target' : ''}`}
                      ref={el => { anchorRefs.current[5] = el; }}
                    >Credit Amount</th>
                    <th className="amount">Allocated Amount</th>
                    <th className="amount">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><a href="#" className="link">1009217</a></td>
                    <td>Partmaster Auckland Distribution</td>
                    <td>06/30/2025</td>
                    <td><a href="#" className="link">549018</a></td>
                    <td className="amount">$4,000.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount" style={{ color: 'var(--green)' }}>$500.00</td>
                    <td className="amount">$3,500.00</td>
                    <td className="amount">$0.00</td>
                  </tr>
                  <tr>
                    <td><a href="#" className="link">1008403</a></td>
                    <td>Partmaster Head Office BU eDPT</td>
                    <td>07/20/2025</td>
                    <td><a href="#" className="link">557395</a></td>
                    <td className="amount">$12,000.00</td>
                    <td className="amount">$10,000.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$2,000.00</td>
                    <td className="amount">$0.00</td>
                  </tr>
                  <tr>
                    <td><a href="#" className="link">1008403</a></td>
                    <td>Partmaster Head Office BU eDPT</td>
                    <td>08/15/2025</td>
                    <td><a href="#" className="link">561204</a></td>
                    <td className="amount">$6,000.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$4,000.00</td>
                    <td className="amount" style={{ color: 'var(--yellow)' }}>$2,000.00</td>
                  </tr>
                  <tr>
                    <td><a href="#" className="link">1011842</a></td>
                    <td>Partmaster Wellington Wholesale</td>
                    <td>09/01/2025</td>
                    <td><a href="#" className="link">563890</a></td>
                    <td className="amount">$2,500.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$2,000.00</td>
                    <td className="amount" style={{ color: 'var(--yellow)' }}>$500.00</td>
                  </tr>
                  <tr>
                    <td><a href="#" className="link">1011842</a></td>
                    <td>Partmaster Wellington Wholesale</td>
                    <td>10/05/2025</td>
                    <td><a href="#" className="link">571033</a></td>
                    <td className="amount">$5,000.00</td>
                    <td className="amount">$3,000.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$2,000.00</td>
                    <td className="amount">$0.00</td>
                  </tr>
                  <tr>
                    <td><a href="#" className="link">1008403</a></td>
                    <td>Partmaster Head Office BU eDPT</td>
                    <td>11/01/2025</td>
                    <td><a href="#" className="link">574210</a></td>
                    <td className="amount negative">-$1,500.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$0.00</td>
                    <td className="amount">$1,500.00</td>
                    <td className="amount">$0.00</td>
                  </tr>
                </tbody>
              </table>
              <div className="table-footer">Showing 1 to 6 of 6 rows</div>
            </div>
          </div>

          {/* GL ENTRIES */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">GL Entries</div>
              <div className="card-actions">
                <button className="btn btn-default" style={{ fontSize: 11 }}>⬇ Export</button>
                <button className="btn btn-icon">•••</button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Booking Date</th>
                    <th>Account</th>
                    <th className="amount">Debit Amount</th>
                    <th className="amount">Credit Amount</th>
                    <th>Invoice</th>
                    <th>Source</th>
                    <th>Attributes</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="gl-row">
                    <td className="mono">11/19/2025</td>
                    <td>Trade Debtors - 7100</td>
                    <td className="amount">—</td>
                    <td className="amount positive">$20,000.00</td>
                    <td className="muted">—</td>
                    <td>Payments ID 749611</td>
                    <td className="mono">NZC-999-7100-</td>
                    <td>—</td>
                  </tr>
                  <tr className="gl-row">
                    <td className="mono">11/19/2025</td>
                    <td>Bank Account - NZC - 7011</td>
                    <td className="amount">$20,000.00</td>
                    <td className="amount">—</td>
                    <td className="muted">—</td>
                    <td>Payments ID 749611</td>
                    <td className="mono">NZC--NZC-</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
              <div className="table-footer">Showing 1 to 2 of 2 rows</div>
            </div>
          </div>


          {/* SYSTEM INFO */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">System Information</div>
            </div>
            <div className="sysinfo-grid">
              <div>
                <div className="sysinfo-row">
                  <div className="detail-label">Payment Item ID</div>
                  <div className="detail-value mono">749611</div>
                </div>
                <div className="sysinfo-row">
                  <div className="detail-label">Created On</div>
                  <div className="detail-value mono">11/19/2025</div>
                </div>
                <div className="sysinfo-row">
                  <div className="detail-label">Last Updated On</div>
                  <div className="detail-value mono">11/19/2025</div>
                </div>
              </div>
              <div>
                <div className="sysinfo-row">
                  <div className="detail-label">Created By User</div>
                  <div className="detail-value">Kevin Baterina</div>
                </div>
                <div className="sysinfo-row">
                  <div className="detail-label">Last Updated By User</div>
                  <div className="detail-value">Kevin Baterina</div>
                </div>
              </div>
            </div>
          </div>

        </div>{/* /main */}
      </div>{/* /layout */}

      {/* OVERLAY CARD — positioned via useLayoutEffect */}
      {story && (
        <div
          ref={overlayRef}
          className="pd-root-overlay"
          style={{ top: overlayPos.top, left: overlayPos.left }}
        >
          <div className="pd-root-overlay-header">
            <div className="pd-root-overlay-title">
              <span className="pill-num">{activeStory}</span>
              {story.label}
            </div>
            <span className="pd-root-overlay-close" onClick={() => setActiveStory(null)}>×</span>
          </div>
          <p>{story.desc}</p>
        </div>
      )}

    </div>
  );
}
