import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TaskView from './views/TaskView';
import IntegrationsView from './views/IntegrationsView';
import SettingsView from './views/SettingsView';
import { tasksApi } from './api/client';

export default function App() {
  const [allTasks, setAllTasks] = useState([]);
  const [userName, setUserName] = useState('Mackenzie');

  // Load all tasks for sidebar badge counts
  useEffect(() => {
    tasksApi.getAll().then(setAllTasks).catch(() => {});
  }, []);

  // Refresh all tasks when a view makes changes
  function refreshAll() {
    tasksApi.getAll().then(setAllTasks).catch(() => {});
  }

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar tasks={allTasks} userName={userName} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/daily" replace />} />
            <Route path="/daily"  element={<TaskView category="daily"  onTaskChange={refreshAll} />} />
            <Route path="/weekly" element={<TaskView category="weekly" onTaskChange={refreshAll} />} />
            <Route path="/integrations" element={<IntegrationsView />} />
            <Route path="/settings" element={<SettingsView onNameChange={setUserName} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
