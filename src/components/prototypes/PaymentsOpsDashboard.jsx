import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
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
      totalVolume,
      totalCount,
      achVolume,
      achCount,
      ccVolume,
      ccCount,
      achApprovedCount,
      achApprovedVolume,
      ccApprovedCount,
      ccApprovedVolume,
      achFees,
      ccInterchange,
      achApprovedFees,
      ccApprovedInterchange,
      achVerificationAttempts,
      achVerificationFailed,
      autopayCount,
      autopayVolume,
      customerInitCount,
      customerInitVolume,
      dailyUniqueCustomers,
      chargebackCount,
      chargebackVolume,
      chargebackRate,
      approvalRate,
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
const fmtDelta = (pct) => `${pct >= 0 ? '+' : ''}${Math.abs(pct).toFixed(1)}%`;
const fmtDeltaAbs = (curr, prev) => {
  const d = curr - prev;
  if (Math.abs(d) < 0.01) return null;
  const sign = d >= 0 ? '+' : '−';
  return `${sign}${fmtNum(Math.abs(d))}`;
};
const toDateStr = (d) => d.toISOString().split('T')[0];

// ─── Aggregate ────────────────────────────────────────────────────────────────
const ZERO = {
  totalVolume: 0,
  totalCount: 0,
  achVolume: 0,
  achCount: 0,
  ccVolume: 0,
  ccCount: 0,
  achApprovedVolume: 0,
  achApprovedCount: 0,
  ccApprovedVolume: 0,
  ccApprovedCount: 0,
  achFees: 0,
  ccInterchange: 0,
  achApprovedFees: 0,
  ccApprovedInterchange: 0,
  achVerificationAttempts: 0,
  achVerificationFailed: 0,
  autopayCount: 0,
  autopayVolume: 0,
  customerInitCount: 0,
  customerInitVolume: 0,
  dailyUniqueCustomers: 0,
  chargebackCount: 0,
  chargebackVolume: 0,
};

const aggregate = (rows) => {
  if (!rows.length)
    return {
      ...ZERO,
      approvedVolume: 0,
      approvedCount: 0,
      periodUniqueCustomers: 0,
      chargebackRate: 0,
      approvalRate: 0,
    };

  const t = rows.reduce((acc, r) => {
    const out = {};
    Object.keys(ZERO).forEach((k) => {
      out[k] = acc[k] + r[k];
    });
    return out;
  }, { ...ZERO });

  t.approvedVolume = t.achApprovedVolume + t.ccApprovedVolume;
  t.approvedCount = t.achApprovedCount + t.ccApprovedCount;
  // Mock: approximate distinct payers in range (production: COUNT DISTINCT customer_id).
  t.periodUniqueCustomers = Math.round(t.dailyUniqueCustomers / Math.sqrt(rows.length));
  t.chargebackRate = t.ccCount > 0 ? (t.chargebackCount / t.ccCount) * 100 : 0;
  t.approvalRate = rows.reduce((s, r) => s + r.approvalRate, 0) / rows.length;
  return t;
};

// ─── Preset ranges ────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7d', days: 6 },
  { label: 'Last 30d', days: 29 },
  { label: 'Last 90d', days: 89 },
];

/** @returns {'up'|'warn'|'down'|''} */
function deltaTone(pct, { inverse = false, tiny = 0.1 } = {}) {
  if (pct === undefined || pct === null || Number.isNaN(pct) || Math.abs(pct) < tiny) return '';
  const good = inverse ? pct < 0 : pct > 0;
  const bad = inverse ? pct > 0 : pct < 0;
  if (good) return 'up';
  if (bad) return inverse ? 'warn' : 'down';
  return '';
}

/** For count / absolute deltas where `inverse` means lower is better */
function absDeltaTone(delta, inverse) {
  if (delta === undefined || delta === null || delta === 0) return '';
  if (inverse) return delta > 0 ? 'warn' : 'up';
  return delta > 0 ? 'up' : 'down';
}

const BandDelta = ({ pct, inverse = false }) => {
  const tone = deltaTone(pct, { inverse });
  if (!tone) return null;
  return <span className={`band-delta ${tone}`}>{fmtDelta(pct)} vs prior</span>;
};

const CellDelta = ({ pct, inverse = false }) => {
  const tone = deltaTone(pct, { inverse });
  if (!tone) return null;
  return <span className={`cell-delta ${tone}`}>{fmtDelta(pct)}</span>;
};

const Band = ({ label, heroVal, heroSub, deltaPct, deltaInverse = false, children, pair }) => (
  <div className={`band${pair ? ' band--pair' : ''}`}>
    <div className="band-header">
      <div className="band-label">{label}</div>
      <div className="band-hero">
        {heroVal ? (
          <>
            <div className="band-hero-val">{heroVal}</div>
            {heroSub ? <div className="band-hero-sub">{heroSub}</div> : null}
          </>
        ) : null}
      </div>
      <div>{deltaPct !== undefined && deltaPct !== null ? <BandDelta pct={deltaPct} inverse={deltaInverse} /> : null}</div>
    </div>
    <div className="band-body">{children}</div>
  </div>
);

const BandCell = ({ label, val, sub, deltaPct, deltaInverse }) => (
  <div className="band-cell">
    <div className="cell-label">{label}</div>
    <div className="cell-val">
      {val}
      {deltaPct !== undefined && deltaPct !== null ? <CellDelta pct={deltaPct} inverse={deltaInverse} /> : null}
    </div>
    {sub ? <div className="cell-sub">{sub}</div> : null}
  </div>
);

const BandRow = ({ label, labelClass = '', cells }) => (
  <div className="band-row">
    <div className={`band-row-label ${labelClass}`.trim()}>{label}</div>
    <div className="band-row-cells" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((c, i) => (
        <BandCell key={i} {...c} />
      ))}
    </div>
  </div>
);

const RiskRow = ({ pairs }) => (
  <div className="risk-body">
    {pairs.map((p, i) => (
      <React.Fragment key={i}>
        <div className="risk-label">{p.label}</div>
        <div className="risk-val-block">
          <div className="risk-val">
            {p.val}
            {p.deltaPct !== undefined && p.deltaPct !== null ? (
              <CellDelta pct={p.deltaPct} inverse={p.deltaInverse} />
            ) : p.deltaAbs != null && p.deltaAbs !== '' ? (
              <span className={`cell-delta ${absDeltaTone(p.deltaAbsRaw, p.deltaInverse)}`}>{p.deltaAbs}</span>
            ) : null}
          </div>
          {p.sub ? <div className="risk-sub">{p.sub}</div> : null}
        </div>
      </React.Fragment>
    ))}
  </div>
);

const FilterGroup = ({ label, options, value, onChange, color }) => (
  <div className="filter-group">
    <label>{label}</label>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`filter-btn ${value === opt.value ? `active ${color}` : ''}`.trim()}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ─── Sort helper ──────────────────────────────────────────────────────────────
const useSortedRows = (rows) => {
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
        return sort.dir === 'asc' ? cmp : -cmp;
      }),
    [rows, sort.key, sort.dir]
  );
  const toggle = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  return { sorted, sort, toggle };
};

// ─── Main component ───────────────────────────────────────────────────────────
const PaymentsOpsDashboard = () => {
  const todayStr = toDateStr(today);
  const defaultStart = toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('Last 30d');
  const [viewMode, setViewMode] = useState('gross');
  const [methodFilter, setMethodFilter] = useState('all');
  const [initFilter, setInitFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('transactions');
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

  const { sorted, sort, toggle } = useSortedRows(filteredRows);

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
  const totalMethodVol = achVol + ccVol;
  const verifFailRate =
    kpis.achVerificationAttempts > 0 ? (kpis.achVerificationFailed / kpis.achVerificationAttempts) * 100 : 0;

  const approvedRatio = kpis.totalVolume > 0 ? kpis.approvedVolume / kpis.totalVolume : 1;
  const apVol = g ? kpis.autopayVolume : kpis.autopayVolume * approvedRatio;
  const apCnt = kpis.autopayCount;
  const ciVol = g ? kpis.customerInitVolume : kpis.customerInitVolume * approvedRatio;
  const ciCnt = kpis.customerInitCount;
  const totalInitVol = apVol + ciVol;

  const hero = useMemo(() => {
    if (methodFilter === 'ach') return { vol: achVol, cnt: achCnt, prevVol: pAchVol };
    if (methodFilter === 'card') return { vol: ccVol, cnt: ccCnt, prevVol: pCcVol };
    if (initFilter === 'merchant')
      return {
        vol: apVol,
        cnt: apCnt,
        prevVol: prev.autopayVolume * (g ? 1 : prev.approvedVolume / (prev.totalVolume || 1)),
      };
    if (initFilter === 'customer')
      return {
        vol: ciVol,
        cnt: ciCnt,
        prevVol: prev.customerInitVolume * (g ? 1 : prev.approvedVolume / (prev.totalVolume || 1)),
      };
    const pVol = g ? prev.totalVolume : prev.approvedVolume;
    const vol = g ? kpis.totalVolume : kpis.approvedVolume;
    const cnt = g ? kpis.totalCount : kpis.approvedCount;
    return { vol, cnt, prevVol: pVol };
  }, [
    methodFilter,
    initFilter,
    kpis,
    prev,
    achVol,
    achCnt,
    ccVol,
    ccCnt,
    apVol,
    apCnt,
    ciVol,
    ciCnt,
    g,
    pAchVol,
    pCcVol,
  ]);

  const showACH = methodFilter === 'all' || methodFilter === 'ach';
  const showCard = methodFilter === 'all' || methodFilter === 'card';
  const showMerchant = initFilter === 'all' || initFilter === 'merchant';
  const showCustomer = initFilter === 'all' || initFilter === 'customer';

  const volDelta = pctChange(hero.vol, hero.prevVol);
  const cbDelta = pctChange(kpis.chargebackRate, prev.chargebackRate);
  const aprDelta = pctChange(kpis.approvalRate, prev.approvalRate);
  const cbCountDeltaRaw = kpis.chargebackCount - prev.chargebackCount;
  const verifDeltaRaw = kpis.achVerificationFailed - prev.achVerificationFailed;

  const dateRangeLabel =
    activePreset ||
    `${new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const viewLabel = viewMode === 'gross' ? 'gross' : 'approved';

  const tabLabels = {
    transactions: 'Transactions',
    settlements: 'Settlements',
    chargebacks: 'Chargebacks',
    fees: 'Fees',
  };

  const ColHeader = ({ col, label }) => (
    <th onClick={() => toggle(col)}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <ArrowUpDown size={11} style={{ opacity: sort.key === col ? 1 : 0.35 }} />
      </span>
    </th>
  );

  const cbPillClass = (rate) => {
    if (rate > 1) return 'cb-pill high';
    if (rate > 0.5) return 'cb-pill mid';
    return 'cb-pill low';
  };

  return (
    <div className="bp-pay-dash-root">
      <div className="dash">
        <div className="dash-header">
          <div>
            <div className="dash-title">BP Pay dashboard</div>
            <div className="dash-subtitle">Payment volume, method mix, and risk performance</div>
          </div>
          <div ref={dateAnchorRef} style={{ position: 'relative', textAlign: 'right' }}>
            <button type="button" className="date-range" onClick={() => setDateOpen((o) => !o)}>
              {dateRangeLabel}
            </button>
            {dateOpen ? (
              <div className="date-range-panel" style={{ position: 'absolute', right: 0, zIndex: 20, minWidth: 280 }}>
                {PRESETS.map((p) => (
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
                  onChange={(e) => handleCustomDate('start', e.target.value)}
                />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>—</span>
                <input
                  type="date"
                  className="date-input"
                  value={endDate}
                  min={startDate}
                  max={todayStr}
                  onChange={(e) => handleCustomDate('end', e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="filter-rail">
          <FilterGroup
            label="View"
            color="blue"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'gross', label: 'Gross' },
              { value: 'approved', label: 'Approved' },
            ]}
          />
          <div className="filter-divider" />
          <FilterGroup
            label="Method"
            color="teal"
            value={methodFilter}
            onChange={setMethodFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'ach', label: 'ACH' },
              { value: 'card', label: 'Card' },
            ]}
          />
          <div className="filter-divider" />
          <FilterGroup
            label="Initiation"
            color="purple"
            value={initFilter}
            onChange={setInitFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'merchant', label: 'Merchant' },
              { value: 'customer', label: 'Customer' },
            ]}
          />
        </div>

        <div className="dash-band-pair">
          <Band
            pair
            label="Volume overview"
            heroVal={fmtK(hero.vol)}
            heroSub={`${viewLabel} · ${dayCount}d`}
            deltaPct={volDelta}
          >
            <RiskRow
              pairs={[
                { label: 'Count', val: fmtKNum(hero.cnt), sub: 'transactions' },
                {
                  label: 'Avg txn',
                  val: fmtK(hero.cnt > 0 ? hero.vol / hero.cnt : 0),
                  sub: 'per transaction',
                },
              ]}
            />
            <RiskRow
              pairs={[
                {
                  label: 'Customers',
                  val: fmtKNum(kpis.periodUniqueCustomers),
                  sub: 'unique in selected period',
                },
                { label: 'In transit', val: fmtK(DEPOSITS_IN_TRANSIT), sub: 'pending settlement' },
              ]}
            />
          </Band>

          <Band
            pair
            label="Risk + performance"
            heroVal={fmtPct(kpis.chargebackRate)}
            heroSub="chargeback rate"
            deltaPct={cbDelta}
            deltaInverse
          >
            <RiskRow
              pairs={[
                {
                  label: 'Chargeback rate',
                  val: fmtPct(kpis.chargebackRate),
                  sub: `${fmtKNum(kpis.chargebackCount)} CBs · ${fmtK(kpis.chargebackVolume)}`,
                  deltaPct: cbDelta,
                  deltaInverse: true,
                },
                {
                  label: 'Card approval rate',
                  val: fmtPct(kpis.approvalRate),
                  sub: `${fmtKNum(Math.round(kpis.ccCount * kpis.approvalRate / 100))} approved txns`,
                  deltaPct: aprDelta,
                },
              ]}
            />
            <RiskRow
              pairs={[
                {
                  label: 'Chargeback count',
                  val: fmtKNum(kpis.chargebackCount),
                  sub: `vs ${fmtNum(prev.chargebackCount)} prior period`,
                  deltaAbs: fmtDeltaAbs(kpis.chargebackCount, prev.chargebackCount),
                  deltaAbsRaw: cbCountDeltaRaw,
                  deltaInverse: true,
                },
                {
                  label: 'ACH verif. failures',
                  val: fmtKNum(kpis.achVerificationFailed),
                  sub: `${fmtPct(verifFailRate)} fail rate`,
                  deltaAbs: fmtDeltaAbs(kpis.achVerificationFailed, prev.achVerificationFailed),
                  deltaAbsRaw: verifDeltaRaw,
                  deltaInverse: true,
                },
              ]}
            />
          </Band>
        </div>

        <div className="dash-band-pair">
          <Band pair label="Payment methods">
            {showACH && (
              <BandRow
                label="ACH"
                labelClass="teal"
                cells={[
                  {
                    label: 'Volume',
                    val: fmtK(achVol),
                    sub: `${fmtPct(totalMethodVol > 0 ? (achVol / totalMethodVol) * 100 : 0)} of total`,
                    deltaPct: pctChange(achVol, pAchVol),
                  },
                  { label: 'Count', val: fmtKNum(achCnt), sub: `${fmtK(achCnt > 0 ? achVol / achCnt : 0)} avg` },
                  { label: 'Fees', val: fmtK(achCost), sub: `${fmt(achCnt > 0 ? achCost / achCnt : 0)}/txn avg` },
                ]}
              />
            )}
            {showCard && (
              <BandRow
                label="Card"
                labelClass="purple"
                cells={[
                  {
                    label: 'Volume',
                    val: fmtK(ccVol),
                    sub: `${fmtPct(totalMethodVol > 0 ? (ccVol / totalMethodVol) * 100 : 0)} of total`,
                    deltaPct: pctChange(ccVol, pCcVol),
                  },
                  { label: 'Count', val: fmtKNum(ccCnt), sub: `${fmtK(ccCnt > 0 ? ccVol / ccCnt : 0)} avg` },
                  {
                    label: 'Interchange',
                    val: fmtK(ccCost),
                    sub: `${fmtPct(ccVol > 0 ? (ccCost / ccVol) * 100 : 0)} rate`,
                  },
                ]}
              />
            )}
          </Band>

          <Band pair label={'Initiation\ntype'}>
            {showMerchant && (
              <BandRow
                label="Merchant (autopay)"
                cells={[
                  {
                    label: 'Volume',
                    val: fmtK(apVol),
                    sub: `${fmtPct(totalInitVol > 0 ? (apVol / totalInitVol) * 100 : 0)} of total`,
                  },
                  { label: 'Count', val: fmtKNum(apCnt), sub: 'transactions' },
                  { label: 'Avg txn', val: fmtK(apCnt > 0 ? apVol / apCnt : 0), sub: 'per transaction' },
                ]}
              />
            )}
            {showCustomer && (
              <BandRow
                label="Customer"
                cells={[
                  {
                    label: 'Volume',
                    val: fmtK(ciVol),
                    sub: `${fmtPct(totalInitVol > 0 ? (ciVol / totalInitVol) * 100 : 0)} of total`,
                  },
                  { label: 'Count', val: fmtKNum(ciCnt), sub: 'transactions' },
                  { label: 'Avg txn', val: fmtK(ciCnt > 0 ? ciVol / ciCnt : 0), sub: 'per transaction' },
                ]}
              />
            )}
          </Band>
        </div>

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
          {activeTab === 'transactions' ? <span className="tab-meta">{sorted.length} rows</span> : null}
        </div>

        {activeTab === 'transactions' ? (
          <div className="txn-table-wrap">
            <table className="txn-table">
              <thead>
                <tr>
                  <ColHeader col="date" label="Date" />
                  <ColHeader col="totalVolume" label="Total Volume" />
                  <ColHeader col="totalCount" label="Total Count" />
                  <ColHeader col="achVolume" label="ACH Volume" />
                  <ColHeader col="achCount" label="ACH Count" />
                  <ColHeader col="ccVolume" label="CC Volume" />
                  <ColHeader col="ccCount" label="CC Count" />
                  <ColHeader col="chargebackRate" label="CB Rate" />
                  <ColHeader col="chargebackVolume" label="CB Amount" />
                  <ColHeader col="chargebackCount" label="CB Count" />
                  <ColHeader col="approvalRate" label="Approval %" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{fmt(row.totalVolume)}</td>
                    <td>{fmtNum(row.totalCount)}</td>
                    <td className="text-teal">{fmt(row.achVolume)}</td>
                    <td className="text-teal">{fmtNum(row.achCount)}</td>
                    <td className="text-purple">{fmt(row.ccVolume)}</td>
                    <td className="text-purple">{fmtNum(row.ccCount)}</td>
                    <td>
                      <span className={cbPillClass(row.chargebackRate)}>{fmtPct(row.chargebackRate)}</span>
                    </td>
                    <td>{fmt(row.chargebackVolume)}</td>
                    <td>{fmtNum(row.chargebackCount)}</td>
                    <td>
                      <span
                        className={
                          row.approvalRate >= 97 ? 'apr-up' : row.approvalRate >= 95 ? 'apr-mid' : 'apr-down'
                        }
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {row.approvalRate >= 97 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {fmtPct(row.approvalRate)}
                      </span>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="txn-empty">
                      No data for selected range
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {sorted.length > 0 ? (
                <tfoot>
                  <tr>
                    <td style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Totals / Avg
                    </td>
                    <td>{fmt(kpis.totalVolume)}</td>
                    <td>{fmtNum(kpis.totalCount)}</td>
                    <td className="text-teal">{fmt(kpis.achVolume)}</td>
                    <td className="text-teal">{fmtNum(kpis.achCount)}</td>
                    <td className="text-purple">{fmt(kpis.ccVolume)}</td>
                    <td className="text-purple">{fmtNum(kpis.ccCount)}</td>
                    <td>
                      <span className={cbPillClass(kpis.chargebackRate)}>{fmtPct(kpis.chargebackRate)}</span>
                    </td>
                    <td>{fmt(kpis.chargebackVolume)}</td>
                    <td>{fmtNum(kpis.chargebackCount)}</td>
                    <td className="apr-up">{fmtPct(kpis.approvalRate)}</td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        ) : (
          <div className="table-placeholder">
            {tabLabels[activeTab]} data will appear here based on active filters
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsOpsDashboard;
