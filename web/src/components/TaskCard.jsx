import React from 'react';

const srcColors = { google: '#4285F4', slack: '#4A154B', manual: '#6b7280', outlook: '#0078D4', asana: '#F06A6A' };
const srcLabels = { google: 'Google', slack: 'Slack', manual: 'Manual', outlook: 'Outlook', asana: 'Asana' };
const priColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const priBg   = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };

function isOverdue(due) {
  if (!due) return false;
  return new Date(due + 'T00:00:00') < new Date(new Date().toDateString());
}
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const overdue = !task.done && isOverdue(task.due);
  return (
    <div style={{
      background: task.done ? '#f9fafb' : '#fff',
      border: `1px solid ${overdue ? '#fca5a5' : '#e5e7eb'}`,
      borderLeft: `4px solid ${task.done ? '#d1d5db' : priColors[task.priority] || '#6b7280'}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 10,
      opacity: task.done ? 0.65 : 1,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        style={{ marginTop: 3, cursor: 'pointer', accentColor: '#6366f1', width: 16, height: 16, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: srcColors[task.source] || '#9ca3af',
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{
            fontSize: 14, fontWeight: 500,
            textDecoration: task.done ? 'line-through' : 'none',
            color: task.done ? '#9ca3af' : '#111827',
            flex: 1,
          }}>{task.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: priBg[task.priority], color: priColors[task.priority],
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
          }}>{task.priority}</span>
          <span style={{
            background: task.category === 'daily' ? '#eff6ff' : '#f5f3ff',
            color: task.category === 'daily' ? '#3b82f6' : '#7c3aed',
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
          }}>{task.category}</span>
          {task.due && (
            <span style={{ fontSize: 12, color: overdue ? '#ef4444' : '#6b7280', fontWeight: overdue ? 600 : 400 }}>
              {overdue ? '⚠ ' : '📅 '}{fmtDate(task.due)}{overdue ? ' — Overdue' : ''}
            </span>
          )}
          <span style={{ fontSize: 12, color: srcColors[task.source] || '#6b7280', fontWeight: 500 }}>
            via {srcLabels[task.source] || task.source}
          </span>
          {task.notes && (
            <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>"{task.notes}"</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={() => onEdit(task)} title="Edit"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 5px', opacity: 0.6 }}>✏️</button>
        <button onClick={() => onDelete(task.id)} title="Delete"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 5px', opacity: 0.6 }}>🗑</button>
      </div>
    </div>
  );
}
