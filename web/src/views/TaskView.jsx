import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import StatsBar from '../components/StatsBar';

function ProgressBar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>
        <span>Progress</span><span>{pct}%</span>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: 99, height: 8 }}>
        <div style={{
          background: pct === 100 ? '#22c55e' : '#6366f1',
          width: `${pct}%`, height: '100%', borderRadius: 99, transition: 'width 0.4s',
        }} />
      </div>
    </div>
  );
}

export default function TaskView({ category, onTaskChange }) {
  const { tasks, loading, error, reload, createTask, updateTask, deleteTask, toggleTask } = useTasks(category);
  const [modal, setModal] = useState(null); // null | 'new' | task
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleSave(form) {
    try {
      if (form.id) {
        await updateTask(form.id, form);
        showToast('Task updated!');
      } else {
        await createTask({ ...form, category });
        showToast('Task added!');
      }
      setModal(null);
      onTaskChange?.();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }

  async function handleDelete(id) {
    await deleteTask(id);
    showToast('Task deleted.');
    onTaskChange?.();
  }

  async function handleToggle(id) {
    await toggleTask(id);
    onTaskChange?.();
  }

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    if (filter === 'high') return t.priority === 'high' && !t.done;
    return true;
  });

  const isDaily = category === 'daily';
  const title = isDaily ? '☀️ Daily Tasks' : '📅 Weekly Tasks';
  const subtitle = isDaily
    ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : `Week of ${getWeekRange()}`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{title}</h1>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ fontSize: 13, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', cursor: 'pointer' }}
        >
          <option value="all">All tasks</option>
          <option value="active">Active</option>
          <option value="high">High priority</option>
          <option value="done">Completed</option>
        </select>
        <button
          onClick={() => setModal('new')}
          style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 18 }}>+</span> Add Task
        </button>
        <button
          onClick={reload}
          title="Refresh"
          style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 16 }}
        >
          🔄
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#b91c1c', marginBottom: 16, fontSize: 14 }}>
            ⚠️ {error} — <button onClick={reload} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Loading...</div>
        ) : (
          <>
            <StatsBar tasks={tasks} />
            <ProgressBar tasks={tasks} />
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {filter === 'all' ? 'No tasks yet — add one above!' : 'Nothing here.'}
                </div>
              </div>
            ) : (
              filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={t => setModal(t)}
                  onDelete={handleDelete}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          defaultCategory={category}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#1e1b4b',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 500, boxShadow: '0 8px 30px rgba(0,0,0,0.25)', zIndex: 9999,
        }}>{toast}</div>
      )}
    </div>
  );
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = d => d.toLocaleDateString('en-US', { m