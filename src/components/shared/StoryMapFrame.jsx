import React, { useState } from 'react';
import { StoryMapContext } from './StoryMapContext';

const BASE_URL = 'https://billingplatform.atlassian.net/browse';

const f = {
  wrap: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    borderBottom: '1px solid #e4e4e4',
    background: '#f9fafb',
  },
  header: {
    padding: '10px 6rem',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '0.5px solid #e4e4e4',
  },
  epicChip: {
    display: 'inline-block', fontSize: '10px', fontWeight: 700,
    padding: '2px 7px', borderRadius: '3px',
    background: '#E8F0FE', color: '#1a56b0', letterSpacing: '0.03em',
    flexShrink: 0,
  },
  ticketLink: {
    fontSize: '11px', color: '#1a56b0', fontWeight: 600,
    textDecoration: 'none', fontFamily: 'monospace', flexShrink: 0,
  },
  epicTitle: {
    fontSize: '13px', fontWeight: 600, color: '#1a1a1a', flexShrink: 0,
  },
  epicDesc: {
    fontSize: '12px', color: '#999', flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#aaa', fontSize: '13px', padding: '0 2px', lineHeight: 1,
    flexShrink: 0,
  },
  cards: {
    padding: '10px 6rem 12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
  },
};

// storyKey returns the value used for selection and hotspot matching.
// sort_order (1-N) is used when present; falls back to id for hardcoded data.
function storyKey(story) {
  return story.sort_order ?? story.id;
}

function StoryCard({ story, isSelected, onSelect, onUpdate }) {
  const key = storyKey(story);

  function handleTitleBlur(e) {
    const next = e.currentTarget.textContent.trim();
    if (next && next !== story.title) onUpdate?.(key, { title: next });
  }

  function handleDescBlur(e) {
    const next = e.currentTarget.textContent.trim();
    if (next && next !== story.description) onUpdate?.(key, { description: next });
  }

  return (
    <div
      onClick={() => onSelect(key)}
      style={{
        padding: '9px 11px',
        borderRadius: '6px',
        border: isSelected ? '1px solid #1a56b0' : '1px solid #e0e0e0',
        background: isSelected ? '#EBF3FC' : '#fff',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0,
          background: isSelected ? '#1a56b0' : '#E8F0FE',
          color: isSelected ? '#fff' : '#1a56b0',
          fontSize: '9px', fontWeight: 700,
          border: '1px solid #b8d0f5',
          boxShadow: isSelected ? '0 0 0 3px rgba(251,191,36,0.7)' : '0 0 0 2px rgba(251,191,36,0.45)',
          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        }}>
          {key}
        </span>
        <a
          href={`${BASE_URL}/${story.ticket_key ?? story.ticket}`}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '10px', color: '#1a56b0', textDecoration: 'none', fontFamily: 'monospace', fontWeight: 600 }}
        >
          {story.ticket_key ?? story.ticket} ↗
        </a>
      </div>
      <div
        contentEditable={!!onUpdate}
        suppressContentEditableWarning
        onBlur={onUpdate ? handleTitleBlur : undefined}
        onClick={e => onUpdate && e.stopPropagation()}
        style={{
          fontSize: '12px', fontWeight: 500, lineHeight: 1.4,
          color: isSelected ? '#1a1a1a' : '#444',
          outline: 'none',
        }}
      >
        {story.title}
      </div>
      {onUpdate && story.description && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={handleDescBlur}
          onClick={e => e.stopPropagation()}
          style={{
            marginTop: '4px', fontSize: '11px', color: '#888', lineHeight: 1.5,
            outline: 'none',
          }}
        >
          {story.description}
        </div>
      )}
    </div>
  );
}

export default function StoryMapFrame({ epic, stories, children, onUpdateStory, loading }) {
  const [selectedStory, setSelectedStory] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  function handleSelect(key) {
    setSelectedStory(prev => prev === key ? null : key);
  }

  const epicTicket = epic?.ticket_key ?? epic?.ticket;
  const epicTitle = epic?.title ?? '…';
  const epicDesc = epic?.description ?? '';

  return (
    <StoryMapContext.Provider value={{ selectedStory, setSelectedStory: handleSelect }}>
      <div style={f.wrap}>
        {/* Epic header */}
        <div style={f.header}>
          <span style={f.epicChip}>EPIC</span>
          {epicTicket && (
            <a href={`${BASE_URL}/${epicTicket}`} target="_blank" rel="noreferrer" style={f.ticketLink}>
              {epicTicket}
            </a>
          )}
          <span style={{ color: '#ccc', fontSize: '12px' }}>·</span>
          <span style={f.epicTitle}>{epicTitle}</span>
          {!loading && <span style={f.epicDesc}>— {epicDesc}</span>}
          {loading && <span style={{ ...f.epicDesc, color: '#bbb', fontStyle: 'italic' }}>Loading…</span>}
          <button style={f.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '▾' : '▴'}
          </button>
        </div>

        {/* Story cards */}
        {!collapsed && (
          <div style={f.cards}>
            {stories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                isSelected={selectedStory === storyKey(story)}
                onSelect={handleSelect}
                onUpdate={onUpdateStory}
              />
            ))}
          </div>
        )}
      </div>

      {children}
    </StoryMapContext.Provider>
  );
}
