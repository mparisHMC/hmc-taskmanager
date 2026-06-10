import React, { useState, useEffect } from 'react';
import { settingsApi } from '../api/client';

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: value ? '#6366f1' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 14, color: '#374151' }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle = { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', color: '#111827', fontFamily: 'inherit' };

export default function SettingsView({ onNameChange }) {
  const [settings, setSettings] = useState({
    notifications: true, daily_digest: true, digest_time: '08:00',
    weekly_review: true, review_day: 'Monday', slack_alerts: true, google_sync: false,
  });
  const [name, setName] = useState('Mackenzie');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi.get().then(s => { setSettings(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function set(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  async function handleSave() {
    try {
      await settingsApi.update(settings);
      onNameChange?.(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#9ca3af' }}>Loading...</div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 28px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>⚙️ Settings</h1>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Manage your preferences and notification schedule</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ maxWidth: 520 }}>

          {/* Profile */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
              Profile
            </h3>
            <Row label="Your Name">
              <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, width: 200 }} />
            </Row>
          </section>

          {/* Task Lists */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Task Lists
            </h3>
            <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#166534', marginBottom: 8 }}>
              ✅ Daily tasks auto-generate every morning at midnight<br />
              ✅ Weekly tasks auto-generate every Monday at midnight
            </div>
            <Row label="Weekly review day">
              <select value={settings.review_day} onChange={e => set('review_day', e.target.value)} style={inputStyle}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => <option key={d}>{d}</option>)}
              </select>
            </Row>
          </section>

          {/* Notifications */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Notifications
            </h3>
            <Row label="Enable notifications"><Toggle value={settings.notifications} onChange={v => set('notifications', v)} /></Row>
            <Row label="Daily Slack digest"><Toggle value={settings.daily_digest} onChange={v => set('daily_digest', v)} /></Row>
            <Row label="Weekly review reminder"><Toggle value={settings.weekly_review} onChange={v => set('weekly_review', v)} /></Row>
            <Row label="Overdue alerts via Slack"><Toggle value={settings.slack_alerts} onChange={v => set('slack_alerts', v)} /></Row>
            {settings.daily_digest && (
              <Row label="Digest send time">
                <input type="time" value={settings.digest_time} onChange={e => set('digest_time', e.target.value)} style={{ ...inputStyle, width: 130 }} />
              </Row>
            )}
          </section>

          {/* Integrations quick status */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Integrations
            </h3>
            <Row label="Auto-sync Google Calendar/Tasks"><Toggle value={settings.google_sync} onChange={v => set('google_sync', v)} /></Row>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              Manage connections on the <a href="/integrations" style={{ color: '#6366f1', fontWeight: 600 }}>Integrations</a> page.
            </div>
          </section>

          <button
            onClick={handleSave}
            style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px', width: '100%', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
