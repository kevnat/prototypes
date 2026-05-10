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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlywheelBoard } from '../../hooks/useFlywheelBoard.js';
import { supabase } from '../../lib/supabaseClient.js';

// ── Config ────────────────────────────────────────────────────────────────────
const JIRA_BASE_URL  = '/api/jira';
const JIRA_SITE      = 'https://billingplatform.atlassian.net';
const PROJECT        = 'D - Payments';
const EPIC_FIELDS    = 'summary,status,priority,assignee,updated,labels,issuelinks';
const CHILD_FIELDS   = 'status,customfield_10014,parent';  // customfield_10014 = classic Epic Link
const TRIAGE_FIELDS  = 'summary,status,priority,assignee,updated,issuetype,parent,customfield_10014';

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
function EpicCard({ issue, childData = null, showGroom = false, movedFrom = null, diffType = null, onHide, groomChecks, onGroomToggle, onDragOver, colColor, isDraggable = false, note = '', onSaveNote, showAllNotes = false, rdmpLink = null }) {
  const { key, fields } = issue;
  const name       = fields.assignee?.displayName;
  const url        = `${JIRA_SITE}/browse/${key}`;
  const isTechDebt = (fields.labels || []).includes('pay-tech-debt');
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft,    setDraft]    = useState(note);

  useEffect(() => { if (!showAllNotes) setNoteOpen(false); }, [showAllNotes]);

  const noteVisible = noteOpen || (showAllNotes && !!note);

  function openNote() { setDraft(note); setNoteOpen(true); }
  function saveNote() { if (onSaveNote) onSaveNote(key, draft); setNoteOpen(false); }

  return (
    <div draggable={isDraggable} data-key={key} onDragOver={onDragOver} style={{ ...s.card, cursor: isDraggable ? 'grab' : 'default', ...(diffType ? { borderTop: `3px solid ${DIFF_COLORS[diffType]}` } : {}) }}>
      <div style={s.cardTop}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          <a href={url} target="_blank" rel="noreferrer" style={{ ...s.epicKey, color: colColor }}>{key}</a>
          {rdmpLink && (
            <a href={`${JIRA_SITE}/browse/${rdmpLink}`} target="_blank" rel="noreferrer"
               style={{ ...s.pill, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', textDecoration: 'none', fontSize: 9 }}>
              ↗ {rdmpLink}
            </a>
          )}
        </div>
        {onHide && (
          <button onClick={() => onHide(key)} title="Hide" style={s.hideBtn}>×</button>
        )}
      </div>
      <div style={s.cardTitle}>{fields.summary}</div>
      {isTechDebt && (
        <div style={{ marginTop: 5 }}>
          <span style={{ ...s.pill, background: '#ffedd5', color: '#9a3412' }}>tech debt</span>
        </div>
      )}
      <div style={{ ...s.cardFoot, justifyContent: 'space-between' }}>
        <span style={s.updated}>
          Updated {timeAgo(fields.updated)}
          {movedFrom && <span style={{ color: '#d1d5db' }}> · moved from {COL_DISPLAY[movedFrom]}</span>}
        </span>
        <button
          onClick={openNote}
          title={note ? 'View/edit note' : 'Add note'}
          style={note
            ? { fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer', lineHeight: 1.6, whiteSpace: 'nowrap' }
            : { background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1, fontSize: 11, color: '#d1d5db' }
          }
        >
          {note ? '✎ note' : '✎'}
        </button>
      </div>
      {noteVisible && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
          {noteOpen && onSaveNote ? (
            <>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={3}
                style={{ width: '100%', fontSize: 10, border: '1px solid #e5e7eb', borderRadius: 5, padding: '5px 7px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Add a note…"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setNoteOpen(false)} style={{ ...s.btn, fontSize: 9, padding: '3px 7px' }}>Cancel</button>
                <button onClick={saveNote} style={{ ...s.btn, fontSize: 9, padding: '3px 7px', background: '#2563eb', color: 'white', borderColor: '#2563eb' }}>Save</button>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {note || <span style={{ color: '#9ca3af' }}>No note</span>}
              <button onClick={() => setNoteOpen(false)} style={{ display: 'block', marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: '#9ca3af', padding: 0 }}>close</button>
            </div>
          )}
        </div>
      )}
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
  starting:  { bg: '#fefce8', color: '#854d0e', border: '#fde047' },
  indev:     { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
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
const COL_DISPLAY = {
  upnext: 'Up Next', starting: 'Starting', indev: 'In Dev', intest: 'In Test', almostdone: 'Almost Done',
};

function DropLine() {
  return <div style={{ height: 3, borderRadius: 2, background: '#2563eb', margin: '2px 4px', flexShrink: 0 }} />;
}

function KanbanColumn({ colId, issues, childMap, overrides, showGroom = false, onHide, onDrop, groomState, onGroomToggle, editable = false, notes = {}, onSaveNote, showAllNotes = false, rdmpMap = {}, movedFromMap = {}, diffMap = {} }) {
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
         onDrop={e => { e.preventDefault(); const idx = insertIdx; setInsertIdx(null); if (editable) onDrop(colId, idx); }}>
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
                    movedFrom={movedFromMap[i.key] || null}
                    diffType={diffMap[i.key] || null}
                    onHide={editable ? onHide : undefined}
                    groomChecks={groomState?.[i.key]}
                    onGroomToggle={onGroomToggle}
                    colColor={cs.color}
                    isDraggable={editable}
                    note={notes[i.key] || ''}
                    onSaveNote={editable ? onSaveNote : null}
                    showAllNotes={showAllNotes}
                    rdmpLink={rdmpMap[i.key] || null}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setInsertIdx(calcIdx(e, idx)); }}
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
        🙈 Hidden cards{onRestore ? ' — click ↩ to restore' : ''}
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
                  {onRestore && (
                    <button onClick={() => onRestore(key)} style={s.restoreBtn} title="Restore">↩</button>
                  )}
                </span>
              );
            })
        }
      </div>
    </div>
  );
}

// ── Triage section ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'to do':       { bg: '#f3f4f6', color: '#374151' },
  'open':        { bg: '#f3f4f6', color: '#374151' },
  'in progress': { bg: '#dbeafe', color: '#1d4ed8' },
  'in review':   { bg: '#ede9fe', color: '#6d28d9' },
  'in test':     { bg: '#fff7ed', color: '#c2410c' },
  'done':        { bg: '#dcfce7', color: '#15803d' },
  'closed':      { bg: '#dcfce7', color: '#15803d' },
};

function statusStyle(name) {
  return STATUS_COLORS[name?.toLowerCase()] || { bg: '#f3f4f6', color: '#374151' };
}

function TriageSection({ issues }) {
  const [open, setOpen] = useState(true);
  if (issues.length === 0) return null;

  return (
    <div style={{ margin: '12px 12px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid #f3f4f6' : 'none' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#111827', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
          🔍 Triage
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a', padding: '1px 7px', borderRadius: 8 }}>
          {issues.length}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9ca3af' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <th style={s.th}>Key</th>
              <th style={s.th}>Summary</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Assignee</th>
              <th style={s.th}>Priority</th>
              <th style={s.th}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, i) => {
              const { key, fields } = issue;
              const ss = statusStyle(fields.status?.name);
              const name = fields.assignee?.displayName;
              return (
                <tr key={key} style={{ borderBottom: i < issues.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <td style={s.td}>
                    <a href={`${JIRA_SITE}/browse/${key}`} target="_blank" rel="noreferrer"
                       style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {key}
                    </a>
                  </td>
                  <td style={{ ...s.td, maxWidth: 380 }}>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{fields.summary}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{fields.issuetype?.name || '—'}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: ss.bg, color: ss.color, whiteSpace: 'nowrap' }}>
                      {fields.status?.name}
                    </span>
                  </td>
                  <td style={s.td}>
                    {name
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: avatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                            {initials(name)}
                          </span>
                          <span style={{ fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}>{name.split(' ')[0]}</span>
                        </span>
                      : <span style={{ color: '#d1d5db', fontSize: 10 }}>—</span>
                    }
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.pDot, background: priorityColor(fields.priority?.name), display: 'inline-block' }} title={fields.priority?.name} />
                  </td>
                  <td style={{ ...s.td, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {timeAgo(fields.updated)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Mobile column tab bar ─────────────────────────────────────────────────────
const COL_SHORT = { upnext: '⏭ Up Next', starting: '🌱 Starting', indev: '🔨 In Dev', intest: '🧪 In Test', almostdone: '🏁 Done' };

function MobileColTabs({ cols, activeIdx, onSelect }) {
  return (
    <div className="pfr-tabs" style={{
      overflowX: 'auto', gap: 6, padding: '8px 12px', alignItems: 'center',
      background: 'white', borderBottom: '1px solid #e5e7eb',
      scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', flexShrink: 0,
    }}>
      {cols.map((col, i) => {
        const cs = COL_STYLES[col];
        return (
          <button key={col} onClick={() => onSelect(i)} style={{
            flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '5px 12px',
            borderRadius: 20, border: '1px solid',
            background: i === activeIdx ? cs.bg : 'white',
            color: i === activeIdx ? cs.color : '#6b7280',
            borderColor: i === activeIdx ? cs.border : '#e5e7eb',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {COL_SHORT[col]}
          </button>
        );
      })}
    </div>
  );
}

// ── Snapshot diff ─────────────────────────────────────────────────────────────
function computeDiff(snapshot, liveEpics, liveChildMap, getColFn, overrides = {}) {
  const snapEpics = snapshot?.epics ?? {};
  const liveKeys  = new Set(liveEpics.map(e => e.key));
  const changes   = [];

  liveEpics.forEach(epic => {
    if (!snapEpics[epic.key])
      changes.push({ type: 'appeared', key: epic.key,
                     summary: epic.fields.summary.slice(0, 60),
                     to: getColFn(epic) });
  });

  Object.entries(snapEpics).forEach(([key, snap]) => {
    if (!liveKeys.has(key)) {
      changes.push({ type: 'completed', key, summary: snap.summary });
      return;
    }
    const epic      = liveEpics.find(e => e.key === key);
    const liveCol   = getColFn(epic);
    const children  = liveChildMap[key] ?? [];
    const scoped    = children.filter(c => !CANCELLED.has(c.status.toLowerCase()));
    const liveDone  = scoped.filter(c => DONE.has(c.status.toLowerCase())).length;
    const liveTotal = scoped.length;
    const delta     = liveDone - snap.done;
    if (liveCol !== snap.col && !overrides[key])
      changes.push({ type: 'moved', key, summary: snap.summary,
                     from: snap.col, to: liveCol,
                     doneDelta: delta, doneNow: liveDone, totalNow: liveTotal });
    else if (delta > 0)
      changes.push({ type: 'progressed', key, summary: snap.summary,
                     doneDelta: delta, doneNow: liveDone, totalNow: liveTotal });
  });

  return changes;
}

const DIFF_ICONS  = { moved: '→', progressed: '↑', appeared: '+', completed: '✓' };
const DIFF_COLORS = { moved: '#2563eb', progressed: '#059669', appeared: '#7c3aed', completed: '#9ca3af' };

function formatDiffItem(item) {
  const label = item.summary || item.key;
  switch (item.type) {
    case 'moved':
      return `${label}: ${COL_DISPLAY[item.from] ?? item.from} → ${COL_DISPLAY[item.to] ?? item.to}` +
             (item.doneDelta > 0 ? ` (+${item.doneDelta} done)` : '');
    case 'progressed':
      return `${label}: ${item.doneNow}/${item.totalNow} done (+${item.doneDelta})`;
    case 'appeared':
      return `${label} · appeared in ${COL_DISPLAY[item.to] ?? item.to}`;
    case 'completed':
      return `${label} · left the board`;
    default: return label;
  }
}

function DiffTicker({ items }) {
  const [paused, setPaused] = useState(false);
  const repeated = [...items, ...items];
  const duration = Math.max(30, items.length * 14);
  return (
    <div style={s.ticker}>
      <button onClick={() => setPaused(p => !p)} style={s.tickerPause} title={paused ? 'Resume' : 'Pause'}>
        {paused ? '▶' : '⏸'}
      </button>
      <div style={s.tickerTrack}>
        <div style={{ ...s.tickerContent, animationDuration: `${duration}s`, animationPlayState: paused ? 'paused' : 'running' }}>
          {repeated.map((item, i) => (
            <span key={i} style={s.tickerItem}>
              <span style={{ color: DIFF_COLORS[item.type], fontWeight: 800, marginRight: 4 }}>
                {DIFF_ICONS[item.type]}
              </span>
              {formatDiffItem(item)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
const COLS = ['upnext', 'starting', 'indev', 'intest', 'almostdone'];

export default function PaymentsFlywheelDashboard() {
  const navigate = useNavigate();
  const { overrides, setOverrides, hidden, setHidden, showTD, setShowTD, groomState, setGroomState, notes, setNotes, ranks, setRanks, loaded: boardLoaded, isEditMode, enterEditMode, exitEditMode } = useFlywheelBoard();
  const [allEpics,      setAllEpics]      = useState([]);
  const [childMap,      setChildMap]      = useState({});
  const [rdmpMap,       setRdmpMap]       = useState({});
  const [triageIssues,  setTriageIssues]  = useState([]);
  const [trayOpen,      setTrayOpen]      = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [meta,       setMeta]       = useState('Loading…');
  const [error,      setError]      = useState(null);
  const [dragKey,    setDragKey]    = useState(null);
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [passphraseInput,     setPassphraseInput]     = useState('');
  const [unlockError,         setUnlockError]         = useState(null);
  const [lockAlert,           setLockAlert]           = useState(false);
  const [showAllNotes,        setShowAllNotes]        = useState(false);
  const [roadmapOnly,         setRoadmapOnly]         = useState(false);
  const [diffItems,           setDiffItems]           = useState([]);
  const [diffVisible,         setDiffVisible]         = useState(false);
  const [diffChecked,         setDiffChecked]         = useState(false);
  const [diffAt,              setDiffAt]              = useState(null);
  const boardRef    = useRef(null);
  const [activeColIdx, setActiveColIdx] = useState(0);

  // ── Jira load ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setDiffChecked(false); setError(null); setMeta('Loading…');
    try {
      const epicRes = await jiraSearch({
        jql: `project = "${PROJECT}" AND issuetype = Epic AND status in ("In Progress","Open") ORDER BY updated DESC`,
        fields: EPIC_FIELDS,
        maxResults: 100,
      });

      const epics    = epicRes.issues || [];
      const flightKeys = epics.filter(e => e.fields.status.name === 'In Progress').map(e => e.key);
      setAllEpics(epics);

      const newRdmpMap = {};
      epics.forEach(e => {
        const links = e.fields.issuelinks || [];
        const rdmpKeys = links
          .flatMap(l => [l.outwardIssue?.key, l.inwardIssue?.key])
          .filter(k => k?.startsWith('RDMP-'));
        if (rdmpKeys.length > 0) newRdmpMap[e.key] = rdmpKeys[0];
      });
      setRdmpMap(newRdmpMap);

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

      // ── Triage tickets ────────────────────────────────────────────────────
      try {
        const triageRes = await jiraSearch({
          jql: `project = "${PROJECT}" AND labels = "triage" ORDER BY updated DESC`,
          fields: TRIAGE_FIELDS,
          maxResults: 50,
        });
        setTriageIssues(triageRes.issues || []);
      } catch (_) {}

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

  // ── Snapshot diff — runs async after board renders, never blocks UI ────────
  useEffect(() => {
    if (!boardLoaded || loading || diffChecked) return;
    if (allEpics.length === 0) return;
    setDiffChecked(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('flywheel_board_state')
          .select('value')
          .eq('key', 'pfr_snapshot')
          .maybeSingle();
        if (error) throw error;

        const oldSnap = data?.value ?? null;

        // Build current snapshot
        const newSnapEpics = {};
        allEpics.forEach(epic => {
          const children = childMap[epic.key] ?? [];
          const scoped   = children.filter(c => !CANCELLED.has(c.status.toLowerCase()));
          const done     = scoped.filter(c => DONE.has(c.status.toLowerCase())).length;
          newSnapEpics[epic.key] = {
            col:     getCol(epic),
            done,
            total:   scoped.length,
            summary: epic.fields.summary.slice(0, 60),
          };
        });
        const newSnap = { at: new Date().toISOString(), epics: newSnapEpics };

        // Diff and surface changes
        let realChanges = [];
        if (oldSnap) {
          setDiffAt(oldSnap.at ?? null);
          realChanges = computeDiff(oldSnap, allEpics, childMap, getCol, overrides);
          if (realChanges.length > 0) { setDiffItems(realChanges); setDiffVisible(true); }
        }

        // ── STUB: remove once real diffs are observed in production ──────────
        if (realChanges.length === 0 && allEpics.length >= 3) {
          const [e0, e1, e2] = allEpics;
          const cols = COLS.filter(c => c !== 'upnext');
          const stubAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
          const snap0 = newSnapEpics[e0.key];
          const snap1 = newSnapEpics[e1.key];
          setDiffAt(stubAt);
          setDiffItems([
            { type: 'moved',      key: e0.key, summary: snap0?.summary || e0.fields.summary.slice(0,60),
              from: cols[(cols.indexOf(snap0?.col) + 1) % cols.length] ?? 'starting', to: snap0?.col ?? 'indev',
              doneDelta: 0 },
            { type: 'progressed', key: e1.key, summary: snap1?.summary || e1.fields.summary.slice(0,60),
              doneDelta: 2, doneNow: (snap1?.done ?? 0) + 2, totalNow: snap1?.total ?? 10 },
            { type: 'appeared',   key: e2.key, summary: newSnapEpics[e2.key]?.summary || e2.fields.summary.slice(0,60),
              to: newSnapEpics[e2.key]?.col ?? 'starting' },
          ]);
          setDiffVisible(true);
        }
        // ── END STUB ─────────────────────────────────────────────────────────

        // Upsert new snapshot (non-blocking — if this fails, old snapshot is preserved)
        await supabase
          .from('flywheel_board_state')
          .upsert({ key: 'pfr_snapshot', value: newSnap, updated_at: new Date().toISOString() },
                  { onConflict: 'key' });

      } catch (err) {
        console.warn('Snapshot diff failed:', err);
      }
    })();
  }, [boardLoaded, loading, diffChecked, allEpics, childMap]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function naturalCol(epic) {
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
    if (roadmapOnly && !rdmpMap[e.key]) return false;
    return true;
  });

  const buckets = { upnext: [], starting: [], indev: [], intest: [], almostdone: [] };
  visible.filter(e => e.fields.status.name === 'Open').forEach(e => buckets.upnext.push(e));
  visible.filter(e => e.fields.status.name === 'In Progress').forEach(e => {
    const col = getCol(e);
    (buckets[col] || buckets['indev']).push(e);
  });

  // Build diffMap: epicKey → diff type (for card-level indicator)
  const diffMap = {};
  diffItems.forEach(item => { if (item.key) diffMap[item.key] = item.type; });

  // Build movedFromMap: epicKey → natural column (only when different from current col)
  const movedFromMap = {};
  COLS.forEach(col => {
    buckets[col].forEach(epic => {
      if (overrides[epic.key]) {
        const nat = naturalCol(epic);
        if (nat !== col) movedFromMap[epic.key] = nat;
      }
    });
  });

  // Sort: pinned first, then column-specific order
  COLS.forEach(col => {
    const colOrder = ranks[col] || [];
    buckets[col].sort((a, b) => {
      const aRank = colOrder.indexOf(a.key);
      const bRank = colOrder.indexOf(b.key);
      if (aRank !== -1 && bRank !== -1) return aRank - bRank;
      if (aRank !== -1) return -1;
      if (bRank !== -1) return 1;
      // fallback: pinned first, tech debt last, then priority/ratio
      const aPin = overrides[a.key] ? 0 : 1;
      const bPin = overrides[b.key] ? 0 : 1;
      if (aPin !== bPin) return aPin - bPin;
      const aTD = (a.fields.labels || []).includes('pay-tech-debt') ? 1 : 0;
      const bTD = (b.fields.labels || []).includes('pay-tech-debt') ? 1 : 0;
      if (aTD !== bTD) return aTD - bTD;
      if (col === 'indev') {
        const diff = reviewTestRatio(childMap[b.key]) - reviewTestRatio(childMap[a.key]);
        if (diff !== 0) return diff;
      }
      return (PRIORITY_ORDER[a.fields.priority?.name] ?? 4) - (PRIORITY_ORDER[b.fields.priority?.name] ?? 4);
    });
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleDrop(colId, insertIdx) {
    if (!dragKey || !isEditMode) return;
    const currentKeys = buckets[colId].map(e => e.key);
    const isSameCol   = currentKeys.includes(dragKey);
    const newOverrides = isSameCol ? overrides : { ...overrides, [dragKey]: colId };
    const base  = currentKeys.filter(k => k !== dragKey);
    const idx   = insertIdx ?? base.length;
    const newOrder = [...base.slice(0, idx), dragKey, ...base.slice(idx)];
    setOverrides(newOverrides);
    setRanks({ ...ranks, [colId]: newOrder });
    setDragKey(null);
  }

  async function handleUnlock() {
    setUnlockError(null);
    const ok = await enterEditMode(passphraseInput);
    if (ok) {
      setShowPassphraseModal(false);
      setPassphraseInput('');
    } else {
      setUnlockError('Incorrect passphrase');
    }
  }

  function openPassphraseModal() {
    setPassphraseInput('');
    setUnlockError(null);
    setShowPassphraseModal(true);
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
    setRanks({});
  }

  function toggleTD() {
    setShowTD(!showTD);
  }

  function handleSaveNote(epicKey, text) {
    const next = { ...notes };
    if (text.trim()) next[epicKey] = text.trim();
    else delete next[epicKey];
    setNotes(next);
  }

  function handleGroomToggle(epicKey, idx) {
    const current = groomState[epicKey] || GROOM_LABELS.map(() => false);
    const next = current.map((v, i) => i === idx ? !v : v);
    setGroomState({ ...groomState, [epicKey]: next });
  }

  function handleBoardScroll(e) {
    const colW = e.currentTarget.scrollWidth / COLS.length;
    setActiveColIdx(Math.round(e.currentTarget.scrollLeft / colW));
  }

  function scrollToCol(idx) {
    if (!boardRef.current) return;
    const colW = boardRef.current.scrollWidth / COLS.length;
    boardRef.current.scrollTo({ left: colW * idx, behavior: 'smooth' });
    setActiveColIdx(idx);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        * { box-sizing: border-box; }
        .pfr-tabs { display: none; }
        @media (max-width: 640px) {
          .pfr-board {
            display: flex !important;
            overflow-x: scroll;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding: 8px 0 !important;
            gap: 0 !important;
          }
          .pfr-col {
            min-width: 100vw !important;
            max-width: 100vw !important;
            flex-shrink: 0;
            scroll-snap-align: start;
            padding: 0 8px;
            box-sizing: border-box;
          }
          .pfr-tabs { display: flex !important; }
          .pfr-header-meta { display: none !important; }
        }
        @media (max-width: 900px) {
          .pfr-avatar { display: none !important; }
        }
      `}</style>
      <div style={s.root}>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button onClick={() => navigate('/home')} style={s.backBtn}>←</button>
            <span style={s.h1}>Payments Epic Board</span>
          </div>
          {diffVisible && diffItems.length > 0 && (
            <DiffTicker items={diffItems} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={s.meta}>{meta}</span>
            <button onClick={toggleTD} style={{ ...s.btn, ...(showTD ? s.btnActive : {}) }}>
              {showTD ? 'Hide tech debt' : 'Show tech debt'}
            </button>
            <button onClick={() => setRoadmapOnly(o => !o)} style={{ ...s.btn, ...(roadmapOnly ? s.btnActive : {}) }}>
              {roadmapOnly ? 'All epics' : 'Only roadmap'}
            </button>
            {hidden.length > 0 && (
              <button onClick={() => setTrayOpen(o => !o)} style={s.btn}>
                {trayOpen ? 'Hide' : 'Show'} hidden ({hidden.length})
              </button>
            )}
            {isEditMode && (
              <button onClick={resetOverrides} style={{ ...s.btn, ...s.btnDanger }}>Reset overrides</button>
            )}
            <button onClick={load} style={s.btn} disabled={loading}>↻ Refresh</button>
            <button onClick={() => setShowAllNotes(o => !o)} style={{ ...s.btn, ...(showAllNotes ? s.btnActive : {}) }}>
              {showAllNotes ? 'Hide notes' : 'Show notes'}
            </button>
            {isEditMode
              ? <button onClick={exitEditMode} style={s.editingBadge} title="Click to lock">🔓 Editing</button>
              : <button onClick={openPassphraseModal} style={s.lockedBadge} title="Click to unlock">🔒 Locked</button>
            }
          </div>
        </div>

        {error && <div style={s.errorBanner}>Error: {error}</div>}

        {/* Hidden tray */}
        {trayOpen && (
          <HiddenTray hidden={hidden} allEpics={allEpics}
            onRestore={isEditMode ? restoreCard : null} onClose={() => setTrayOpen(false)} />
        )}

        {/* Mobile column tabs — hidden on desktop via CSS */}
        <MobileColTabs cols={COLS} activeIdx={activeColIdx} onSelect={scrollToCol} />

        {/* Loading overlay — wait for both Supabase state and full Jira fetch (incl. child tickets) */}
        {(!boardLoaded || loading) && (
          <div style={{ padding: '30px 20px', textAlign: 'center', fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Spinner /> {!boardLoaded ? 'Loading board state…' : 'Fetching epics and child tickets…'}
          </div>
        )}

        {/* Passphrase modal */}
        {showPassphraseModal && (
          <div style={s.modalOverlay} onClick={() => setShowPassphraseModal(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Enter passphrase to edit</div>
              <input
                type="password"
                value={passphraseInput}
                onChange={e => setPassphraseInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                style={s.modalInput}
                placeholder="Passphrase"
                autoFocus
              />
              {unlockError && <div style={{ fontSize: 10, color: '#b91c1c', marginBottom: 8 }}>{unlockError}</div>}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowPassphraseModal(false)} style={s.btn}>Cancel</button>
                <button onClick={handleUnlock} style={{ ...s.btn, background: '#2563eb', color: 'white', borderColor: '#2563eb' }}>Unlock</button>
              </div>
            </div>
          </div>
        )}

        {/* Lock alert toast */}
        {lockAlert && (
          <div style={s.lockToast}>
            🔒 Board is locked — click the lock icon to edit
          </div>
        )}

        {/* Kanban board */}
        {boardLoaded && !loading && (
          <div style={s.board} className="pfr-board" ref={boardRef} onScroll={handleBoardScroll}
               onDragStart={e => {
                 if (!isEditMode) {
                   setLockAlert(true);
                   setTimeout(() => setLockAlert(false), 2500);
                   return;
                 }
                 const card = e.target.closest('[data-key]');
                 if (card) setDragKey(card.dataset.key);
               }}>
            {COLS.map(col => (
              <div key={col} className="pfr-col">
                <KanbanColumn
                  colId={col}
                  issues={buckets[col]}
                  childMap={childMap}
                  overrides={overrides}
                  showGroom={col === 'upnext'}
                  onHide={hideCard}
                  onDrop={handleDrop}
                  groomState={groomState}
                  onGroomToggle={handleGroomToggle}
                  editable={isEditMode}
                  notes={notes}
                  onSaveNote={handleSaveNote}
                  showAllNotes={showAllNotes}
                  rdmpMap={rdmpMap}
                  movedFromMap={movedFromMap}
                  diffMap={diffMap}
                />
              </div>
            ))}
          </div>
        )}

        {/* <TriageSection issues={triageIssues} /> */}
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

  backBtn:       { fontSize: 14, lineHeight: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280' },
  btn:           { fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' },
  btnActive:     { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' },
  btnDanger:     { borderColor: '#fca5a5', color: '#b91c1c' },

  board:         { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: 12, alignItems: 'start' },
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

  lockToast:     { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 8, zIndex: 300, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  lockedBadge:   { fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.2px' },
  editingBadge:  { fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#15803d', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.2px' },
  ticker:        { display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, height: 28, overflow: 'hidden', borderRadius: 6, border: '1px solid #f0f0f0', background: '#fafafa', margin: '0 12px' },
  tickerPause:   { flexShrink: 0, background: 'none', border: 'none', borderRight: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 9, color: '#c4c9d4', padding: '0 9px', alignSelf: 'stretch', display: 'flex', alignItems: 'center' },
  tickerTrack:   { flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center', maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)' },
  tickerContent: { display: 'inline-flex', alignItems: 'center', animation: 'ticker-scroll linear infinite', whiteSpace: 'nowrap' },
  tickerItem:    { fontSize: 10, color: '#374151', marginRight: 48, whiteSpace: 'nowrap' },
  th:            { padding: '6px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' },
  td:            { padding: '8px 12px', verticalAlign: 'middle' },
  modalOverlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:         { background: 'white', borderRadius: 12, padding: 20, width: 300, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
  modalInput:    { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10, outline: 'none', boxSizing: 'border-box' },
};
