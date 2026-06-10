import React, { useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: '#fff', color: '#111827',
};

export default function TaskModal({ task, defaultCategory, onSave, onClose }) {
  const [form, setForm] = useState(task || {
    title: '', priority: 'medium', due: today(),
    category: defaultCategory || 'daily', source: 'manual', notes: '', done: false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: 28, width: 460,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          {task?.id ? 'Edit Task' : 'New Task'}
        </h3>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          Task Title *
        </label>
        <input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="What needs to be done?"
          style={inputStyle}
          autoFocus
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              List
            </label>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
              <option value="daily">☀️ Daily</option>
              <option value="weekly">📅 Weekly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Priority
            </label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputStyle}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Due Date
            </label>
            <input type="date" value={form.due} onChange={e => set('due', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Source
            </label>
            <select value={form.source} onChange={e => set('source', e.target.value)} style={inputStyle}>
              <option value="manual">Manual</option>
              <option value="google">Google</option>
              <option value="slack">Slack</option>
              <option value="outlook">Outlook</option>
              <option value="asana">Asana</option>
            </select>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, marginTop: 12 }}>
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Optional notes or context..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            onClick={() => form.title.trim() && onSave(form)}
            disabled={!form.title.trim()}
            style={{
              background: form.title.trim() ? '#6366f1' : '#c7d2fe',
              color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px',
              fontWeight: 600, cursor: form.title.trim() ? 'pointer' : 'not-allowed', fontSize: 14,
            }}
          >
            {task?.id ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
