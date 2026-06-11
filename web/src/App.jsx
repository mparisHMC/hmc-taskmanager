import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TaskView from './views/TaskView';
import IntegrationsView from './views/IntegrationsView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import { tasksApi } from './api/client';

export default function App() {
  const [allTasks, setAllTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if already logged in on mount
  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .finally(() => setAuthChecked(true));
  }, []);

  // Load sidebar task counts when logged in
  useEffect(() => {
    if (user) tasksApi.getAll().then(setAllTasks).catch(() => {});
  }, [user]);

  function refreshAll() {
    tasksApi.getAll().then(setAllTasks).catch(() => {});
  }

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setAllTasks([]);
  }

  if (!authChecked) return null;
  if (!user) return <LoginView onLogin={setUser} />;

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar tasks={allTasks} userName={user.name} onLogout={handleLogout} />
        <main style={{ flex: 1, overflow: 'hidden', disp