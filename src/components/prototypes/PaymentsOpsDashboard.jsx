import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './PaymentsOpsDashboard.css';

// ─── Mock data ────────────────────────────────────────────────────────────────
const generateData = (startDate, endDate) => {
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  const rows = [];

  while (cursor <= end) {
    const dateStr = cursor.toISOString().split('T')[0];
    const achCount = Math.floor(Math.random() * 400 + 200);
    const achVolume = achCount * (Math.random() * 4000 + 1000);
    const ccCount = Math.floor(Math.random() * 300 + 100);
    const ccVolume = ccCount * (Math.random() * 500 + 150);
    const totalCount = achCount + ccCount;
    const totalVolume = achVolume + ccVolume;

    const chargebackCount = Math.floor(Math.random() * 8 + 1);
    const chargebackVolume = chargebackCount * (Math.random() * 300 + 100);
    const chargebackRate = (chargebackCount / ccCount) * 100;
    const approvalRate = Math.random() * 6 + 93;

    const achReturnRate = Math.random() * 1.5 + 0.5;
    const achApprovedCount = Math.round(achCount * (1 - achReturnRate / 100));
    const achApprovedVolume = achVolume * (1 - achReturnRate / 100);
    const ccApprovedCount = Math.round(ccCount * (approvalRate / 100));
    const ccApprovedVolume = ccVolume * (approvalRate / 100);

    const achFeePerTxn = Math.random() * 0.25 + 0.25;
    const ccInterchangeRate = Math.random() * 0.01 + 0.02;
    const achFees = achCount * achFeePerTxn;
    const ccInterchange = ccVolume * ccInterchangeRate;
    const achApprovedFees = achApprovedCount * achFeePerTxn;
    const ccApprovedInterchange = ccApprovedVolume * ccInterchangeRate;

    const achVerificationAttempts = Math.floor(achCount * (Math.random() * 0.1 + 0.05));
    const achVerificationFailed = Math.floor(achVerificationAttempts * (Math.random() * 0.2 + 0.05));

    const autopayRate = Math.random() * 0.15 + 0.55;
    const autopayCount = Math.round(totalCount * autopayRate);
    const autopayVolume = totalVolume * autopayRate;
    const customerInitCount = totalCount - autopayCount;
    const customerInitVolume = totalVolume - autopayVolume;

    const dailyUniqueCustomers = Math.round(totalCount * (Math.random() * 0.2 + 0.45));

    rows.push({
      date: dateStr,
      totalVolume, totalCount,
      achVolume, achCount,
      ccVolume, ccCount,
      achApprovedCount, achApprovedVolume,
      ccApprovedCount, ccApprovedVolume,
      achFees, ccInterchange,
      achApprovedFees, ccApprovedInterchange,
      achVerificationAttempts, achVerificationFailed,
      autopayCount, autopayVolume,
      customerInitCount, customerInitVolume,
      dailyUniqueCustomers,
      chargebackCount, chargebackVolume, chargebackRate, approvalRate,
    });

    cursor.setDate(cursor.getDate() + 1);
  }
  return rows;
};

const today = new Date('2026-04-01');
const ninetyDaysAgo = new Date(today);
ninetyDaysAgo.setDate(today.getDate() - 89);
const FULL_DATASET = generateData(
  ninetyDaysAgo.toISOString().split('T')[0],
  today.toISOString().split('T')[0]
);
const DEPOSITS_IN_TRANSIT = FULL_DATASET.slice(-2).reduce(
  (sum, r) => sum + r.achApprovedVolume + r.ccApprovedVolume,
  0
);

const PAYOUTS_DATA = [
  { id: 'TXN112346789001', status: 'Paid',    statusClass: 'low',     merchant: 'Taproom Capital', family: 'Daily Tacos',  payoutDate: 'Jan 15, 2026', expDate: 'Jan 15, 2026', refDate: 'Jan 15, 2026', netAmount: '$524,810', fees: '$1,500.00' },
  { id: 'TXN112346789002', status: 'Paid',    statusClass: 'low',     merchant: 'Taproom Capital', family: 'Daily Tacos',  payoutDate: 'Jan 15, 2026', expDate: 'Jan 15, 2026', refDate: 'Jan 15, 2026', netAmount: '$248,711', fees: '$1,500.00' },
  { id: 'TXN112346789003', status: 'Refund',  statusClass: 'neutral', merchant: 'Taproom Capital', family: 'Fikki-iyaaa', payoutDate: 'Jan 15, 2026', expDate: 'Jan 15, 2026', refDate: 'Jan 15, 2026', netAmount: '$248,140', fees: '$1,500.00' },
  { id: 'TXN112346789004', status: 'Pending', statusClass: 'mid',     merchant: 'Taproom Capital', family: 'Fikki-iyaaa', payoutDate: 'Jan 15, 2026', expDate: 'Jan 15, 2026', refDate: 'Jan 15, 2026', netAmount: '$248,140', fees: '$1,500.00' },
  { id: 'TXN112346789005', status: 'Pending', statusClass: 'mid',     merchant: 'Taproom Capital', family: 'Fikki-iyaaa', payoutDate: 'Jan 15, 2026', expDate: 'Jan 15, 2026', refDate: 'Jan 15, 2026', netAmount: '$248,140', fees: '$1,500.00' },
];

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
const fmtPct = (n) => `${n.toFixed(2)}%`;
const fmtK = (n) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};
const fmtKNum = (n) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
};
const pctChange = (curr, prev) => (prev > 0 ? ((curr - prev) / prev) * 100 : 0);
const toDateStr = (d) => d.toISOString().split('T')[0];

// ─── Aggregate ────────────────────────────────────────────────────────────────
const ZERO = {
  totalVolume: 0, totalCount: 0,
  achVolume: 0, achCount: 0,
  ccVolume: 0, ccCount: 0,
  achApprovedVolume: 0, achApprovedCount: 0,
  ccApprovedVolume: 0, ccApprovedCount: 0,
  achFees: 0, ccInterchange: 0,
  achApprovedFees: 0, ccApprovedInterchange: 0,
  achVerificationAttempts: 0, achVerificationFailed: 0,
  autopayCount: 0, autopayVolume: 0,
  customerInitCount: 0, customerInitVolume: 0,
  dailyUniqueCustomers: 0,
  chargebackCount: 0, chargebackVolume: 0,
};

const aggregate = (rows) => {
  if (!rows.length)
    return { ...ZERO, approvedVolume: 0, approvedCount: 0, periodUniqueCustomers: 0, chargebackRate: 0, approvalRate: 0 };

  const t = rows.reduce((acc, r) => {
    const out = {};
    Object.keys(ZERO).forEach((k) => { out[k] = acc[k] + r[k]; });
    return out;
  }, { ...ZERO });

  t.approvedVolume = t.achApprovedVolume + t.ccApprovedVolume;
  t.approvedCount = t.achApprovedCount + t.ccApprovedCount;
  t.periodUniqueCustomers = Math.round(t.dailyUniqueCustomers / Math.sqrt(rows.length));
  t.chargebackRate = t.ccCount > 0 ? (t.chargebackCount / t.ccCount) * 100 : 0;
  t.approvalRate = rows.reduce((s, r) => s + r.approvalRate, 0) / rows.length;
  return t;
};

// ─── Preset ranges ────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 6 },
  { label: 'Last 30 Days', days: 29 },
  { label: 'Last 90 Days', days: 89 },
];

// ─── Delta helpers ────────────────────────────────────────────────────────────
function deltaTone(pct, { inverse = false, tiny = 0.1 } = {}) {
  if (pct === undefined || pct === null || Number.isNaN(pct) || Math.abs(pct) < tiny) return '';
  const good = inverse ? pct < 0 : pct > 0;
  if (good) return 'up';
  return inverse ? 'warn' : 'down';
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, tone = '' }) => {
  if (!data || data.length < 2) return null;
  const W = 48, H = 20, pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = pad + (H - 2 * pad) * (1 - (v - min) / range);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const color = tone === 'up' ? '#4f7e20' : tone === 'down' ? '#a32d2d' : '#378add';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ─── MetricDelta ──────────────────────────────────────────────────────────────
const MetricDelta = ({ pct, inverse = false, dayCount }) => {
  if (pct === null || pct === undefined) return <div className="metric-delta" />;
  const tone = deltaTone(pct, { inverse });
  const absPct = Math.abs(pct).toFixed(1);
  const color =
    tone === 'up' ? '#4f7e20' : tone === 'down' ? '#a32d2d' : 'rgba(10,31,51,0.61)';
  return (
    <div className="metric-delta" style={{ color }}>
      {tone === 'up' && <span className="metric-delta-arrow">↑</span>}
      {tone === 'down' && <span className="metric-delta-arrow">↓</span>}
      <span>{absPct}%</span>
      <span className="metric-delta-period">{dayCount} D</span>
    </div>
  );
};

// ─── MetricRow ────────────────────────────────────────────────────────────────
const MetricRow = ({ label, val, valSub, deltaPct, deltaInverse = false, spark, dayCount }) => {
  const tone = deltaTone(deltaPct, { inverse: deltaInverse });
  return (
    <div className="metric-row">
      <div className="metric-label-col">
        <div className="metric-label-name">{label}</div>
        <div className="metric-label-sub">TBD</div>
      </div>
      <div className="metric-value-col">
        <div className="metric-value-primary">{val}</div>
        {valSub && <div className="metric-value-sub">{valSub}</div>}
      </div>
      <MetricDelta pct={deltaPct} inverse={deltaInverse} dayCount={dayCount} />
      <div className="metric-spark-col">
        <Sparkline data={spark} tone={tone} />
      </div>
    </div>
  );
};

// ─── ScoreboardCard ───────────────────────────────────────────────────────────
const ScoreboardCard = ({ label, val, delta, deltaInverse = false, sub, dayCount }) => {
  const tone = deltaTone(delta, { inverse: deltaInverse });
  const sign = tone === 'up' ? '↑' : tone === 'down' ? '↓' : '';
  const deltaColor =
    tone === 'up' ? '#4f7e20' : tone === 'down' ? '#a32d2d' : 'rgba(10,31,51,0.61)';
  const showDelta = delta !== null && delta !== undefined && Math.abs(delta) >= 0.05;
  return (
    <div className="scoreboard-card">
      <div className="scoreboard-card-label">{label}</div>
      <div className="scoreboard-card-value-row">
        <span className="scoreboard-card-value">{val}</span>
        {showDelta && (
          <span className="scoreboard-inline-delta" style={{ color: deltaColor }}>
            {sign}{Math.abs(delta).toFixed(1)} {dayCount} D
          </span>
        )}
      </div>
      {sub && <div className="scoreboard-card-sub">{sub}</div>}
    </div>
  );
};

// ─── ScoreboardRow ────────────────────────────────────────────────────────────
const ScoreboardRow = ({ name, nameSub, cards }) => (
  <div className="scoreboard-row">
    <div className="scoreboard-name">
      <div className="scoreboard-name-primary">{name}</div>
      <div className="scoreboard-name-sub">{nameSub || 'TBD'}</div>
    </div>
    {cards.map((card, i) => (
      <ScoreboardCard key={i} {...card} />
    ))}
  </div>
);

// ─── FilterPill ───────────────────────────────────────────────────────────────
const FilterPill = ({ label, value, onClick }) => (
  <button type="button" className="filter-pill" onClick={onClick}>
    <span className="filter-pill-label">{label}&nbsp;</span>
    <span className="filter-pill-value">{value}</span>
    <span className="filter-pill-chevron">
      <ChevronDown size={14} />
    </span>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
const PaymentsOpsDashboard = () => {
  const todayStr = toDateStr(today);
  const defaultStart = toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('Last 30 Days');
  const [viewMode, setViewMode] = useState('gross');
  const [methodFilter, setMethodFilter] = useState('all');
  const [initFilter, setInitFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');
  const [dateOpen, setDateOpen] = useState(false);
  const dateAnchorRef = useRef(null);

  useEffect(() => {
    if (!dateOpen) return;
    const onDoc = (e) => {
      if (dateAnchorRef.current && !dateAnchorRef.current.contains(e.target)) setDateOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [dateOpen]);

  const filteredRows = useMemo(
    () => FULL_DATASET.filter((r) => r.date >= startDate && r.date <= endDate),
    [startDate, endDate]
  );

  const prevRows = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const days = Math.round((e - s) / 86_400_000) + 1;
    const pe = new Date(s);
    pe.setDate(pe.getDate() - 1);
    const ps = new Date(pe);
    ps.setDate(ps.getDate() - days + 1);
    return FULL_DATASET.filter((r) => r.date >= toDateStr(ps) && r.date <= toDateStr(pe));
  }, [startDate, endDate]);

  const kpis = useMemo(() => aggregate(filteredRows), [filteredRows]);
  const prev = useMemo(() => aggregate(prevRows), [prevRows]);

  const applyPreset = (p) => {
    setActivePreset(p.label);
    const e = new Date(today);
    const s = new Date(today);
    s.setDate(today.getDate() - p.days);
    setEndDate(toDateStr(e));
    setStartDate(toDateStr(s));
    setDateOpen(false);
  };

  const handleCustomDate = (field, value) => {
    setActivePreset(null);
    field === 'start' ? setStartDate(value) : setEndDate(value);
  };

  const dayCount = filteredRows.length;
  const g = viewMode === 'gross';

  const achVol = g ? kpis.achVolume : kpis.achApprovedVolume;
  const achCnt = g ? kpis.achCount : kpis.achApprovedCount;
  const achCost = g ? kpis.achFees : kpis.achApprovedFees;
  const ccVol = g ? kpis.ccVolume : kpis.ccApprovedVolume;
  const ccCnt = g ? kpis.ccCount : kpis.ccApprovedCount;
  const ccCost = g ? kpis.ccInterchange : kpis.ccApprovedInterchange;
  const pAchVol = g ? prev.achVolume : prev.achApprovedVolume;
  const pCcVol = g ? prev.ccVolume : prev.ccApprovedVolume;
  const pAchCnt = g ? prev.achCount : prev.achApprovedCount;
  const pCcCnt = g ? prev.ccCount : prev.ccApprovedCount;
  const pAchCost = g ? prev.achFees : prev.achApprovedFees;
  const pCcCost = g ? prev.ccInterchange : prev.ccApprovedInterchange;
  const totalMethodVol = achVol + ccVol;

  const approvedRatio = kpis.totalVolume > 0 ? kpis.approvedVolume / kpis.totalVolume : 1;
  const apVol = g ? kpis.autopayVolume : kpis.autopayVolume * approvedRatio;
  const apCnt = kpis.autopayCount;
  const ciVol = g ? kpis.customerInitVolume : kpis.customerInitVolume * approvedRatio;
  const ciCnt = kpis.customerInitCount;
  const totalInitVol = apVol + ciVol;
  const prevApprRatio = prev.totalVolume > 0 ? prev.approvedVolume / prev.totalVolume : 1;
  const pApVol = g ? prev.autopayVolume : prev.autopayVolume * prevApprRatio;
  const pCiVol = g ? prev.customerInitVolume : prev.customerInitVolume * prevApprRatio;

  const heroVol = g ? kpis.totalVolume : kpis.approvedVolume;
  const heroCnt = g ? kpis.totalCount : kpis.approvedCount;
  const prevHeroVol = g ? prev.totalVolume : prev.approvedVolume;

  const volDelta = pctChange(heroVol, prevHeroVol);
  const cbDelta = pctChange(kpis.chargebackRate, prev.chargebackRate);
  const aprDelta = pctChange(kpis.approvalRate, prev.approvalRate);

  const avgTxn = heroCnt > 0 ? heroVol / heroCnt : 0;
  const prevAvgTxn = (g ? prev.totalCount : prev.approvedCount) > 0
    ? prevHeroVol / (g ? prev.totalCount : prev.approvedCount)
    : 0;

  const dailyCntSpark = useMemo(() => filteredRows.map(r => g ? r.totalCount : r.achApprovedCount + r.ccApprovedCount), [filteredRows, g]);
  const dailyAvgTxnSpark = useMemo(() => filteredRows.map(r => {
    const cnt = g ? r.totalCount : r.achApprovedCount + r.ccApprovedCount;
    const vol = g ? r.totalVolume : r.achApprovedVolume + r.ccApprovedVolume;
    return cnt > 0 ? vol / cnt : 0;
  }), [filteredRows, g]);
  const dailyCustomersSpark = useMemo(() => filteredRows.map(r => r.dailyUniqueCustomers), [filteredRows]);
  const dailyVolSpark = useMemo(() => filteredRows.map(r => g ? r.totalVolume : r.achApprovedVolume + r.ccApprovedVolume), [filteredRows, g]);
  const dailyCbRateSpark = useMemo(() => filteredRows.map(r => r.chargebackRate), [filteredRows]);
  const dailyAprRateSpark = useMemo(() => filteredRows.map(r => r.approvalRate), [filteredRows]);
  const dailyCbCountSpark = useMemo(() => filteredRows.map(r => r.chargebackCount), [filteredRows]);
  const dailyAchVerifSpark = useMemo(() => filteredRows.map(r => r.achVerificationFailed), [filteredRows]);

  const showACH = methodFilter === 'all' || methodFilter === 'ach';
  const showCard = methodFilter === 'all' || methodFilter === 'card';
  const showMerchant = initFilter === 'all' || initFilter === 'merchant';
  const showCustomer = initFilter === 'all' || initFilter === 'customer';

  const methodLabels = { all: 'All', ach: 'ACH', card: 'Card' };
  const initLabels = { all: 'All', merchant: 'Merchant', customer: 'Customer' };

  const cycleMethod = () => setMethodFilter(m => m === 'all' ? 'ach' : m === 'ach' ? 'card' : 'all');
  const cycleInit = () => setInitFilter(f => f === 'all' ? 'merchant' : f === 'merchant' ? 'customer' : 'all');
  const cycleView = () => setViewMode(v => v === 'gross' ? 'approved' : 'gross');

  const timePeriodLabel = activePreset || (() => {
    const s = new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = new Date(endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  })();

  const tabLabels = {
    summary: 'Summary',
    payouts: 'Payouts',
    reconciliation: 'Reconciliations',
    chargebacks: 'Chargebacks',
  };

  return (
    <div className="bp-pay-dash-root">
      {/* Breadcrumb */}
      <div className="breadcrumb">Home / Payments Dashboard</div>

      {/* Title */}
      <div className="dash-title">Payments Dashboard</div>

      {/* Filter pills */}
      <div style={{ position: 'relative' }} ref={dateAnchorRef}>
        <div className="filter-pills">
          <FilterPill label="Time Period" value={timePeriodLabel} onClick={() => setDateOpen(o => !o)} />
          <FilterPill label="View" value={viewMode === 'gross' ? 'Gross' : 'Approved'} onClick={cycleView} />
          <FilterPill label="Method" value={methodLabels[methodFilter]} onClick={cycleMethod} />
          <FilterPill label="Initiation" value={initLabels[initFilter]} onClick={cycleInit} />
        </div>
        {dateOpen && (
          <div className="date-range-panel" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4, minWidth: 300 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                className={`date-preset-btn ${activePreset === p.label ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
            <input
              type="date"
              className="date-input"
              value={startDate}
              min={toDateStr(ninetyDaysAgo)}
              max={endDate}
              onChange={e => handleCustomDate('start', e.target.value)}
            />
            <span style={{ color: 'rgba(10,31,51,0.61)', fontSize: 11 }}>—</span>
            <input
              type="date"
              className="date-input"
              value={endDate}
              min={startDate}
              max={todayStr}
              onChange={e => handleCustomDate('end', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="tab-row">
        {Object.entries(tabLabels).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
        {activeTab === 'payouts' && <span className="tab-meta">{PAYOUTS_DATA.length} rows</span>}
      </div>

      {/* ── Summary tab ─────────────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <div className="content-columns">

          {/* Left column: Volume Overview + Payment Methods */}
          <div className="content-col">
            <div className="section-header">Volume Overview</div>

            <MetricRow
              label="Transaction Count"
              val={fmtKNum(heroCnt)}
              valSub="Transactions"
              deltaPct={volDelta}
              spark={dailyCntSpark}
              dayCount={dayCount}
            />
            <MetricRow
              label="Average Transactions"
              val={fmtK(avgTxn)}
              valSub="Per transaction"
              deltaPct={pctChange(avgTxn, prevAvgTxn)}
              spark={dailyAvgTxnSpark}
              dayCount={dayCount}
            />
            <MetricRow
              label="Customer Count"
              val={fmtKNum(kpis.periodUniqueCustomers)}
              valSub="Unique in selected period"
              deltaPct={pctChange(kpis.periodUniqueCustomers, prev.periodUniqueCustomers)}
              spark={dailyCustomersSpark}
              dayCount={dayCount}
            />
            <MetricRow
              label="Transactions in Progress"
              val={fmtK(DEPOSITS_IN_TRANSIT)}
              valSub="Pending settlement"
              deltaPct={pctChange(heroVol, prevHeroVol)}
              deltaInverse
              spark={dailyVolSpark}
              dayCount={dayCount}
            />

            <div className="section-header">Payment Methods</div>

            {showACH && (
              <ScoreboardRow
                name="ACH"
                cards={[
                  {
                    label: 'Volume',
                    val: fmtK(achVol),
                    delta: pctChange(achVol, pAchVol),
                    sub: `${fmtPct(totalMethodVol > 0 ? (achVol / totalMethodVol) * 100 : 0)} of total`,
                    dayCount,
                  },
                  {
                    label: 'Count',
                    val: fmtKNum(achCnt),
                    delta: pctChange(achCnt, pAchCnt),
                    sub: `${fmtK(achCnt > 0 ? achVol / achCnt : 0)} Average`,
                    dayCount,
                  },
                  {
                    label: 'Fees',
                    val: fmtK(achCost),
                    delta: pctChange(achCost, pAchCost),
                    sub: `${fmt(achCnt > 0 ? achCost / achCnt : 0)}/Transaction average`,
                    dayCount,
                  },
                ]}
              />
            )}
            {showCard && (
              <ScoreboardRow
                name="Card"
                cards={[
                  {
                    label: 'Volume',
                    val: fmtK(ccVol),
                    delta: pctChange(ccVol, pCcVol),
                    sub: `${fmtPct(totalMethodVol > 0 ? (ccVol / totalMethodVol) * 100 : 0)} of total`,
                    dayCount,
                  },
                  {
                    label: 'Count',
                    val: fmtKNum(ccCnt),
                    delta: pctChange(ccCnt, pCcCnt),
                    sub: `${fmtK(ccCnt > 0 ? ccVol / ccCnt : 0)} Average`,
                    dayCount,
                  },
                  {
                    label: 'Interchange',
                    val: fmtK(ccCost),
                    delta: pctChange(ccCost, pCcCost),
                    sub: `${fmtPct(ccVol > 0 ? (ccCost / ccVol) * 100 : 0)} Rate`,
                    dayCount,
                  },
                ]}
              />
            )}
          </div>

          <div className="col-divider" />

          {/* Right column: Risk + Performance + Initiation Type */}
          <div className="content-col">
            <div className="section-header">Risk and Performance</div>

            <MetricRow
              label="Chargeback Rate"
              val={fmtPct(kpis.chargebackRate)}
              valSub={`${fmtKNum(kpis.chargebackCount)} Chargebacks`}
              deltaPct={cbDelta}
              deltaInverse
              spark={dailyCbRateSpark}
              dayCount={dayCount}
            />
            <MetricRow
              label="Card Approval Rate"
              val={fmtPct(kpis.approvalRate)}
              valSub={`${fmtKNum(Math.round(kpis.ccCount * kpis.approvalRate / 100))} Approved transactions`}
              deltaPct={aprDelta}
              spark={dailyAprRateSpark}
              dayCount={dayCount}
            />
            <MetricRow
              label="Chargeback Count"
              val={fmtKNum(kpis.chargebackCount)}
              valSub={`${fmtPct(kpis.chargebackRate)} Rate`}
              deltaPct={pctChange(kpis.chargebackCount, prev.chargebackCount)}
              deltaInverse
              spark={dailyCbCountSpark}
              dayCount={dayCount}
            />
            <MetricRow
              label="ACH Failures"
              val={fmtKNum(kpis.achVerificationFailed)}
              valSub="Pending settlement"
              deltaPct={pctChange(kpis.achVerificationFailed, prev.achVerificationFailed)}
              deltaInverse
              spark={dailyAchVerifSpark}
              dayCount={dayCount}
            />

            <div className="section-header">Initiation Type</div>

            {showMerchant && (
              <ScoreboardRow
                name="Merchant"
                nameSub="Autopay"
                cards={[
                  {
                    label: 'Volume',
                    val: fmtK(apVol),
                    delta: pctChange(apVol, pApVol),
                    sub: `${fmtPct(totalInitVol > 0 ? (apVol / totalInitVol) * 100 : 0)} of total`,
                    dayCount,
                  },
                  {
                    label: 'Count',
                    val: fmtKNum(apCnt),
                    delta: pctChange(apCnt, prev.autopayCount),
                    sub: 'Transactions',
                    dayCount,
                  },
                  {
                    label: 'Avg. Transactions',
                    val: fmtK(apCnt > 0 ? apVol / apCnt : 0),
                    delta: null,
                    sub: 'Per transaction',
                    dayCount,
                  },
                ]}
              />
            )}
            {showCustomer && (
              <ScoreboardRow
                name="Customer"
                cards={[
                  {
                    label: 'Volume',
                    val: fmtK(ciVol),
                    delta: pctChange(ciVol, pCiVol),
                    sub: `${fmtPct(totalInitVol > 0 ? (ciVol / totalInitVol) * 100 : 0)} of total`,
                    dayCount,
                  },
                  {
                    label: 'Count',
                    val: fmtKNum(ciCnt),
                    delta: pctChange(ciCnt, prev.customerInitCount),
                    sub: 'Transactions',
                    dayCount,
                  },
                  {
                    label: 'Avg. Transactions',
                    val: fmtK(ciCnt > 0 ? ciVol / ciCnt : 0),
                    delta: null,
                    sub: 'Per transaction',
                    dayCount,
                  },
                ]}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Payouts tab ──────────────────────────────────────────────── */}
      {activeTab === 'payouts' && (
        <div className="txn-table-wrap">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Status</th>
                <th>Merchant</th>
                <th>Fmly Toac</th>
                <th>Payout Date</th>
                <th>Expiring Date</th>
                <th>Referral Date</th>
                <th style={{ textAlign: 'right' }}>Net Amount</th>
                <th style={{ textAlign: 'right' }}>Fees</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUTS_DATA.map(row => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.id}</td>
                  <td><span className={`cb-pill ${row.statusClass}`}>{row.status}</span></td>
                  <td>{row.merchant}</td>
                  <td>{row.family}</td>
                  <td>{row.payoutDate}</td>
                  <td>{row.expDate}</td>
                  <td>{row.refDate}</td>
                  <td style={{ textAlign: 'right' }}>{row.netAmount}</td>
                  <td style={{ textAlign: 'right' }}>{row.fees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Other tabs ───────────────────────────────────────────────── */}
      {activeTab !== 'summary' && activeTab !== 'payouts' && (
        <div className="table-placeholder">
          {tabLabels[activeTab]} data will appear here based on active filters
        </div>
      )}
    </div>
  );
};

export default PaymentsOpsDashboard;
