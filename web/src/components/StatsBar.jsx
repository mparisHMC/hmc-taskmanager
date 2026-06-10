import React from 'react';

function isOverdue(due) {
  if (!due) return false;
  return new Date(due + 'T00:00:00') < new Date(new Date().toDateString());
}

export default function StatsBar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const high = tasks.filter(t => t.priority === 'high' && !t.done).length;
  const overdue = tasks.filter(t => !t.done && isOverdue(t.due)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const stats = [
    { label: 'Total',         value: total,            color: '#6366f1', bg: '#eef2ff' },
    { label: 'Done',          value: `${done} (${pct}%)`, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'High Priority', value: high,              color: '#ef4444', bg: '#fef2f2' },
    { label: 'Overdue',       value: overdue,           color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: s.bg, border: `1px solid ${s.color}22`,
          borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 100, textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
