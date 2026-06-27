import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// ─── Design tokens (mirrors your Categories screen) ───────────────────────────
const C = {
  bg: '#F2F2F2',
  card: '#FFFFFF',
  ink: '#111111',
  sub: '#888888',
  muted: '#BBBBBB',
  border: '#EBEBEB',
  accent: '#1A1A1A',
  green: '#2BB77D',
  greenLight: '#E8F8F1',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: '1',
    icon: 'document-text-outline',
    name: 'Document Print',
    desc: 'Black & White / Color',
    tag: 'From ₹2/page',
  },
  {
    id: '2',
    icon: 'image-outline',
    name: 'Photo Print',
    desc: 'Various sizes available',
    tag: 'From ₹15',
  },
  {
    id: '3',
    icon: 'scan-outline',
    name: 'Scan Document',
    desc: 'High quality scans',
    tag: 'From ₹5/page',
  },
  {
    id: '4',
    icon: 'copy-outline',
    name: 'Xerox / Photocopy',
    desc: 'Quick photocopies',
    tag: 'From ₹1/page',
  },
  {
    id: '5',
    icon: 'id-card-outline',
    name: 'ID Card Print',
    desc: 'Passport size & ID',
    tag: 'From ₹25',
  },
  {
    id: '6',
    icon: 'book-outline',
    name: 'Booklet / Spiral',
    desc: 'Binding & covers',
    tag: 'From ₹30',
  },
];

const HOW_IT_WORKS = [
  { step: '1', text: 'Upload your file or choose a template' },
  { step: '2', text: 'Select print options & nearby store' },
  { step: '3', text: 'Pay online, pick up in minutes' },
];

// ─── Card component ───────────────────────────────────────────────────────────
const ServiceCard = ({ item, selected, onPress }) => (
  <TouchableOpacity
    style={[s.serviceCard, selected && s.serviceCardSelected]}
    onPress={onPress}
    activeOpacity={0.82}
  >
    <View style={[s.serviceIconWrap, selected && s.serviceIconWrapSelected]}>
      <Icon
        name={item.icon}
        size={26}
        color={selected ? C.green : '#555'}
      />
    </View>
    <Text style={[s.serviceName, selected && s.serviceNameSelected]}>
      {item.name}
    </Text>
    <Text style={s.serviceDesc}>{item.desc}</Text>
    <View style={[s.serviceTag, selected && s.serviceTagSelected]}>
      <Text style={[s.serviceTagText, selected && s.serviceTagTextSelected]}>
        {item.tag}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const PrintScreen = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [copies, setCopies] = useState(1);

  const handleSelect = (id) =>
    setSelectedService((prev) => (prev === id ? null : id));

  const rows = [];
  for (let i = 0; i < SERVICES.length; i += 2) {
    rows.push(SERVICES.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Print & Scan</Text>
        <TouchableOpacity style={s.headerIconBtn} activeOpacity={0.7}>
          <Icon name="time-outline" size={22} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >

        {/* ── Search ── */}
        <View style={s.searchBar}>
          <Icon name="search-outline" size={18} color={C.muted} />
          <Text style={s.searchPlaceholder}>Search print services</Text>
        </View>

        {/* ── Upload strip ── */}
        <TouchableOpacity style={s.uploadStrip} activeOpacity={0.85}>
          <View style={s.uploadLeft}>
            <View style={s.uploadIconWrap}>
              <Icon name="cloud-upload-outline" size={22} color={C.green} />
            </View>
            <View>
              <Text style={s.uploadTitle}>Upload a file</Text>
              <Text style={s.uploadSub}>PDF, Word, JPG, PNG supported</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color={C.muted} />
        </TouchableOpacity>

        {/* ── Services grid ── */}
        <Text style={s.sectionTitle}>Choose a service</Text>
        <View style={s.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={s.gridRow}>
              {row.map((item) => (
                <ServiceCard
                  key={item.id}
                  item={item}
                  selected={selectedService === item.id}
                  onPress={() => handleSelect(item.id)}
                />
              ))}
              {row.length === 1 && <View style={s.gridPlaceholder} />}
            </View>
          ))}
        </View>

        {/* ── Copies selector (shown when service selected) ── */}
        {selectedService && (
          <View style={s.optionsCard}>
            <Text style={s.optionsTitle}>Print options</Text>

            <View style={s.optionRow}>
              <Text style={s.optionLabel}>Number of copies</Text>
              <View style={s.stepper}>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() => setCopies((c) => Math.max(1, c - 1))}
                  activeOpacity={0.7}
                >
                  <Icon name="remove" size={16} color={C.ink} />
                </TouchableOpacity>
                <Text style={s.stepperVal}>{copies}</Text>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() => setCopies((c) => Math.min(99, c + 1))}
                  activeOpacity={0.7}
                >
                  <Icon name="add" size={16} color={C.ink} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.optionRow}>
              <Text style={s.optionLabel}>Color mode</Text>
              <View style={s.pills}>
                {['B&W', 'Color'].map((m) => (
                  <TouchableOpacity key={m} style={s.pill} activeOpacity={0.7}>
                    <Text style={s.pillText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.optionRow}>
              <Text style={s.optionLabel}>Paper size</Text>
              <View style={s.pills}>
                {['A4', 'A3', 'Letter'].map((m) => (
                  <TouchableOpacity key={m} style={s.pill} activeOpacity={0.7}>
                    <Text style={s.pillText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── How it works ── */}
        <Text style={s.sectionTitle}>How it works</Text>
        <View style={s.howCard}>
          {HOW_IT_WORKS.map((h, i) => (
            <View key={h.step}>
              <View style={s.howRow}>
                <View style={s.howStep}>
                  <Text style={s.howStepText}>{h.step}</Text>
                </View>
                <Text style={s.howText}>{h.text}</Text>
              </View>
              {i < HOW_IT_WORKS.length - 1 && (
                <View style={s.howDivider} />
              )}
            </View>
          ))}
        </View>

        {/* ── Nearby stores ── */}
        <Text style={s.sectionTitle}>Nearby stores</Text>
        {[
          { name: 'QuickPrint — Vaishali Nagar', dist: '0.4 km', time: '5 min' },
          { name: 'PrintKart — Ajmer Road',     dist: '1.1 km', time: '12 min' },
        ].map((store, i) => (
          <TouchableOpacity key={i} style={s.storeCard} activeOpacity={0.85}>
            <View style={s.storeIconWrap}>
              <Icon name="storefront-outline" size={20} color="#555" />
            </View>
            <View style={s.storeInfo}>
              <Text style={s.storeName}>{store.name}</Text>
              <Text style={s.storeMeta}>{store.dist} · {store.time} away</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={s.bottomBar}>
        <View style={s.bottomLeft}>
          <Text style={s.bottomCount}>
            {selectedService
              ? `${copies} cop${copies === 1 ? 'y' : 'ies'} · ${
                  SERVICES.find((s) => s.id === selectedService)?.name
                }`
              : 'No service selected'}
          </Text>
          <Text style={s.bottomSub}>
            {selectedService ? 'Ready to upload' : 'Pick a service above'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.ctaBtn, !selectedService && s.ctaBtnDisabled]}
          activeOpacity={selectedService ? 0.85 : 1}
        >
          <Text style={s.ctaBtnText}>Proceed</Text>
          <Icon name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_GAP = 10;
const H_PAD   = 16;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: H_PAD, paddingTop: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 14,
    backgroundColor: C.bg,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: C.ink, letterSpacing: -0.5 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 0.5, borderColor: C.border,
    marginBottom: 12,
  },
  searchPlaceholder: { fontSize: 14, color: C.muted, fontWeight: '400' },

  // Upload strip
  uploadStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 0.5, borderColor: C.border,
    marginBottom: 22,
  },
  uploadLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 2 },
  uploadSub:   { fontSize: 12, color: C.sub, fontWeight: '400' },

  // Section title
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: C.ink,
    letterSpacing: -0.3, marginBottom: 12,
  },

  // Grid
  grid:    { gap: CARD_GAP, marginBottom: 22 },
  gridRow: { flexDirection: 'row', gap: CARD_GAP },
  gridPlaceholder: { flex: 1 },

  // Service card — matches your category card proportions
  serviceCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 18,
    padding: 16, borderWidth: 0.5, borderColor: C.border,
    minHeight: 140,
  },
  serviceCardSelected: {
    borderColor: C.green, borderWidth: 1.5,
  },
  serviceIconWrap: {
    width: 48, height: 48, borderRadius: 13,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  serviceIconWrapSelected: { backgroundColor: C.greenLight },
  serviceName: {
    fontSize: 14, fontWeight: '700', color: C.ink,
    marginBottom: 3, lineHeight: 18,
  },
  serviceNameSelected: { color: C.green },
  serviceDesc:  { fontSize: 11.5, color: C.sub, fontWeight: '400', marginBottom: 10 },
  serviceTag: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  serviceTagSelected:     { backgroundColor: C.greenLight },
  serviceTagText:         { fontSize: 10.5, fontWeight: '600', color: C.sub },
  serviceTagTextSelected: { color: C.green },

  // Options card
  optionsCard: {
    backgroundColor: C.card, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 0.5, borderColor: C.border,
    marginBottom: 22,
  },
  optionsTitle: {
    fontSize: 15, fontWeight: '700', color: C.ink,
    marginBottom: 14, letterSpacing: -0.2,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 2,
  },
  optionLabel: { fontSize: 13.5, color: C.ink, fontWeight: '500' },
  divider:     { height: 0.5, backgroundColor: C.border, marginVertical: 12 },

  // Stepper
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: C.bg, borderRadius: 10, overflow: 'hidden',
    borderWidth: 0.5, borderColor: C.border,
  },
  stepperBtn: {
    width: 34, height: 34,
    justifyContent: 'center', alignItems: 'center',
  },
  stepperVal: {
    width: 32, textAlign: 'center',
    fontSize: 14, fontWeight: '700', color: C.ink,
  },

  // Pills
  pills: { flexDirection: 'row', gap: 6 },
  pill: {
    backgroundColor: C.bg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 0.5, borderColor: C.border,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: C.ink },

  // How it works
  howCard: {
    backgroundColor: C.card, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 0.5, borderColor: C.border,
    marginBottom: 22,
  },
  howRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  howStep: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.ink,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  howStepText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  howText:     { fontSize: 13.5, color: C.ink, fontWeight: '500', flex: 1, lineHeight: 19 },
  howDivider:  { height: 0.5, backgroundColor: C.border, marginLeft: 40 },

  // Store cards
  storeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 0.5, borderColor: C.border,
    marginBottom: CARD_GAP,
  },
  storeIconWrap: {
    width: 42, height: 42, borderRadius: 11,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  storeInfo:  { flex: 1 },
  storeName:  { fontSize: 13.5, fontWeight: '600', color: C.ink, marginBottom: 2 },
  storeMeta:  { fontSize: 12, color: C.sub, fontWeight: '400' },

  // Bottom bar — matches your Categories "View Cart" bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 0.5, borderTopColor: C.border,
  },
  bottomLeft:  {},
  bottomCount: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: 1 },
  bottomSub:   { fontSize: 11.5, color: C.sub, fontWeight: '400' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.ink, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 13,
  },
  ctaBtnDisabled: { backgroundColor: C.muted },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default PrintScreen;