import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';

const CATEGORIES = ['All', 'Snacks', 'Beverages', 'Dairy', 'Fruits', 'Electronics'];

const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Lays Classic',       category: 'Snacks',      price: '₹20',  stock: 142, active: true  },
  { _id: 'p2', name: 'Coca Cola 500ml',    category: 'Beverages',   price: '₹40',  stock: 88,  active: true  },
  { _id: 'p3', name: 'Amul Butter 500g',   category: 'Dairy',       price: '₹260', stock: 34,  active: true  },
  { _id: 'p4', name: 'Banana Dozen',       category: 'Fruits',      price: '₹60',  stock: 0,   active: false },
  { _id: 'p5', name: 'Boat Earphones',     category: 'Electronics', price: '₹999', stock: 12,  active: true  },
  { _id: 'p6', name: 'Kurkure Masala',     category: 'Snacks',      price: '₹20',  stock: 200, active: true  },
  { _id: 'p7', name: 'Amul Milk 1L',       category: 'Dairy',       price: '₹60',  stock: 55,  active: true  },
  { _id: 'p8', name: 'Sprite 2L',          category: 'Beverages',   price: '₹90',  stock: 30,  active: true  },
  { _id: 'p9', name: 'Apple Fuji 1kg',     category: 'Fruits',      price: '₹180', stock: 0,   active: false },
  { _id: 'p10',name: 'USB-C Cable 2m',     category: 'Electronics', price: '₹299', stock: 60,  active: true  },
];

const ProductCard = ({ product }) => {
  const isOutOfStock = product.stock === 0;
  return (
    <View style={[styles.card, isOutOfStock && styles.cardOOS]}>
      <View style={styles.cardLeft}>
        <View style={[styles.catBadge, isOutOfStock && styles.catBadgeOOS]}>
          <Text style={styles.catText}>{product.category[0]}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={[styles.pill, { backgroundColor: isOutOfStock ? '#fef2f2' : '#f0fdf4' }]}>
            <Text style={[styles.pillText, { color: isOutOfStock ? '#ef4444' : '#22c55e' }]}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </Text>
          </View>
        </View>
        <Text style={styles.category}>{product.category}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={styles.stock}>📦 {product.stock} units</Text>
        </View>
      </View>
    </View>
  );
};

const AdminProductsScreen = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const displayed = MOCK_PRODUCTS.filter((p) => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSub}>{MOCK_PRODUCTS.length} products listed</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text>🔍 </Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter */}
      <View style={styles.filterRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterTab, activeCategory === c && styles.filterTabActive]}
            onPress={() => setActiveCategory(c)}
          >
            <Text style={[styles.filterText, activeCategory === c && styles.filterTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1a1a2e', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff18', justifyContent: 'center', alignItems: 'center',
  },
  backIcon:    { color: '#fff', fontSize: 20, lineHeight: 22 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:   { color: '#94a3b8', fontSize: 12 },
  addBtn: { backgroundColor: '#e94560', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 6, marginBottom: 8, flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  filterTabActive:  { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  filterText:       { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardOOS:    { borderColor: '#fecaca', backgroundColor: '#fffafa' },
  cardLeft:   { marginRight: 12 },
  catBadge:   { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  catBadgeOOS:{ backgroundColor: '#fef2f2' },
  catText:    { fontSize: 20 },
  cardBody:   { flex: 1 },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name:       { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
  category:   { fontSize: 11, color: '#64748b', marginBottom: 6 },
  price:      { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  stock:      { fontSize: 12, color: '#64748b' },
  pill:       { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillText:   { fontSize: 10, fontWeight: '700' },
});

export default AdminProductsScreen;
