import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';

const API = `${BASE_URL}/home-sections`;

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const SEASONS = ['all', 'summer', 'winter', 'monsoon', 'festive'];

const SEASON_COLORS = {
  all: '#6C5CE7',
  summer: '#F59E0B',
  winter: '#3B82F6',
  monsoon: '#06B6D4',
  festive: '#E91E63',
};

// ── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ section, onToggle, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const seasonColor = SEASON_COLORS[section.season] || '#6C5CE7';

  return (
    <View style={[styles.card, !section.isActive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.orderBadge, { backgroundColor: section.isActive ? '#DCFCE7' : '#FEF3C7' }]}>
            <Text style={[styles.orderText, { color: section.isActive ? '#16A34A' : '#D97706' }]}>
              #{section.sortOrder + 1}
            </Text>
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>{section.title}</Text>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardMeta}>{section.products?.length || 0} products</Text>
              <View style={[styles.seasonPill, { backgroundColor: seasonColor + '15' }]}>
                <Text style={[styles.seasonText, { color: seasonColor }]}>{section.season}</Text>
              </View>
            </View>
          </View>
        </View>
        <Switch
          value={section.isActive}
          onValueChange={() => onToggle(section._id)}
          trackColor={{ false: '#E2E8F0', true: '#BBF7D0' }}
          thumbColor={section.isActive ? '#16A34A' : '#94A3B8'}
        />
      </View>

      {section.subtitle ? (
        <Text style={styles.cardSubtitle} numberOfLines={1}>{section.subtitle}</Text>
      ) : null}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, isFirst && styles.actionBtnDisabled]}
          onPress={() => onMoveUp(section)}
          disabled={isFirst}
        >
          <Icon name="arrow-up" size={16} color={isFirst ? '#CBD5E1' : '#475569'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, isLast && styles.actionBtnDisabled]}
          onPress={() => onMoveDown(section)}
          disabled={isLast}
        >
          <Icon name="arrow-down" size={16} color={isLast ? '#CBD5E1' : '#475569'} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(section)}>
          <Icon name="pencil" size={16} color="#6C5CE7" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(section)}>
          <Icon name="trash" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminSectionsScreen = ({ navigation }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', season: 'all' });

  const fetchSections = useCallback(async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/admin`, { headers });
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch (err) {
      console.error('Fetch sections error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSections(); }, []);

  const handleToggle = async (id) => {
    try {
      const headers = await getHeaders();
      await fetch(`${API}/${id}/toggle`, { method: 'PUT', headers });
      setSections((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle section');
    }
  };

  const handleDelete = (section) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${section.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const headers = await getHeaders();
              await fetch(`${API}/${section._id}`, { method: 'DELETE', headers });
              setSections((prev) => prev.filter((s) => s._id !== section._id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete section');
            }
          },
        },
      ]
    );
  };

  const handleMove = async (section, direction) => {
    const idx = sections.findIndex((s) => s._id === section._id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const newSections = [...sections];
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
    const order = newSections.map((s, i) => ({ id: s._id, sortOrder: i }));
    setSections(newSections.map((s, i) => ({ ...s, sortOrder: i })));

    try {
      const headers = await getHeaders();
      await fetch(`${API}/reorder`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ order }),
      });
    } catch (err) {
      fetchSections();
    }
  };

  const openCreateModal = () => {
    setEditSection(null);
    setForm({ title: '', subtitle: '', season: 'all' });
    setModalVisible(true);
  };

  const openEditModal = (section) => {
    setEditSection(section);
    setForm({
      title: section.title,
      subtitle: section.subtitle || '',
      season: section.season || 'all',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    try {
      const headers = await getHeaders();
      if (editSection) {
        const res = await fetch(`${API}/${editSection._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setSections((prev) =>
            prev.map((s) => (s._id === editSection._id ? data.data : s))
          );
        }
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers,
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setSections((prev) => [...prev, data.data]);
        }
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save section');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Home Sections</Text>
          <Text style={styles.headerSub}>{sections.length} sections</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <SectionCard
            section={item}
            onToggle={handleToggle}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onMoveUp={(s) => handleMove(s, 'up')}
            onMoveDown={(s) => handleMove(s, 'down')}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSections(); }}
            tintColor="#6C5CE7"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="layers-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No sections yet</Text>
            <Text style={styles.emptySub}>Tap + to create your first section</Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editSection ? 'Edit Section' : 'New Section'}
            </Text>

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder="e.g. Summer Essentials"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Subtitle</Text>
            <TextInput
              style={styles.input}
              value={form.subtitle}
              onChangeText={(v) => setForm((f) => ({ ...f, subtitle: v }))}
              placeholder="e.g. Beat the heat"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonRow}>
              {SEASONS.map((season) => {
                const isSelected = form.season === season;
                const color = SEASON_COLORS[season];
                return (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.seasonChip,
                      isSelected && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, season }))}
                  >
                    <Text
                      style={[
                        styles.seasonChipText,
                        isSelected && { color: '#fff' },
                      ]}
                    >
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                <Text style={styles.modalSaveText}>
                  {editSection ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { paddingHorizontal: 20, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInactive: { opacity: 0.6 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderText: { fontSize: 12, fontWeight: '800' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  seasonPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  seasonText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardSubtitle: { fontSize: 12, color: '#64748B', marginTop: 8, fontStyle: 'italic' },

  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.4 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 13, color: '#94A3B8' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  seasonRow: { marginBottom: 20 },
  seasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  seasonChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default AdminSectionsScreen;
