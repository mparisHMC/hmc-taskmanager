import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/client';

export function useTasks(category) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.getAll(category);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  async function createTask(task) {
    const created = await tasksApi.create(task);
    setTasks(prev => [...prev, created]);
    return created;
  }

  async function updateTask(id, updates) {
    const updated = await tasksApi.update(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }

  async function deleteTask(id) {
    await tasksApi.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function toggleTask(id) {
    const updated = await tasksApi.toggle(id);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }

  return { tasks, loading, error, reload: load, createTask, updateTask, deleteTask, toggleTask };
}
