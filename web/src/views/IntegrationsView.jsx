import React, { useState, useEffect } from 'react';
import { integrationsApi } from '../api/client';

var API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001');

var INTEGRATIONS = [
  { id: 'google',  name: 'Google',  letter: 'G', color: '#4285F4', scopes: 'Calendar, Tasks, Gmail',   authPath: API_URL + '/auth/google' },
  { id: 'slack',   name: 'Slack',   letter: 'S', color: '#4A154B', scopes: 'DMs, Reminders, Alerts',   authPath: 'builtin' },
  { id: 'outlook', name: 'Outlook', letter: 'O', color: '#0078D4', scopes: 'Calendar, Tasks, Email',    authPath: null },
  { id: 'asana',   name: 'Asana',   letter: 'A', color: '#F06A6A', scopes: 'Tasks, Projects, Teams',    authPath: null },
];

export default function IntegrationsView() {
  var [status, setStatus] = useState({});
  var [syncing, setSyncing] = useState(false);
  var [testing, setTesting] = useState(false);
  var [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(function() { setToast(''); }, 3000); }

  useEffect(function() {
    integrationsApi.status().then(setStatus).catch(function() {});
    var params = new URLSearchParams(window.location.search);
    if (params.get('auth_success') === 'google') {
      showToast('Google connected successfully!');
      window.history.replaceState({}, '', '/integrations');
      integrationsApi.status().then(setStatus);
    } else if (params.get('auth_error')) {
      showToast('Connection failed: ' + params.get('auth_error'));
      window.history.replaceState({}, '', '/integrations');
    }
  }, []);

  function handleGoogleSync() {
    setSyncing(true);
    integrationsApi.googleSync().then(function(result) {
      var cal = (result.synced && result.synced.calEvents && result.synced.calEvents.length) || 0;
      var tasks = (result.synced && result.synced.gTasks && result.synced.gTasks.length) || 0;
      showToast('Synced! ' + cal + ' calendar events, ' + tasks + ' tasks');
    }).catch(function(e) {
      showToast('Sync failed: ' + e.message);
    }).finally(function() {
      setSyncing(false);
    });
  }

  function handleSlackTest() {
    setTesting(true);
    integrationsApi.slackTest().then(function() {
      showToast('Test DM sent! Check your Slack.');
    }).catch(function(e) {
      showToast('Slack test failed: ' + e.message);
    }).finally(function() {
      setTesting(false);
    });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 28px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Integrations</h1>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Connect your tools to pull tasks and send alerts</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ maxWidth: 580 }}>

          {INTEGRATIONS.map(function(int) {
            var connected = status[int.id] && status[int.id].connected;
            return (
              <div key={int.id} style={{
                border: '1px solid ' + (connected ? int.color + '55' : '#e5e7eb'),
                borderRadius: 12, padding: '16px 20px',
                background: connected ? int.color + '08' : '#fff',
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: int.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0,
                }}>{int.letter}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{int.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{int.scopes}</div>
                  {connected && int.id === 'slack' && status.slack && status.slack.team && (
                    <div style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>
                      Connected to {status.slack.team}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {int.id === 'google' && connected && (
                    <button
                      onClick={handleGoogleSync}
                      disabled={syncing}
                      style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      {syncing ? 'Syncing...' : 'Sync'}
                    </button>
                  )}
                  {int.id === 'slack' && connected && (
                    <button
                      onClick={handleSlackTest}
                      disabled={testing}
                      style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      {testing ? 'Sending...' : 'Test DM'}
                    </button>
                  )}
                  {int.authPath === 'builtin' ? (
                    <span style={{
                      background: connected ? '#f0fdf4' : '#f3f4f6',
                      color: connected ? '#16a34a' : '#9ca3af',
                      borderRadius: 8, padding: '7px 16px',
                      fontWeight: 600, fontSize: 13,
                    }}>{connected ? 'Connected' : 'Configured'}</span>
                  ) : int.authPath ? (
                    <a
                      href={connected ? '#' : int.authPath}
                      onClick={connected ? function(e) { e.preventDefault(); showToast('Disconnect from Settings'); } : undefined}
                      style={{
                        background: connected ? '#fef2f2' : int.color,
                        color: connected ? '#ef4444' : '#fff',
                        border: 'none', borderRadius: 8, padding: '7px 16px',
                        fontWeight: 600, fontSize: 13, textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      {connected ? 'Connected' : 'Connect'}
                    </a>
                  ) : (
                    <span style={{
                      background: '#f3f4f6', color: '#9ca3af',
                      borderRadius: 8, padding: '7px 16px',
                      fontWeight: 600, fontSize: 13,
                    }}>Coming soon</span>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8, padding: '14px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
            Google Calendar and Tasks sync every 30 minutes once connected. Slack sends daily digests and overdue alerts at your scheduled times.
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1e1b4b', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: '0 8px 30px rgba(0,0,0,0.25)', zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
