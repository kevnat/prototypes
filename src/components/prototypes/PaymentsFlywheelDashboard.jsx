/**
 * PaymentsFlywheelDashboard.jsx
 *
 * Self-contained React component for the D - Payments Epic Flywheel.
 * Fetches live data from Jira and renders four kanban lanes:
 *   ⏭️ Up Next     (status = "Open")    — includes grooming checklist
 *   🌱 Starting    (auto or override)   — early-stage in-progress epics
 *   🔨 Building    (auto or override)   — mid-stage in-progress epics
 *   🏁 Almost Done (auto or override)   — ≥55% tickets complete
 *
 * Child tickets are fetched in a single paginated batch query (not per-epic)
 * using the "Epic Link" in (...) JQL, falling back to parent in (...) for
 * next-gen Jira projects.  REST API pagination uses startAt/maxResults offset.
 *
 * ─── SETUP ──────────────────────────────────────────────────────────────────
 * The component calls /api/jira/* by default, so you need a lightweight proxy
 * to avoid CORS.  Two easy options:
 *
 * 1) Vite  — add to vite.config.js:
 *      server: {
 *        proxy: {
 *          '/api/jira': {
 *            target: 'https://billingplatform.atlassian.net',
 *            changeOrigin: true,
 *            rewrite: path => path.replace(/^\/api\/jira/, ''),
 *            headers: {
 *              Authorization: 'Basic ' + btoa('your@email.com:YOUR_API_TOKEN'),
 *            },
 *          },
 *        },
 *      },
 *
 * 2) Next.js — create pages/api/jira/[...path].js that proxies to Jira with
 *    server-side credentials (JIRA_EMAIL + JIRA_API_TOKEN env vars).
 *
 * Alternatively, set JIRA_BASE_URL below to a backend route you already have.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useFlywheelBoard } from '../../hooks/useFlywheelBoard.js';

// ── Config ────────────────────────────────────────────────────────────────────
const JIRA_BASE_URL  = '/api/jira';
const JIRA_SITE      = 'https://billingplatform.atlassian.net';
const PROJECT        = 'D - Payments';
const EPIC_FIELDS    = 'summary,status,priority,assignee,updated,labels';
const CHILD_FIELDS   = 'status,customfield_10014,parent';  // customfield_10014 = classic Epic Link

const GROOM_LABELS = [
  'Design / mockups ready',
  'Acceptance criteria written',
  'Dependencies identified',
  'Grooming session scheduled',
];

// ── Status buckets ────────────────────────────────────────────────────────────
const EARLY = new Set([
  'open','backlog','to do','todo','estimate','dev ready','ready for dev',
  'selected for development','ready','planned','new','defined','scoping',
]);
const DONE = new Set([
  'done','closed','resolved','released','accepted','complete',
  'ready for release','deployed','verified',
  // cancelled variants — treated as resolved (no remaining work)
  'cancel','cancelled','canceled',"won't do",'wont do',"won't fix",
  'wontfix','duplicate','invalid','rejected','withdrawn','obsolete',
]);
const CANCELLED = new Set([
  'cancel','cancelled','canceled',"won't do",'wont do',"won't fix",
  'wontfix','duplicate','invalid','rejected','withdrawn','obsolete',
]);
const IN_REVIEW_TEST = new Set([
  'in review','code review','review','peer review','pr review','pull request',
  'in test','testing','qa','quality assurance','uat','in qa',
  'ready for test','ready for qa','ready for review','ready for testing',
]);

// ── Display helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = {
  'Kevin Nathan':         '#2563eb',
  'Alexander Kazimirsky': '#7c3aed',
  'Ilia Gladyshev':       '#059669',
  'Bryan Burke':          '#d97706',
  'Morgan Stanton':       '#db2777',
  'Matthew Kalan':        '#0891b2',
  'Stephen Rousey':       '#65a30d',
  'Anton Shokhrin':       '#dc2626',
};

const LABEL_STYLES = {
  'pay-in-dev':       { bg: '#dbeafe', color: '#1d4ed8', text: 'in dev'    },
  'pay-dev-complete': { bg: '#d1fae5', color: '#065f46', text: 'dev done'  },
  'pay-up-next':      { bg: '#ede9fe', color: '#5b21b6', text: 'up next'   },
  'pay-tech-debt':    { bg: '#ffedd5', color: '#9a3412', text: 'tech debt' },
  'pay_docs':         { bg: '#e0f2fe', color: '#0369a1', text: 'docs'      },
};

const PRIORITY_COLORS = {
  Highest: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#9ca3af',
};
const PRIORITY_ORDER = { Highest: 0, High: 1, Medium: 2, Low: 3 };

function initials(name)     { return name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'; }
function avatarColor(name)  { return AVATAR_COLORS[name] || '#6b7280'; }
function priorityColor(p)   { return PRIORITY_COLORS[p]  || '#d1d5db'; }
function timeAgo(ds)        {
  const d = Math.floor((Date.now() - new Date(ds)) / 86400000);
  if (d === 0) return 'today';
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ── Auto-categorise an in-progress epic into a kanban column ─────────────────
function categorise(children) {
  if (!children || children.length === 0) return 'starting';
  const total           = children.length;
  const doneOrCancelled = children.filter(c => DONE.has(c.status.toLowerCase())).length;
  const early           = children.filter(c => EARLY.has(c.status.toLowerCase())).length;
  if (doneOrCancelled / total >= 0.55) return 'almostdone';
  if (early           / total >= 0.65) return 'starting';
  // Split building: more in review/test → intest, otherwise indev (tie stays indev)
  const reviewTest  = children.filter(c => IN_REVIEW_TEST.has(c.status.toLowerCase())).length;
  const activelyDev = children.filter(c =>
    !DONE.has(c.status.toLowerCase()) &&
    !EARLY.has(c.status.toLowerCase()) &&
    !IN_REVIEW_TEST.has(c.status.toLowerCase()) &&
    !CANCELLED.has(c.status.toLowerCase())
  ).length;
  return reviewTest > activelyDev ? 'intest' : 'indev';
}

// Progress score for indev sort: ratio of tickets in review/test (higher = closer to intest)
function reviewTestRatio(children) {
  if (!children || children.length === 0) return 0;
  const scoped     = children.filter(c => !CANCELLED.has(c.status.toLowerCase()));
  if (scoped.length === 0) return 0;
  const reviewTest = scoped.filter(c => IN_REVIEW_TEST.has(c.status.toLowerCase())).length;
  return reviewTest / scoped.length;
}

// ── Jira REST helpers ─────────────────────────────────────────────────────────

/** Single page — used for epic-level queries where results fit in one page. */
async function jiraSearch({ jql, fields, maxResults = 50 }) {
  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jql, fields: fields.split(','), maxResults }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Jira error body:', body);
    throw new Error(`Jira ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Paginated — fetches ALL matching issues using cursor pagination (nextPageToken).
 * Use this for child ticket queries where > 100 results are expected.
 */
async function jiraSearchAll({ jql, fields }) {
  const PAGE_SIZE = 100;
  let all = [], nextPageToken = undefined;

  while (true) {
    const body = { jql, fields: fields.split(','), maxResults: PAGE_SIZE };
    if (nextPageToken) body.nextPageToken = nextPageToken;
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Jira ${res.status}: ${res.statusText}`);
    const data = await res.json();
    const page = data.issues || [];
    all = all.concat(page);
    if (data.isLast || !data.nextPageToken || page.length === 0) break;
    nextPageToken = data.nextPageToken;
  }
  return all;
}

// ── Grooming checklist ────────────────────────────────────────────────────────
function GroomingChecklist({ epicKey, checks, onToggle }) {
  const [open, setOpen] = useState(false);

  const done = checks.filter(Boolean).length;
  const pct  = Math.round(done / GROOM_LABELS.length * 100);

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={s.groomBtn}>
        <span>📋 Grooming</span>
        <span style={{ color: '#6b7280', fontSize: 10 }}>{done}/{GROOM_LABELS.length}</span>
      </button>
      {open && (
        <div style={{ paddingTop: 5 }}>
          {GROOM_LABELS.map((label, i) => (
            <label key={i} style={s.groomItem}>
              <input type="checkbox" checked={checks[i]} onChange={() => onToggle(i)}
                     style={{ cursor: 'pointer', accentColor: '#2563eb' }} />
              {label}
            </label>
          ))}
          <div style={s.groomBar}><div style={{ ...s.groomFill, width: `${pct}%` }} /></div>
        </div>
      )}
    </div>
  );
}

// ── Progress summary (ticket counts, excluding cancelled) ─────────────────────
function ProgressSummary({ children }) {
  if (!children || children.length === 0) return null;

  // Denominator excludes cancelled tickets
  const scoped    = children.filter(c => !CANCELLED.has(c.status.toLowerCase()));
  const completed = scoped.filter(c => DONE.has(c.status.toLowerCase()));
  const active    = scoped.filter(c => !DONE.has(c.status.toLowerCase()) && !EARLY.has(c.status.toLowerCase()));

  const byStatus = {};
  active.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
  const breakdown = Object.entries(byStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([status, n]) => `${n} ${status.toLowerCase()}`)
    .join(' · ');

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 3 }}>
        {completed.length} / {scoped.length} done
      </div>
      {breakdown && (
        <div style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.6 }}>{breakdown}</div>
      )}
    </div>
  );
}

// ── Epic card ─────────────────────────────────────────────────────────────────
function EpicCard({ issue, childData = null, showGroom = false, isPinned = false, onHide, groomChecks, onGroomToggle, onDragOver }) {
  const { key, fields } = issue;
  const name   = fields.assignee?.displayName;
  const url    = `${JIRA_SITE}/browse/${key}`;
  return (
    <div draggable data-key={key} onDragOver={onDragOver} style={{ ...s.card, ...(isPinned ? s.cardPinned : {}), cursor: 'grab' }}>
      <div style={s.cardTop}>
        <a href={url} target="_blank" rel="noreferrer" style={s.epicKey}>{key}</a>
        <span style={{ ...s.pDot, background: priorityColor(fields.priority?.name) }}
              title={fields.priority?.name} />
        {name && (
          <span style={{ ...s.avatar, background: avatarColor(name) }} title={name}>
            {initials(name)}
          </span>
        )}
        {onHide && (
          <button onClick={() => onHide(key)} title="Hide" style={s.hideBtn}>×</button>
        )}
      </div>
      <div style={s.cardTitle}>{fields.summary}</div>

      <div style={s.cardFoot}>
        <span style={s.updated}>Updated {timeAgo(fields.updated)}</span>
      </div>
      {childData !== null && <ProgressSummary children={childData} />}
      {showGroom && (
        <GroomingChecklist
          epicKey={key}
          checks={groomChecks || GROOM_LABELS.map(() => false)}
          onToggle={onGroomToggle}
        />
      )}
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────
const COL_STYLES = {
  upnext:    { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  starting:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  indev:     { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  intest:    { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  almostdone:{ bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
};
const COL_TITLES = {
  upnext:    '⏭️ Up Next',
  starting:  '🌱 Starting',
  indev:     '🔨 In Development',
  intest:    '🧪 In Test',
  almostdone:'🏁 Almost Done',
};

function DropLine() {
  return <div style={{ height: 3, borderRadius: 2, background: '#2563eb', margin: '2px 4px', flexShrink: 0 }} />;
}

function KanbanColumn({ colId, issues, childMap, overrides, showGroom = false, onHide, onDrop, groomState, onGroomToggle }) {
  const cs = COL_STYLES[colId];
  const [insertIdx, setInsertIdx] = useState(null);

  function calcIdx(e, idx) {
    const { top, height } = e.currentTarget.getBoundingClientRect();
    return e.clientY < top + height / 2 ? idx : idx + 1;
  }

  return (
    <div style={s.column}
         onDragOver={e => { e.preventDefault(); if (issues.length === 0) setInsertIdx(0); }}
         onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInsertIdx(null); }}
         onDrop={e => { e.preventDefault(); setInsertIdx(null); onDrop(colId); }}>
      <div style={{ ...s.colHeader, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
        {COL_TITLES[colId]}
        <span style={s.colCount}>{issues.length}</span>
      </div>
      <div style={{ ...s.dropZone, ...(insertIdx !== null ? s.dropZoneActive : {}) }}>
        {issues.length === 0
          ? <>{insertIdx === 0 && <DropLine />}<div style={s.empty}>Drop cards here</div></>
          : <>
              {issues.map((i, idx) => (
                <div key={i.key} style={{ display: 'contents' }}>
                  {insertIdx === idx && <DropLine />}
                  <EpicCard
                    issue={i}
                    childData={colId !== 'upnext' ? (childMap[i.key] ?? null) : null}
                    showGroom={showGroom}
                    isPinned={!!overrides[i.key]}
                    onHide={onHide}
                    groomChecks={groomState?.[i.key]}
                    onGroomToggle={onGroomToggle}
                    onDragOver={e => { e.stopPropagation(); setInsertIdx(calcIdx(e, idx)); }}
                  />
                </div>
              ))}
              {insertIdx === issues.length && <DropLine />}
            </>
        }
      </div>
    </div>
  );
}

// ── Hidden cards tray ─────────────────────────────────────────────────────────
function HiddenTray({ hidden, allEpics, onRestore, onClose }) {
  return (
    <div style={s.hiddenTray}>
      <div style={s.hiddenTrayHead}>
        🙈 Hidden cards — click ↩ to restore
        <button onClick={onClose} style={{ ...s.btn, marginLeft: 'auto', fontSize: 9 }}>Close</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px' }}>
        {hidden.length === 0
          ? <span style={{ fontSize: 10, color: '#9ca3af' }}>Nothing hidden</span>
          : hidden.map(key => {
              const epic = allEpics.find(e => e.key === key);
              const label = epic ? `${key}: ${epic.fields.summary.slice(0, 30)}…` : key;
              return (
                <span key={key} style={s.hiddenChip}>
                  {label}
                  <button onClick={() => onRestore(key)} style={s.restoreBtn} title="Restore">↩</button>
                </span>
              );
            })
        }
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
const COLS = ['upnext', 'starting', 'indev', 'intest', 'almostdone'];

export default function PaymentsFlywheelDashboard() {
  const { overrides, setOverrides, hidden, setHidden, showTD, setShowTD, groomState, setGroomState } = useFlywheelBoard();
  const [allEpics,   setAllEpics]   = useState([]);
  const [childMap,   setChildMap]   = useState({});
  const [trayOpen,   setTrayOpen]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [meta,       setMeta]       = useState('Loading…');
  const [error,      setError]      = useState(null);
  const [dragKey,    setDragKey]    = useState(null);

  // ── Jira load ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null); setMeta('Loading…');
    try {
      const epicRes = await jiraSearch({
        jql: `project = "${PROJECT}" AND issuetype = Epic AND status in ("In Progress","Open") ORDER BY updated DESC`,
        fields: EPIC_FIELDS,
        maxResults: 100,
      });

      const epics    = epicRes.issues || [];
      const flightKeys = epics.filter(e => e.fields.status.name === 'In Progress').map(e => e.key);
      setAllEpics(epics);

      // ── Batch-fetch child tickets (single paginated query) ─────────────────
      if (flightKeys.length > 0) {
        const keyList = flightKeys.join(',');
        const newMap  = {};
        flightKeys.forEach(k => { newMap[k] = []; });

        // Classic Jira: "Epic Link" custom field
        let allChildren = [];
        try {
          allChildren = await jiraSearchAll({
            jql: `"Epic Link" in (${keyList}) ORDER BY status`,
            fields: CHILD_FIELDS,
          });
        } catch (_) {}

        // Next-gen Jira fallback: parent field
        if (allChildren.length === 0) {
          try {
            allChildren = await jiraSearchAll({
              jql: `parent in (${keyList}) ORDER BY status`,
              fields: CHILD_FIELDS,
            });
          } catch (_) {}
        }

        // Group children by their parent epic key
        allChildren.forEach(c => {
          const epicKey = c.fields.customfield_10014 || c.fields.parent?.key;
          if (epicKey && Object.prototype.hasOwnProperty.call(newMap, epicKey)) {
            newMap[epicKey].push({ status: c.fields.status?.name || '' });
          }
        });

        setChildMap(newMap);
      } else {
        setChildMap({});
      }

      const infCount = flightKeys.length;
      const upCount  = epics.filter(e => e.fields.status.name === 'Open').length;
      setMeta(`${infCount} in flight · ${upCount} up next · ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setError(err.message);
      setMeta('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived state ──────────────────────────────────────────────────────────
  function getCol(epic) {
    if (overrides[epic.key]) return overrides[epic.key];
    const children = childMap[epic.key];
    if (children && children.length > 0) return categorise(children);
    const labels = epic.fields.labels || [];
    if (labels.includes('pay-dev-complete')) return 'almostdone';
    if (labels.includes('pay-in-dev'))       return 'indev';
    return 'starting';
  }

  const visible = allEpics.filter(e => {
    if (hidden.includes(e.key)) return false;
    if (!showTD && (e.fields.labels || []).includes('pay-tech-debt')) return false;
    return true;
  });

  const buckets = { upnext: [], starting: [], indev: [], intest: [], almostdone: [] };
  visible.filter(e => e.fields.status.name === 'Open').forEach(e => buckets.upnext.push(e));
  visible.filter(e => e.fields.status.name === 'In Progress').forEach(e => {
    const col = getCol(e);
    (buckets[col] || buckets['indev']).push(e);
  });

  // Sort: pinned first, then column-specific order
  COLS.forEach(col => {
    buckets[col].sort((a, b) => {
      const aPin = overrides[a.key] ? 0 : 1;
      const bPin = overrides[b.key] ? 0 : 1;
      if (aPin !== bPin) return aPin - bPin;
      // indev: closest to test at top (highest review/test ratio first)
      if (col === 'indev') {
        const diff = reviewTestRatio(childMap[b.key]) - reviewTestRatio(childMap[a.key]);
        if (diff !== 0) return diff;
      }
      return (PRIORITY_ORDER[a.fields.priority?.name] ?? 4) - (PRIORITY_ORDER[b.fields.priority?.name] ?? 4);
    });
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleDrop(colId) {
    if (!dragKey) return;
    setOverrides({ ...overrides, [dragKey]: colId });
    setDragKey(null);
  }

  function hideCard(key) {
    setHidden([...hidden, key].filter((v, i, a) => a.indexOf(v) === i));
  }

  function restoreCard(key) {
    setHidden(hidden.filter(k => k !== key));
  }

  function resetOverrides() {
    if (!window.confirm('Clear all manual column placements?')) return;
    setOverrides({});
  }

  function toggleTD() {
    setShowTD(!showTD);
  }

  function handleGroomToggle(epicKey, idx) {
    const current = groomState[epicKey] || GROOM_LABELS.map(() => false);
    const next = current.map((v, i) => i === idx ? !v : v);
    setGroomState({ ...groomState, [epicKey]: next });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
      <div style={s.root}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.h1}>🔄 D - Payments · Epic Kanban Microcosm</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={s.meta}>{meta}</span>
            <button onClick={toggleTD} style={{ ...s.btn, ...(showTD ? s.btnActive : {}) }}>
              {showTD ? 'Hide tech debt' : 'Show tech debt'}
            </button>
            {hidden.length > 0 && (
              <button onClick={() => setTrayOpen(o => !o)} style={s.btn}>
                {trayOpen ? 'Hide' : 'Show'} hidden ({hidden.length})
              </button>
            )}
            <button onClick={resetOverrides} style={{ ...s.btn, ...s.btnDanger }}>Reset overrides</button>
            <button onClick={load} style={s.btn} disabled={loading}>↻ Refresh</button>
          </div>
        </div>

        {error && <div style={s.errorBanner}>Error: {error}</div>}

        {/* Hidden tray */}
        {trayOpen && (
          <HiddenTray hidden={hidden} allEpics={allEpics}
            onRestore={restoreCard} onClose={() => setTrayOpen(false)} />
        )}

        {/* Loading overlay */}
        {loading && allEpics.length === 0 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Spinner /> Fetching epics and child tickets…
          </div>
        )}

        {/* Kanban board */}
        {(!loading || allEpics.length > 0) && (
          <div style={s.board}
               onDragStart={e => {
                 // capture the card key from closest card ancestor
                 const card = e.target.closest('[data-key]');
                 if (card) setDragKey(card.dataset.key);
               }}>
            {COLS.map(col => (
              <KanbanColumn
                key={col}
                colId={col}
                issues={buckets[col]}
                childMap={childMap}
                overrides={overrides}
                showGroom={col === 'upnext'}
                onHide={hideCard}
                onDrop={handleDrop}
                groomState={groomState}
                onGroomToggle={handleGroomToggle}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 13, height: 13,
      border: '2px solid #e5e7eb', borderTopColor: '#2563eb',
      borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root:          { fontFamily: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f1f3f6', minHeight: '100vh', color: '#111827' },
  header:        { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, position: 'sticky', top: 0, zIndex: 100 },
  h1:            { fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' },
  meta:          { fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' },
  errorBanner:   { background: '#fee2e2', borderBottom: '1px solid #fca5a5', padding: '8px 16px', fontSize: 11, color: '#b91c1c' },

  btn:           { fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' },
  btnActive:     { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' },
  btnDanger:     { borderColor: '#fca5a5', color: '#b91c1c' },

  board:         { display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1fr 1fr', gap: 10, padding: 12, alignItems: 'start' },
  column:        { display: 'flex', flexDirection: 'column', gap: 6 },
  colHeader:     { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2, userSelect: 'none' },
  colCount:      { marginLeft: 'auto', fontSize: 9, background: 'rgba(0,0,0,0.08)', padding: '1px 6px', borderRadius: 8 },
  dropZone:      { display: 'flex', flexDirection: 'column', gap: 6, minHeight: 80, borderRadius: 8, padding: 2, transition: 'background 0.15s, outline 0.15s' },
  dropZoneActive:{ background: 'rgba(37,99,235,0.06)', outline: '2px dashed #93c5fd' },
  empty:         { padding: '14px 8px', textAlign: 'center', fontSize: 10, color: '#c4c9d4', border: '1px dashed #e5e7eb', borderRadius: 6 },

  card:          { background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', padding: '10px 11px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'grab', userSelect: 'none', position: 'relative' },
  cardPinned:    { borderLeft: '3px solid #6366f1' },
  cardTop:       { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, paddingRight: 20 },
  epicKey:       { fontSize: 10, fontWeight: 700, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap' },
  pDot:          { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  avatar:        { marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: 'white', flexShrink: 0 },
  hideBtn:       { position: 'absolute', top: 7, right: 8, width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  cardTitle:     { fontSize: 11, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 },
  labels:        { display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 },
  pill:          { fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 8 },
  cardFoot:      { display: 'flex', alignItems: 'center' },
  updated:       { fontSize: 9, color: '#9ca3af' },

  groomBtn:      { width: '100%', background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '4px 7px', fontSize: 9, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' },
  groomItem:     { display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', fontSize: 9, color: '#374151', cursor: 'pointer' },
  groomBar:      { height: 2, background: '#e5e7eb', borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  groomFill:     { height: '100%', background: '#2563eb', borderRadius: 2, transition: 'width 0.2s' },

  hiddenTray:    { margin: '0 12px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  hiddenTrayHead:{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 },
  hiddenChip:    { display: 'flex', alignItems: 'center', gap: 5, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 5, padding: '3px 8px', fontSize: 10, color: '#374151' },
  restoreBtn:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#9ca3af', padding: '0 2px', lineHeight: 1 },
};
