import React, { useState } from 'react';

const paData = [
  { date: '26/12/2025', id: '00304991', recv: -56.12, applied: -56.12, account: 'NZC - TMC Trailers CHC', allocs: [{ aid: '45426481', inv: '690795', amt: -56.12, date: '26/12/2025', bp: '202512', account: 'NZC - TMC Trailers CHC' }] },
  { date: '26/12/2025', id: '00304812', recv: -30.56, applied: -30.56, account: 'NZC - TMC Trailers CHC', allocs: [{ aid: '45426274', inv: '704789', amt: -30.56, date: '28/12/2025', bp: '202512', account: 'NZC - TMC Trailers CHC' }] },
  { date: '24/12/2025', id: '00304800', recv: 100.03, applied: 100.03, account: 'NZC - TMC Trailers CHC', allocs: [
    { aid: '45419832', inv: '609128', amt: 60.03, date: '24/12/2025', bp: '202512', account: 'NZC - TMC Trailers CHC' },
    { aid: '45419791', inv: '683267', amt: 40.00, date: '27/12/2025', bp: '202601', account: 'NZC - TMC Trailers AKL' },
  ] },
  { date: '24/12/2025', id: '00304755', recv: 100.03, applied: 100.03, account: 'NZC - TMC Trailers AKL', allocs: [{ aid: '45419651', inv: '756655', amt: 100.03, date: '24/12/2025', bp: '202512', account: 'NZC - TMC Trailers AKL' }] },
  { date: '16/12/2025', id: '00298441', recv: 56.12, applied: 56.12, account: 'NZC - TMC Trailers CHC', allocs: [{ aid: '45398204', inv: '701230', amt: 56.12, date: '16/12/2025', bp: '202511', account: 'NZC - TMC Trailers CHC' }] },
  { date: '16/12/2025', id: '00298430', recv: 30.56, applied: 30.56, account: 'NZC - TMC Trailers WLG', allocs: [{ aid: '45397986', inv: '698811', amt: 30.56, date: '19/12/2025', bp: '202511', account: 'NZC - TMC Trailers WLG' }] },
  { date: '12/12/2025', id: '00295610', recv: 215.40, applied: 215.40, account: 'NZC - TMC Trailers WLG', allocs: [
    { aid: '45381002', inv: '711003', amt: 85.40, date: '12/12/2025', bp: '202512', account: 'NZC - TMC Trailers WLG' },
    { aid: '45381003', inv: '698200', amt: 90.00, date: '15/12/2025', bp: '202511', account: 'NZC - TMC Trailers AKL' },
    { aid: '45381004', inv: '703450', amt: 40.00, date: '15/12/2025', bp: '202511', account: 'NZC - TMC Trailers CHC' },
  ] },
  { date: '09/12/2025', id: '00293880', recv: 180.00, applied: 142.75, account: 'NZC - TMC Trailers AKL', allocs: [
    { aid: '45371540', inv: '695100', amt: 75.00, date: '09/12/2025', bp: '202511', account: 'NZC - TMC Trailers AKL' },
    { aid: '45371541', inv: '701880', amt: 67.75, date: '11/12/2025', bp: '202511', account: 'NZC - TMC Trailers WLG' },
  ] },
  { date: '05/12/2025', id: '00291900', recv: 10.77, applied: 0, account: 'NZC - TMC Trailers CHC', allocs: [] },
  { date: '05/12/2025', id: '00291847', recv: 2.59, applied: 2.59, account: 'NZC - TMC Trailers CHC', allocs: [{ aid: '45361349', inv: '690795', amt: 2.59, date: '05/12/2025', bp: '202511', account: 'NZC - TMC Trailers CHC' }] },
  { date: '05/12/2025', id: '00291831', recv: 50.80, applied: 50.80, account: 'NZC - TMC Trailers AKL', allocs: [{ aid: '45361187', inv: '704789', amt: 50.80, date: '06/12/2025', bp: '202511', account: 'NZC - TMC Trailers AKL' }] },
  { date: '05/12/2025', id: '00291802', recv: 39.44, applied: 25.44, account: 'NZC - TMC Trailers CHC', allocs: [{ aid: '45360943', inv: '609128', amt: 25.44, date: '05/12/2025', bp: '202511', account: 'NZC - TMC Trailers CHC' }] },
];

const invData = [
  { date: '05/12/2025', id: '45361349', bp: '202511', amount: 2.59, allocated: 2.59, lockbox: '00291847' },
  { date: '05/12/2025', id: '45361187', bp: '202511', amount: 50.80, allocated: 50.80, lockbox: '00291831' },
  { date: '05/12/2025', id: '45360943', bp: '202511', amount: 39.44, allocated: 25.44, lockbox: '00291802' },
  { date: '16/12/2025', id: '45398204', bp: '202511', amount: 56.12, allocated: 56.12, lockbox: '00304112' },
];

const agingBuckets = [
  { label: 'Current', amount: '($10.77)', count: 'Credit balance', style: 'normal', amtColor: '#A32D2D' },
  { label: '0 – 30 days', amount: '$0.00', count: '0 invoices', style: 'normal', amtColor: '#1a1a1a' },
  { label: '31 – 60 days', amount: '$0.00', count: '0 invoices', style: 'normal', amtColor: '#1a1a1a' },
  { label: '61 – 90 days', amount: '$0.00', count: '0 invoices', style: 'normal', amtColor: '#1a1a1a' },
  { label: '91 – 120 days', amount: '$64.30', count: '2 invoices', style: 'warn', amtColor: '#633806' },
  { label: 'Over 120 days', amount: '$86.68', count: '3 invoices', style: 'severe', amtColor: '#791F1F' },
];

const s = {
  page: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#fff', padding: '1.5rem', color: '#1a1a1a', fontSize: '13px' },
  secHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  secIcon: { width: '14px', height: '14px', background: '#d0e8f7', borderRadius: '3px', flexShrink: 0 },
  secTitle: { fontSize: '15px', fontWeight: 500, color: '#1a1a1a' },
  secActions: { marginLeft: 'auto', display: 'flex', gap: '6px' },
  btn: { fontSize: '12px', padding: '4px 10px', border: '0.5px solid #d4d4d4', borderRadius: '5px', background: 'transparent', color: '#666', cursor: 'pointer' },
  section: { marginBottom: '2rem' },
  agingRow: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px', marginBottom: '20px' },
  ab: { borderRadius: '5px', padding: '10px 12px', border: '0.5px solid #e0e0e0', background: '#f7f7f7' },
  abWarn: { borderRadius: '5px', padding: '10px 12px', border: '0.5px solid #FAC775', background: '#FAEEDA' },
  abSevere: { borderRadius: '5px', padding: '10px 12px', border: '0.5px solid #F09595', background: '#FCEBEB' },
  abLabel: { fontSize: '11px', color: '#888', marginBottom: '3px' },
  abLabelWarn: { fontSize: '11px', color: '#854F0B', marginBottom: '3px' },
  abLabelSevere: { fontSize: '11px', color: '#A32D2D', marginBottom: '3px' },
  abAmt: { fontSize: '17px', fontWeight: 500 },
  abCount: { fontSize: '11px', color: '#aaa', marginTop: '2px' },
  abCountWarn: { fontSize: '11px', color: '#854F0B', marginTop: '2px' },
  abCountSevere: { fontSize: '11px', color: '#A32D2D', marginTop: '2px' },
  tblWrap: { border: '0.5px solid #e0e0e0', borderRadius: '5px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '13px' },
  th: { fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '7px 10px', background: '#f7f7f7', borderBottom: '0.5px solid #e0e0e0', textAlign: 'left' },
  thR: { fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '7px 10px', background: '#f7f7f7', borderBottom: '0.5px solid #e0e0e0', textAlign: 'right' },
  td: { padding: '9px 10px', borderBottom: '0.5px solid #e8e8e8', color: '#1a1a1a', verticalAlign: 'middle' },
  tdR: { padding: '9px 10px', borderBottom: '0.5px solid #e8e8e8', color: '#1a1a1a', verticalAlign: 'middle', textAlign: 'right' },
  expandBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid #bbb', borderRadius: '3px', fontSize: '13px', lineHeight: 1, color: '#666', background: '#fff', cursor: 'pointer', userSelect: 'none' },
  expandBtnOpen: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid #bbb', borderRadius: '3px', fontSize: '13px', lineHeight: 1, color: '#333', background: '#f0f0f0', cursor: 'pointer', userSelect: 'none' },
  noExpand: { width: '16px', height: '16px', display: 'inline-block' },
  link: { color: '#1a6fa8', fontSize: '12px', textDecoration: 'none' },
  linkOrigin: { color: '#1a6fa8', fontSize: '12px', textDecoration: 'none', fontWeight: 500 },
  bpTag: { display: 'inline-block', fontSize: '12px', background: '#EEF2F7', color: '#4A6080', borderRadius: '3px', padding: '2px 6px', fontVariantNumeric: 'tabular-nums' },
  typeLbx: { display: 'inline-block', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: '#E8F0FE', color: '#1a56b0', letterSpacing: '0.03em', marginRight: '5px', verticalAlign: 'middle' },
  typePmt: { display: 'inline-block', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: '#E8F5E9', color: '#2E7D32', letterSpacing: '0.03em', marginRight: '5px', verticalAlign: 'middle' },
  typeCrd: { display: 'inline-block', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: '#EEEDFE', color: '#3C3489', letterSpacing: '0.03em', marginRight: '5px', verticalAlign: 'middle' },
  pag: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0 0', fontSize: '12px', color: '#888' },
  pbtn: { padding: '3px 8px', border: '0.5px solid #d4d4d4', borderRadius: '5px', background: 'transparent', cursor: 'pointer', color: '#1a1a1a', fontSize: '12px' },
  pbtnOn: { padding: '3px 8px', border: '0.5px solid #85B7EB', borderRadius: '5px', background: '#E6F1FB', cursor: 'pointer', color: '#185FA5', fontSize: '12px' },
  divider: { border: 'none', borderTop: '0.5px solid #e0e0e0', margin: '2rem 0' },
};

function formatAmt(n) {
  if (Math.abs(n) < 0.005) return '—';
  return n < 0 ? `($${Math.abs(n).toFixed(2)})` : `$${n.toFixed(2)}`;
}

function Badge({ recv, applied }) {
  const u = +(recv - applied).toFixed(2);
  const base = { display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 500, whiteSpace: 'nowrap' };
  if (recv < 0) return <span style={{ ...base, background: '#EEEDFE', color: '#3C3489' }}>Credit</span>;
  if (Math.abs(u) < 0.005) return <span style={{ ...base, background: '#EAF3DE', color: '#3B6D11' }}>Fully allocated</span>;
  if (applied === 0) return <span style={{ ...base, background: '#FAECE7', color: '#993C1D' }}>Unallocated</span>;
  return <span style={{ ...base, background: '#FAEEDA', color: '#854F0B' }}>Partially allocated</span>;
}

function AgingBucket({ label, amount, count, variant, amtColor }) {
  const boxStyle = variant === 'warn' ? s.abWarn : variant === 'severe' ? s.abSevere : s.ab;
  const labelStyle = variant === 'warn' ? s.abLabelWarn : variant === 'severe' ? s.abLabelSevere : s.abLabel;
  const countStyle = variant === 'warn' ? s.abCountWarn : variant === 'severe' ? s.abCountSevere : s.abCount;
  return (
    <div style={boxStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...s.abAmt, color: amtColor }}>{amount}</div>
      <div style={countStyle}>{count}</div>
    </div>
  );
}

function PARow({ row, isOpen, onToggle }) {
  const u = +(row.recv - row.applied).toFixed(2);
  const hasAllocs = row.allocs.length > 0 || u > 0.005;
  const bps = [...new Set(row.allocs.map(a => a.bp))];
  const totalColor = row.recv < 0 ? '#A32D2D' : '#27500A';

  const [hovered, setHovered] = useState(false);

  return (
    <>
      <tr
        onClick={() => onToggle(row.id)}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td style={{ ...s.td, padding: '9px 8px', textAlign: 'center', background: hovered ? '#f7f7f7' : undefined }}>
          {hasAllocs
            ? <span style={isOpen ? s.expandBtnOpen : s.expandBtn}>{isOpen ? '−' : '+'}</span>
            : <span style={s.noExpand} />}
        </td>
        <td style={{ ...s.td, fontSize: '12px', color: '#666', background: hovered ? '#f7f7f7' : undefined }}>{row.date}</td>
        <td style={{ ...s.td, background: hovered ? '#f7f7f7' : undefined }}>
          {bps.length > 1
            ? <span style={{ ...s.bpTag, letterSpacing: '0.1em' }}>···</span>
            : bps.length === 1 && <span style={s.bpTag}>{bps[0]}</span>}
        </td>
        <td style={{ ...s.td, background: hovered ? '#f7f7f7' : undefined }}><Badge recv={row.recv} applied={row.applied} /></td>
        <td style={{ ...s.td, fontSize: '12px', background: hovered ? '#f7f7f7' : undefined }}>{row.account}</td>
        <td style={{ ...s.td, background: hovered ? '#f7f7f7' : undefined }}>
          <span style={row.recv < 0 ? s.typeCrd : s.typeLbx}>{row.recv < 0 ? 'CRD' : 'LBX'}</span>
          <a style={s.linkOrigin} href="#">{row.id}</a>
        </td>
        <td style={{ ...s.tdR, color: totalColor, fontWeight: 500, background: hovered ? '#f7f7f7' : undefined }}>{formatAmt(row.recv)}</td>
        <td style={{ ...s.tdR, color: '#666', background: hovered ? '#f7f7f7' : undefined }}>{row.applied === 0 ? '—' : formatAmt(row.applied)}</td>
        <td style={{ ...s.tdR, color: u > 0.005 ? '#993C1D' : '#aaa', fontWeight: u > 0.005 ? 500 : 400, background: hovered ? '#f7f7f7' : undefined }}>{u > 0.005 ? formatAmt(u) : '—'}</td>
      </tr>
      {isOpen && hasAllocs && (
        <tr>
          <td colSpan={9} style={{ padding: 0, borderBottom: '0.5px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28px' }} /><col style={{ width: '96px' }} /><col style={{ width: '76px' }} />
                <col style={{ width: '124px' }} /><col style={{ width: '130px' }} /><col style={{ width: '110px' }} />
                <col style={{ width: '90px' }} /><col style={{ width: '86px' }} /><col style={{ width: '86px' }} />
              </colgroup>
              <tbody>
                {row.allocs.map(a => {
                  const diff = a.account !== row.account;
                  return (
                    <tr key={a.aid} style={{ background: diff ? '#FEFAF4' : '#f7f7f7' }}>
                      <td style={{ ...s.td, borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8', borderLeft: diff ? '3px solid #E8A020' : undefined, background: diff ? '#FEFAF4' : '#f7f7f7' }} />
                      <td style={{ ...s.td, fontSize: '12px', color: '#666', paddingLeft: '16px', background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }}>{a.date}</td>
                      <td style={{ ...s.td, background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }}><span style={s.bpTag}>{a.bp}</span></td>
                      <td style={{ ...s.td, background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }}><div style={{ fontSize: '11px', color: '#aaa' }}>Inv #{a.inv}</div></td>
                      <td style={{ ...s.td, fontSize: '12px', color: diff ? '#854F0B' : '#aaa', fontWeight: diff ? 500 : 400, background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }}>{diff ? a.account : '—'}</td>
                      <td style={{ ...s.td, paddingLeft: '16px', background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }}>
                        <span style={s.typePmt}>PMT</span>
                        <a style={s.link} href="#">{a.aid}</a>
                      </td>
                      <td style={{ ...s.td, background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }} />
                      <td style={{ ...s.tdR, fontSize: '12px', color: '#666', background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }}>{formatAmt(a.amt)}</td>
                      <td style={{ ...s.td, background: diff ? '#FEFAF4' : '#f7f7f7', borderBottom: diff ? '0.5px solid #F0D9B0' : '0.5px solid #e8e8e8' }} />
                    </tr>
                  );
                })}
                {u > 0.005 && (
                  <tr style={{ background: '#FFF8F6' }}>
                    <td style={{ ...s.td, background: '#FFF8F6' }} />
                    <td style={{ ...s.td, paddingLeft: '16px', fontSize: '12px', color: '#993C1D', background: '#FFF8F6' }}>—</td>
                    <td style={{ ...s.td, background: '#FFF8F6' }} />
                    <td style={{ ...s.td, fontSize: '11px', color: '#993C1D', background: '#FFF8F6' }}>No invoice yet</td>
                    <td style={{ ...s.td, background: '#FFF8F6' }} />
                    <td style={{ ...s.td, background: '#FFF8F6' }} />
                    <td style={{ ...s.td, background: '#FFF8F6' }} />
                    <td style={{ ...s.tdR, fontSize: '12px', color: '#993C1D', fontWeight: 500, background: '#FFF8F6' }}>{formatAmt(u)}</td>
                    <td style={{ ...s.td, background: '#FFF8F6' }} />
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PaymentsAgingPrototype() {
  const [openRows, setOpenRows] = useState(new Set());
  const [page, setPage] = useState(1);

  function toggleRow(id) {
    setOpenRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={s.page}>
      {/* Payments and aging section */}
      <div style={s.section}>
        <div style={s.secHead}>
          <span style={s.secIcon} />
          <span style={s.secTitle}>Payments and aging</span>
        </div>

        <div style={s.agingRow}>
          {agingBuckets.map(b => (
            <AgingBucket key={b.label} label={b.label} amount={b.amount} count={b.count} variant={b.style} amtColor={b.amtColor} />
          ))}
        </div>

        <div style={s.tblWrap}>
          <table style={s.table}>
            <colgroup>
              <col style={{ width: '28px' }} /><col style={{ width: '96px' }} /><col style={{ width: '76px' }} />
              <col style={{ width: '124px' }} /><col style={{ width: '130px' }} /><col style={{ width: '110px' }} />
              <col style={{ width: '90px' }} /><col style={{ width: '86px' }} /><col style={{ width: '86px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={s.th}></th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Period</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Account</th>
                <th style={s.th}>ID</th>
                <th style={s.thR}>Total amount</th>
                <th style={s.thR}>Allocated</th>
                <th style={s.thR}>Unallocated</th>
              </tr>
            </thead>
            <tbody>
              {paData.map(row => (
                <PARow key={row.id} row={row} isOpen={openRows.has(row.id)} onToggle={toggleRow} />
              ))}
            </tbody>
          </table>
        </div>

        <div style={s.pag}>
          {[1, 2, 3].map(p => (
            <button key={p} style={p === page ? s.pbtnOn : s.pbtn} onClick={() => setPage(p)}>{p}</button>
          ))}
          <span style={{ marginLeft: '8px' }}>Showing 1 – 10 of 25</span>
        </div>
      </div>

      <hr style={s.divider} />

      {/* Payments section */}
      <div style={s.section}>
        <div style={s.secHead}>
          <span style={s.secIcon} />
          <span style={s.secTitle}>Payments</span>
          <div style={s.secActions}>
            <button style={s.btn}>&#8595; Export</button>
            <button style={s.btn}>•••</button>
          </div>
        </div>

        <div style={s.tblWrap}>
          <table style={s.table}>
            <colgroup>
              <col style={{ width: '96px' }} /><col style={{ width: '76px' }} /><col style={{ width: '110px' }} />
              <col style={{ width: '110px' }} /><col style={{ width: '110px' }} /><col style={{ width: '186px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Period</th>
                <th style={s.th}>ID</th>
                <th style={s.thR}>Amount</th>
                <th style={s.thR}>Allocated</th>
                <th style={s.th}>Lockbox record</th>
              </tr>
            </thead>
            <tbody>
              {invData.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ ...s.td, fontSize: '12px', color: '#666', borderBottom: i === invData.length - 1 ? 'none' : undefined }}>{p.date}</td>
                  <td style={{ ...s.td, borderBottom: i === invData.length - 1 ? 'none' : undefined }}><span style={s.bpTag}>{p.bp}</span></td>
                  <td style={{ ...s.td, borderBottom: i === invData.length - 1 ? 'none' : undefined }}>
                    <span style={s.typePmt}>PMT</span>
                    <a style={s.link} href="#">{p.id}</a>
                  </td>
                  <td style={{ ...s.tdR, color: '#27500A', fontWeight: 500, borderBottom: i === invData.length - 1 ? 'none' : undefined }}>${p.amount.toFixed(2)}</td>
                  <td style={{ ...s.tdR, color: '#666', borderBottom: i === invData.length - 1 ? 'none' : undefined }}>${p.allocated.toFixed(2)}</td>
                  <td style={{ ...s.td, borderBottom: i === invData.length - 1 ? 'none' : undefined }}>
                    <span style={s.typeLbx}>LBX</span>
                    <a style={s.linkOrigin} href="#">{p.lockbox}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
