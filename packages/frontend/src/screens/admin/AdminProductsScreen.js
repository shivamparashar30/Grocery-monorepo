import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';

const PRODUCTS_API = `${BASE_URL}/products`;
const CATEGORIES_API = `${BASE_URL}/categories`;
const SECTIONS_API = `${BASE_URL}/home-sections`;

const UNITS = ['kg', 'g', '500g', '250g', 'L', '500ml', '250ml', 'pcs', 'pack', 'dozen', 'box', 'bottle', 'can', 'pouch'];

const getToken = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

// ── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onEdit, onDelete }) => {
  const isOOS = product.stock === 0;
  const isLow = product.stock > 0 && product.stock <= 10;
  const initials = (product.name || 'P').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, isOOS && styles.cardOOS]}
      onPress={() => onEdit(product)}
      activeOpacity={0.7}
    >
      <View style={[styles.productAvatar, isOOS && { backgroundColor: '#FEE2E2' }]}>
        <Text style={[styles.productAvatarText, isOOS && { color: '#DC2626' }]}>
          {initials}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category || 'Uncategorized'}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.productPrice}>Rs. {product.price}</Text>
          <Text style={styles.productUnit}>/ {product.unit}</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <View style={[styles.stockBadge, {
          backgroundColor: isOOS ? '#FEE2E2' : isLow ? '#FEF3C7' : '#DCFCE7',
        }]}>
          <Text style={[styles.stockBadgeText, {
            color: isOOS ? '#DC2626' : isLow ? '#D97706' : '#16A34A',
          }]}>
            {isOOS ? 'Out' : product.stock}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteIconBtn}
          onPress={() => onDelete(product)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="trash-outline" size={14} color="#CBD5E1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ── Product Form Modal ───────────────────────────────────────────────────────
const ProductFormModal = ({ visible, product, categories, sections, onSave, onClose }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);

  useEffect(() => {
    if (visible) {
      if (product) {
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: String(product.price || ''),
          unit: product.unit || 'pcs',
          stock: String(product.stock ?? 100),
          badge: product.badge || '',
          imageUrl: product.imageUrl || '',
          category: product.categoryId || '',
          productKey: product.productKey || '',
        });
        // Find sections containing this product
        const inSections = sections
          .filter(s => s.products?.some(p => (p._id || p) === product._id))
          .map(s => s._id);
        setSelectedSections(inSections);
      } else {
        setForm({
          name: '', description: '', price: '', unit: 'pcs',
          stock: '100', badge: '', imageUrl: '', category: '', productKey: '',
        });
        setSelectedSections([]);
      }
    }
  }, [visible, product]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSection = (id) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return Alert.alert('Error', 'Product name is required');
    if (!form.price || isNaN(form.price)) return Alert.alert('Error', 'Valid price is required');
    if (!form.category) return Alert.alert('Error', 'Please select a category');

    try {
      setSaving(true);
      const headers = await getToken();
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        unit: form.unit,
        stock: parseInt(form.stock) || 0,
        badge: form.badge.trim() || null,
        imageUrl: form.imageUrl.trim(),
        category: form.category,
        productKey: form.productKey.trim() || undefined,
      };

      let savedProduct;
      if (isEdit) {
        const res = await fetch(`${PRODUCTS_API}/${product._id}`, {
          method: 'PUT', headers, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        savedProduct = data.data;
      } else {
        const res = await fetch(PRODUCTS_API, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        savedProduct = data.data;
      }

      // Update home sections if needed
      if (savedProduct?._id) {
        const productId = savedProduct._id;
        for (const section of sections) {
          const isInSection = section.products?.some(p => (p._id || p) === productId);
          const shouldBeIn = selectedSections.includes(section._id);
          if (shouldBeIn && !isInSection) {
            const currentProducts = (section.products || []).map(p => p._id || p);
            await fetch(`${SECTIONS_API}/${section._id}`, {
              method: 'PUT', headers,
              body: JSON.stringify({ products: [...currentProducts, productId] }),
            });
          } else if (!shouldBeIn && isInSection) {
            const currentProducts = (section.products || []).map(p => p._id || p);
            await fetch(`${SECTIONS_API}/${section._id}`, {
              method: 'PUT', headers,
              body: JSON.stringify({ products: currentProducts.filter(id => id !== productId) }),
            });
          }
        }
      }

      onSave(savedProduct, isEdit);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={v => update('name', v)}
                placeholder="e.g. Amul Butter 500g"
                placeholderTextColor="#94A3B8"
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={form.description}
                onChangeText={v => update('description', v)}
                placeholder="Product description"
                placeholderTextColor="#94A3B8"
                multiline
              />

              {/* Category */}
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.chip, form.category === c._id && styles.chipActive]}
                    onPress={() => update('category', c._id)}
                  >
                    <Text style={[styles.chipText, form.category === c._id && styles.chipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Price & Unit */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price (Rs.) *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.price}
                    onChangeText={v => update('price', v)}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unit *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {UNITS.slice(0, 6).map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.miniChip, form.unit === u && styles.chipActive]}
                        onPress={() => update('unit', u)}
                      >
                        <Text style={[styles.miniChipText, form.unit === u && styles.chipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* More Units */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, marginTop: -8 }}>
                {UNITS.slice(6).map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.miniChip, form.unit === u && styles.chipActive]}
                    onPress={() => update('unit', u)}
                  >
                    <Text style={[styles.miniChipText, form.unit === u && styles.chipTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Stock */}
              <Text style={styles.label}>Stock Quantity</Text>
              <TextInput
                style={styles.input}
                value={form.stock}
                onChangeText={v => update('stock', v)}
                placeholder="100"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />

              {/* Badge */}
              <Text style={styles.label}>Badge (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {['', 'New', 'Sale', 'Popular', 'Trending', 'Best Seller'].map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.chip, form.badge === b && styles.chipActive]}
                    onPress={() => update('badge', b)}
                  >
                    <Text style={[styles.chipText, form.badge === b && styles.chipTextActive]}>
                      {b || 'None'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Image URL */}
              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={form.imageUrl}
                onChangeText={v => update('imageUrl', v)}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />

              {/* Product Key */}
              <Text style={styles.label}>Product Key (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.productKey}
                onChangeText={v => update('productKey', v)}
                placeholder="e.g. v1, f3, m2"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />

              {/* Home Sections */}
              {sections.length > 0 && (
                <>
                  <Text style={styles.label}>Home Sections</Text>
                  <View style={styles.sectionsGrid}>
                    {sections.map(s => {
                      const selected = selectedSections.includes(s._id);
                      return (
                        <TouchableOpacity
                          key={s._id}
                          style={[styles.sectionChip, selected && styles.sectionChipActive]}
                          onPress={() => toggleSection(s._id)}
                        >
                          <Icon
                            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={14}
                            color={selected ? '#fff' : '#94A3B8'}
                          />
                          <Text
                            style={[styles.sectionChipText, selected && { color: '#fff' }]}
                            numberOfLines={1}
                          >
                            {s.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name={isEdit ? 'checkmark' : 'add'} size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{isEdit ? 'Update Product' : 'Add Product'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [categoryNames, setCategoryNames] = useState(['All']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const headers = await getToken();
      const [prodRes, catRes, secRes] = await Promise.all([
        fetch(PRODUCTS_API),
        fetch(CATEGORIES_API),
        fetch(`${SECTIONS_API}/admin`, { headers }),
      ]);
      const [prodData, catData, secData] = await Promise.all([
        prodRes.json(), catRes.json(), secRes.json(),
      ]);

      if (prodData.success && prodData.products) {
        setProducts(prodData.products);
        const cats = [...new Set(prodData.products.map(p => p.category).filter(Boolean))];
        setCategoryNames(['All', ...cats.sort()]);
      }
      if (catData.success && catData.data) setAllCategories(catData.data);
      if (secData.success && secData.data) setAllSections(secData.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  const handleSave = useCallback((saved, isEdit) => {
    if (isEdit) {
      setProducts(prev => prev.map(p => p._id === saved._id ? saved : p));
    } else {
      setProducts(prev => [saved, ...prev]);
    }
    setModalVisible(false);
    setEditProduct(null);
    // Refresh sections in background
    setTimeout(() => fetchAll(), 500);
  }, []);

  const handleDelete = useCallback((product) => {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const headers = await getToken();
            const res = await fetch(`${PRODUCTS_API}/${product._id}`, {
              method: 'DELETE', headers,
            });
            const data = await res.json();
            if (data.success) {
              setProducts(prev => prev.filter(p => p._id !== product._id));
            } else {
              Alert.alert('Error', data.message);
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  }, []);

  const openAdd = () => { setEditProduct(null); setModalVisible(true); };
  const openEdit = (p) => { setEditProduct(p); setModalVisible(true); };

  const displayed = useMemo(() => {
    let list = products;
    if (activeFilter !== 'All') list = list.filter(p => p.category === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) || p.productKey?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeFilter, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const oos = products.filter(p => p.stock === 0).length;
    const low = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    return { total, oos, low, inStock: total - oos };
  }, [products]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSub}>{stats.total} products</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        {[
          { label: 'In Stock', value: stats.inStock, color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Low', value: stats.low, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Out', value: stats.oos, color: '#DC2626', bg: '#FEE2E2' },
        ].map(s => (
          <View key={s.label} style={[styles.summaryItem, { backgroundColor: s.bg }]}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={categoryNames}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isActive = activeFilter === item;
          return (
            <TouchableOpacity
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Products list */}
      <FlatList
        data={displayed}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <ProductCard product={item} onEdit={openEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="cube-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search' : 'Tap + to add your first product'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Icon name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Form Modal */}
      <ProductFormModal
        visible={modalVisible}
        product={editProduct}
        categories={allCategories}
        sections={allSections}
        onSave={handleSave}
        onClose={() => { setModalVisible(false); setEditProduct(null); }}
      />
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
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center', alignItems: 'center',
  },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  summaryItem: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: '#475569', fontWeight: '600', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 14,
    height: 44, gap: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff',
  },
  filterTabActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 80 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardOOS: { borderWidth: 1, borderColor: '#FECACA' },
  productAvatar: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  productAvatarText: { fontSize: 14, fontWeight: '800', color: '#6C5CE7' },
  cardBody: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  productCategory: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  productUnit: { fontSize: 11, color: '#94A3B8' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  stockBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
  stockBadgeText: { fontSize: 12, fontWeight: '800' },
  deleteIconBtn: { padding: 4 },

  // FAB
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 13, color: '#94A3B8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '92%', paddingHorizontal: 24, paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalClose: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },

  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#0F172A', marginBottom: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  row: { flexDirection: 'row' },

  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff', marginRight: 8,
  },
  chipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#fff' },

  miniChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff', marginRight: 6,
  },
  miniChipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  sectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  sectionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff',
  },
  sectionChipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  sectionChipText: { fontSize: 11, fontWeight: '600', color: '#475569', maxWidth: 120 },

  saveBtn: {
    flexDirection: 'row', backgroundColor: '#6C5CE7', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AdminProductsScreen;
