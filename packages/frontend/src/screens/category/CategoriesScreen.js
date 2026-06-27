import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';

const CategoriesScreen = ({ navigation }) => {
  const { cartCount, cartTotal } = useCart();
  const categories = [
    { id: '1', name: 'Vegetables & Fruits', icon: '🥬', accent: '#4CAF50', count: '120+ items' },
    { id: '2', name: 'Dairy, Eggs & Bread', icon: '🥛', accent: '#FDD835', count: '80+ items' },
    { id: '3', name: 'Munchies', icon: '🍿', accent: '#FF7043', count: '95+ items' },
    { id: '4', name: 'Cold Drinks & Juices', icon: '🥤', accent: '#29B6F6', count: '60+ items' },
    { id: '5', name: 'Noodles & Instant Food', icon: '🍜', accent: '#AB47BC', count: '70+ items' },
    { id: '6', name: 'Bakery & Biscuits', icon: '🍪', accent: '#FF9800', count: '90+ items' },
    { id: '7', name: 'Sweet Tooth', icon: '🍭', accent: '#E91E63', count: '45+ items' },
    { id: '8', name: 'Atta, Rice & Dal', icon: '🌾', accent: '#8BC34A', count: '40+ items' },
    { id: '9', name: 'Sauces & Spreads', icon: '🍯', accent: '#5C6BC0', count: '35+ items' },
    { id: '10', name: 'Baby Care', icon: '👶', accent: '#F48FB1', count: '75+ items' },
  ];

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('CategoryProductScreen', { categoryName: item.name })}
    >

      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.count}>{item.count}</Text>
    </TouchableOpacity>
  );

return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories"
          placeholderTextColor="#B0B8C1"
        />
      </View>

      {/* Grid */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          cartCount > 0 && { paddingBottom: 100 },  // ← make room for cart bar
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarCount}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
            <Text style={styles.cartBarTotal}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBarBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.cartBarBtnText}>View Cart  →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0EF',
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#F2F0EF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    padding: 0,
  },

  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 14,
    minHeight: 118,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 28,
    marginBottom: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 16,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  count: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A0A8B0',
  },
  // Sticky cart bar
  cartBar: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBarCount: { fontSize: 11, color: '#999', fontWeight: '600' },
  cartBarTotal: { fontSize: 17, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  cartBarBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cartBarBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default CategoriesScreen;