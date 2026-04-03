import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const W = 80, H = 20, pad = 2;
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
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0, width: '100%' }}>
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

// ─── SparklineLarge (used inside the popover) ─────────────────────────────────
const SparklineLarge = ({ data, tone }) => {
  if (!data || data.length < 2) return null;
  const W = 256, H = 72, padX = 4, padY = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (W - 2 * padX);
    const y = padY + (H - 2 * padY) * (1 - (v - min) / range);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const linePts = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const areaPts = [
    `${pts[0][0]},${H}`,
    ...pts.map(([x, y]) => `${x},${y}`),
    `${pts[pts.length - 1][0]},${H}`,
  ].join(' ');
  const color = tone === 'up' ? '#4f7e20' : tone === 'down' ? '#a32d2d' : '#378add';
  const fill  = tone === 'up' ? 'rgba(79,126,32,0.1)' : tone === 'down' ? 'rgba(163,45,45,0.1)' : 'rgba(55,138,221,0.1)';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polygon points={areaPts} fill={fill} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ─── TrendPopover ─────────────────────────────────────────────────────────────
const TrendPopover = ({ label, valSub, deltaPct, deltaInverse, spark, dayCount, tone, statFmt, anchorRect }) => {
  if (!anchorRect || !spark || spark.length < 2) return null;

  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const avg = spark.reduce((s, v) => s + v, 0) / spark.length;
  const trend = spark[spark.length - 1] - spark[0];

  const popW = 292;
  const popH = 172;
  const vp = { w: window.innerWidth, h: window.innerHeight };
  let left = anchorRect.left + anchorRect.width / 2 - popW / 2;
  let top  = anchorRect.top - popH - 10;
  if (left + popW > vp.w - 8) left = vp.w - popW - 8;
  if (left < 8) left = 8;
  if (top < 8) top = anchorRect.bottom + 10;

  const color = tone === 'up' ? '#4f7e20' : tone === 'down' ? '#a32d2d' : '#378add';
  const sign  = tone === 'up' ? '↑' : tone === 'down' ? '↓' : '';
  const absPct = deltaPct !== null && deltaPct !== undefined ? Math.abs(deltaPct).toFixed(1) : null;
  const trendTone = trend > 0 ? 'up' : trend < 0 ? 'down' : '';
  const trendColor = trendTone === 'up' ? '#4f7e20' : trendTone === 'down' ? '#a32d2d' : 'rgba(10,31,51,0.61)';

  return createPortal(
    <div className="trend-popover" style={{ position: 'fixed', left, top, width: popW, zIndex: 9999 }}>
      <div className="trend-popover-header">
        <span className="trend-popover-label">{label}</span>
        {absPct !== null && (
          <span className="trend-popover-delta" style={{ color }}>
            {sign}{absPct}%&nbsp;<span className="trend-popover-period">{dayCount}D</span>
          </span>
        )}
      </div>
      {valSub && <div className="trend-popover-sub">{valSub}</div>}
      <div className="trend-popover-chart">
        <SparklineLarge data={spark} tone={tone} />
      </div>
      <div className="trend-popover-stats">
        {[
          { label: 'Min',   val: statFmt(min) },
          { label: 'Max',   val: statFmt(max) },
          { label: 'Avg',   val: statFmt(avg) },
          { label: 'Trend', val: <span style={{ color: trendColor }}>{trendTone === 'up' ? '↑' : trendTone === 'down' ? '↓' : '—'} {statFmt(Math.abs(trend))}</span> },
        ].map(({ label: l, val: v }) => (
          <div key={l} className="trend-stat">
            <div className="trend-stat-label">{l}</div>
            <div className="trend-stat-val">{v}</div>
          </div>
        ))}
      </div>
    </div>,
    document.body
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
const MetricRow = ({ label, labelSub, val, valSub, deltaPct, deltaInverse = false, spark, dayCount, statFmt = fmtKNum }) => {
  const [anchorRect, setAnchorRect] = useState(null);
  const sparkRef = useRef(null);
  const tone = deltaTone(deltaPct, { inverse: deltaInverse });

  const handleMouseEnter = () => {
    if (sparkRef.current) setAnchorRect(sparkRef.current.getBoundingClientRect());
  };
  const handleMouseLeave = () => setAnchorRect(null);

  return (
    <div className="metric-row">
      <div className="metric-label-col">
        <div className="metric-label-name">{label}</div>
        {labelSub && <div className="metric-label-sub">{labelSub}</div>}
      </div>
      <div className="metric-value-col">
        <div className="metric-value-primary">{val}</div>
      </div>
      <MetricDelta pct={deltaPct} inverse={deltaInverse} dayCount={dayCount} />
      <div
        className="metric-spark-col metric-spark-hoverable"
        ref={sparkRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Sparkline data={spark} tone={tone} />
        <TrendPopover
          label={label}
          valSub={valSub}
          deltaPct={deltaPct}
          deltaInverse={deltaInverse}
          spark={spark}
          dayCount={dayCount}
          tone={tone}
          statFmt={statFmt}
          anchorRect={anchorRect}
        />
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
  const [openPill, setOpenPill] = useState(null); // 'date' | 'view' | 'method' | 'init'
  const filterRailRef = useRef(null);

  useEffect(() => {
    if (!openPill) return;
    const onDoc = (e) => {
      if (filterRailRef.current && !filterRailRef.current.contains(e.target)) setOpenPill(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openPill]);

  const togglePill = (name) => setOpenPill(p => p === name ? null : name);
  const dateOpen = openPill === 'date';

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

  const viewOptions   = [{ value: 'gross',    label: 'Gross'    }, { value: 'approved', label: 'Approved' }];
  const methodOptions = [{ value: 'all',      label: 'All'      }, { value: 'ach',      label: 'ACH'      }, { value: 'card',     label: 'Card'     }];
  const initOptions   = [{ value: 'all',      label: 'All'      }, { value: 'merchant', label: 'Merchant' }, { value: 'customer', label: 'Customer' }];
  const methodLabels  = Object.fromEntries(methodOptions.map(o => [o.value, o.label]));
  const initLabels    = Object.fromEntries(initOptions.map(o => [o.value, o.label]));

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
      <div className="filter-pills" ref={filterRailRef}>

        {/* Time Period */}
        <div style={{ position: 'relative' }}>
          <FilterPill label="Time Period" value={timePeriodLabel} onClick={() => togglePill('date')} />
          {dateOpen && (
            <div className="date-range-panel" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4, minWidth: 300 }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  className={`date-preset-btn ${activePreset === p.label ? 'active' : ''}`}
                  onClick={() => { applyPreset(p); setOpenPill(null); }}
                >
                  {p.label}
                </button>
              ))}
              <input type="date" className="date-input" value={startDate} min={toDateStr(ninetyDaysAgo)} max={endDate} onChange={e => handleCustomDate('start', e.target.value)} />
              <span style={{ color: 'rgba(10,31,51,0.61)', fontSize: 11 }}>—</span>
              <input type="date" className="date-input" value={endDate} min={startDate} max={todayStr} onChange={e => handleCustomDate('end', e.target.value)} />
            </div>
          )}
        </div>

        {/* View */}
        <div style={{ position: 'relative' }}>
          <FilterPill label="View" value={viewMode === 'gross' ? 'Gross' : 'Approved'} onClick={() => togglePill('view')} />
          {openPill === 'view' && (
            <div className="pill-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4 }}>
              {viewOptions.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`pill-option${viewMode === o.value ? ' active' : ''}`}
                  onClick={() => { setViewMode(o.value); setOpenPill(null); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Method */}
        <div style={{ position: 'relative' }}>
          <FilterPill label="Method" value={methodLabels[methodFilter]} onClick={() => togglePill('method')} />
          {openPill === 'method' && (
            <div className="pill-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4 }}>
              {methodOptions.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`pill-option${methodFilter === o.value ? ' active' : ''}`}
                  onClick={() => { setMethodFilter(o.value); setOpenPill(null); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Initiation */}
        <div style={{ position: 'relative' }}>
          <FilterPill label="Initiation" value={initLabels[initFilter]} onClick={() => togglePill('init')} />
          {openPill === 'init' && (
            <div className="pill-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4 }}>
              {initOptions.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`pill-option${initFilter === o.value ? ' active' : ''}`}
                  onClick={() => { setInitFilter(o.value); setOpenPill(null); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

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
              labelSub="All Transactions"
              val={fmtNum(heroCnt)}
              valSub="Transactions"
              deltaPct={volDelta}
              spark={dailyCntSpark}
              dayCount={dayCount}
              statFmt={fmtNum}
            />
            <MetricRow
              label="Average Transactions"
              labelSub="Average Payment Amount"
              val={fmt(avgTxn)}
              valSub="Per transaction"
              deltaPct={pctChange(avgTxn, prevAvgTxn)}
              spark={dailyAvgTxnSpark}
              dayCount={dayCount}
              statFmt={fmt}
            />
            <MetricRow
              label="Customer Count"
              labelSub="Distinct Customers"
              val={fmtNum(kpis.periodUniqueCustomers)}
              valSub="Unique in selected period"
              deltaPct={pctChange(kpis.periodUniqueCustomers, prev.periodUniqueCustomers)}
              spark={dailyCustomersSpark}
              dayCount={dayCount}
              statFmt={fmtNum}
            />
            <MetricRow
              label="Deposits in Transit"
              labelSub="Pending Settlement Amount"
              val={fmt(DEPOSITS_IN_TRANSIT)}
              valSub="Pending settlement"
              deltaPct={pctChange(heroVol, prevHeroVol)}
              deltaInverse
              spark={dailyVolSpark}
              dayCount={dayCount}
              statFmt={fmt}
            />

            <div className="section-header">Payment Methods</div>

            {showACH && (
              <ScoreboardRow
                name="ACH"
                nameSub="Direct Debit"
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
                nameSub="Visa, MC, Disc, AMEX"
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
              statFmt={fmtPct}
            />
            <MetricRow
              label="Card Approval Rate"
              val={fmtPct(kpis.approvalRate)}
              valSub={`${fmtKNum(Math.round(kpis.ccCount * kpis.approvalRate / 100))} Approved transactions`}
              deltaPct={aprDelta}
              spark={dailyAprRateSpark}
              dayCount={dayCount}
              statFmt={fmtPct}
            />
            <MetricRow
              label="Chargeback Count"
              val={fmtNum(kpis.chargebackCount)}
              valSub={`${fmtPct(kpis.chargebackRate)} Rate`}
              deltaPct={pctChange(kpis.chargebackCount, prev.chargebackCount)}
              deltaInverse
              spark={dailyCbCountSpark}
              dayCount={dayCount}
              statFmt={fmtNum}
            />
            <MetricRow
              label="ACH Failures"
              val={fmtNum(kpis.achVerificationFailed)}
              valSub="Pending settlement"
              deltaPct={pctChange(kpis.achVerificationFailed, prev.achVerificationFailed)}
              deltaInverse
              spark={dailyAchVerifSpark}
              dayCount={dayCount}
              statFmt={fmtNum}
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
