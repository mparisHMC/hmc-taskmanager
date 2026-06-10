import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/daily',        icon: '☀️', label: 'Daily',        key: 'daily' },
  { to: '/weekly',       icon: '📅', label: 'Weekly',       key: 'weekly' },
  { to: '/integrations', icon: '🔗', label: 'Integrations', key: null },
  { to: '/settings',     icon: '⚙️', label: 'Settings',     key: null },
];

export default function Sidebar({ tasks, userName }) {
  function countPending(category) {
    return tasks.filter(t => t.category === category && !t.done).length;
  }

  return (
    <aside style={{
      width: 220, background: '#1e1b4b', display: 'flex', flexDirection: 'column',
      padding: '24px 0', flexShrink: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #312e81' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
          ✅ TaskFlow
        </div>
        <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 2 }}>Health Market Connect</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
              background: isActive ? '#4338ca' : 'transparent',
              color: isActive ? '#fff' : '#a5b4fc',
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              marginBottom: 2,
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.key && (
              <span style={{
                marginLeft: 'auto', background: '#6366f1', color: '#fff',
                borderRadius: 99, fontSize: 11, padding: '1px 7px', fontWeight: 700,
              }}>
                {countPending(item.key)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #312e81' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 8,
        }}>
          {(userName || 'M')[0].toUpperCase()}
        </div>
        <div style={{ fontSize: 13, color: '#e0e7ff', fontWeight: 600 }}>{userName || 'Mackenzie'}</div>
        <div style={{ fontSize: 11, color: '#818cf8' }}>Project Coordinator</div>
      </div>
    </aside>
  );
}
