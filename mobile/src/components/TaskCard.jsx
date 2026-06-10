import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const priColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const priBg = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };

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
    <View style={[styles.card, task.done && styles.cardDone, { borderLeftColor: task.done ? '#d1d5db' : (priColors[task.priority] || '#6b7280') }]}>
      <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.checkbox}>
        <View style={[styles.checkboxInner, task.done && styles.checkboxChecked]}>
          {task.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.body} onPress={() => onEdit(task)}>
        <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: priBg[task.priority] }]}>
            <Text style={[styles.badgeText, { color: priColors[task.priority] }]}>{task.priority}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: task.category === 'daily' ? '#eff6ff' : '#f5f3ff' }]}>
            <Text style={[styles.badgeText, { color: task.category === 'daily' ? '#3b82f6' : '#7c3aed' }]}>{task.category}</Text>
          </View>
          {task.due && (
            <Text style={[styles.due, overdue && styles.dueOverdue]}>
              {overdue ? '⚠ ' : ''}{fmtDate(task.due)}
            </Text>
          )}
        </View>
        {task.notes ? <Text style={styles.notes} numberOfLines={1}>{task.notes}</Text> : null}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardDone: { opacity: 0.6 },
  checkbox: { paddingTop: 2 },
  checkboxInner: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 6 },
  titleDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  due: { fontSize: 12, color: '#6b7280' },
  dueOverdue: { color: '#ef4444', fontWeight: '600' },
  notes: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },
});
