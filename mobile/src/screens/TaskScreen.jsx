import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, Alert, SafeAreaView,
} from 'react-native';
import { tasksApi } from '../api/client';
import TaskCard from '../components/TaskCard';

const today = () => new Date().toISOString().slice(0, 10);

const priColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

export default function TaskScreen({ category }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', priority: 'medium', category, notes: '', due: today() });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await tasksApi.getAll(category);
      setTasks(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditTask(null);
    setForm({ title: '', priority: 'medium', category, notes: '', due: today() });
    setModal(true);
  }

  function openEdit(task) {
    setEditTask(task);
    setForm({ title: task.title, priority: task.priority, category: task.category, notes: task.notes || '', due: task.due || today() });
    setModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return Alert.alert('Required', 'Please enter a task title.');
    try {
      if (editTask) {
        const updated = await tasksApi.update(editTask.id, form);
        setTasks(ts => ts.map(t => t.id === editTask.id ? updated : t));
      } else {
        const created = await tasksApi.create(form);
        setTasks(ts => [...ts, created]);
      }
      setModal(false);
    } catch (e) { Alert.alert('Error', e.message); }
  }

  async function handleToggle(id) {
    try {
      const updated = await tasksApi.toggle(id);
      setTasks(ts => ts.map(t => t.id === id ? updated : t));
    } catch (e) { Alert.alert('Error', e.message); }
  }

  async function handleDelete(id) {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await tasksApi.delete(id);
          setTasks(ts => ts.filter(t => t.id !== id));
        } catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  }

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    if (filter === 'high') return t.priority === 'high' && !t.done;
    return true;
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const isDaily = category === 'daily';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isDaily ? '☀️ Daily Tasks' : '📅 Weekly Tasks'}</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: total, color: '#6366f1' },
          { label: 'Done', value: `${done}/${total}`, color: '#22c55e' },
          { label: 'Progress', value: `${pct}%`, color: pct === 100 ? '#22c55e' : '#6366f1' },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Progress bar */}
      <View style={styles.progContainer}>
        <View style={styles.progBar}>
          <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : '#6366f1' }]} />
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {['all', 'active', 'high', 'done'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterPillActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : f === 'high' ? 'High priority' : 'Done'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#6366f1']} />}
      >
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>{filter === 'all' ? 'No tasks yet — tap + to add one' : 'Nothing here'}</Text>
          </View>
        ) : (
          filtered.map(task => (
            <TaskCard key={task.id} task={task} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editTask ? 'Edit Task' : 'New Task'}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              placeholder="What needs to be done?"
              autoFocus
            />

            <Text style={styles.fieldLabel}>List</Text>
            <View style={styles.segmented}>
              {['daily', 'weekly'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.segment, form.category === c && styles.segmentActive]}
                  onPress={() => setForm(f => ({ ...f, category: c }))}
                >
                  <Text style={[styles.segmentText, form.category === c && styles.segmentTextActive]}>
                    {c === 'daily' ? '☀️ Daily' : '📅 Weekly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.segmented}>
              {['high', 'medium', 'low'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.segment, form.priority === p && styles.segmentActive, { borderColor: form.priority === p ? priColors[p] : '#e5e7eb' }]}
                  onPress={() => setForm(f => ({ ...f, priority: p }))}
                >
                  <Text style={[styles.segmentText, form.priority === p && { color: priColors[p], fontWeight: '600' }]}>
                    {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={form.due}
              onChangeText={v => setForm(f => ({ ...f, due: v }))}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.notes}
              onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              placeholder="Optional notes..."
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#1e1b4b', padding: 16, paddingTop: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerDate: { color: '#a5b4fc', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 0 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  statVal: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  progContainer: { paddingHorizontal: 14, paddingVertical: 10 },
  progBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 99 },
  progFill: { height: '100%', borderRadius: 99 },
  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 10 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterPillActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { fontSize: 13, color: '#6b7280' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 30,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalCancel: { fontSize: 16, color: '#6b7280' },
  modalSave: { fontSize: 16, color: '#6366f1', fontWeight: '700' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827' },
  textarea: { height: 80, textAlignVertical: 'top' },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
  segmentActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  segmentText: { fontSize: 13, color: '#6b7280' },
  segmentTextActive: { color: '#6366f1', fontWeight: '600' },
});
