import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ title }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

const MenuCard = ({ children }) => (
  <View style={styles.menuCard}>{children}</View>
);

const Divider = () => <View style={styles.divider} />;

const MenuItem = ({
  icon,
  iconLib = 'Feather',
  label,
  subtitle,
  onPress,
  rightText,
  showChevron = true,
  rightElement,
}) => {
  const IconComponent =
    iconLib === 'MaterialCommunity' ? MaterialCommunityIcons : Feather;

  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        <IconComponent name={icon} size={17} color="#555" />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {rightElement ?? (
        <View style={styles.menuRight}>
          {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
          {showChevron && <Feather name="chevron-right" size={17} color="#C8CDD4" />}
        </View>
      )}
    </TouchableOpacity>
  );
};

const ToggleItem = ({ icon, iconLib = 'Feather', label, subtitle, value, onToggle }) => {
  const IconComponent =
    iconLib === 'MaterialCommunity' ? MaterialCommunityIcons : Feather;

  return (
    <View style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <IconComponent name={icon} size={17} color="#555" />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
        thumbColor="#fff"
        ios_backgroundColor="#E0E0E0"
      />
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SettingsScreen = ({ navigation }) => {
  const [pushNotifications, setPushNotifications]   = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications]     = useState(false);
  const [orderUpdates, setOrderUpdates]             = useState(true);
  const [promotionalOffers, setPromotionalOffers]   = useState(true);
  const [locationServices, setLocationServices]     = useState(true);
  const [autoPlayVideos, setAutoPlayVideos]         = useState(false);
  const [darkMode, setDarkMode]                     = useState(false);
  const [biometricAuth, setBiometricAuth]           = useState(false);
  const [dataSaver, setDataSaver]                   = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Cache cleared successfully'),
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to default. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setPushNotifications(true);
            setEmailNotifications(true);
            setSmsNotifications(false);
            setOrderUpdates(true);
            setPromotionalOffers(true);
            setLocationServices(true);
            setAutoPlayVideos(false);
            setDarkMode(false);
            setBiometricAuth(false);
            setDataSaver(false);
            Alert.alert('Success', 'Settings reset to default');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={19} color="#111" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.section}>
          <SectionLabel title="Notifications" />
          <MenuCard>
            <ToggleItem
              icon="bell"
              label="Push Notifications"
              subtitle="Alerts on your device"
              value={pushNotifications}
              onToggle={setPushNotifications}
            />
            <Divider />
            <ToggleItem
              icon="mail"
              label="Email Notifications"
              subtitle="Updates to your inbox"
              value={emailNotifications}
              onToggle={setEmailNotifications}
            />
            <Divider />
            <ToggleItem
              icon="message-square"
              label="SMS Notifications"
              subtitle="Text message updates"
              value={smsNotifications}
              onToggle={setSmsNotifications}
            />
            <Divider />
            <ToggleItem
              icon="shopping-cart"
              label="Order Updates"
              subtitle="Status of your orders"
              value={orderUpdates}
              onToggle={setOrderUpdates}
            />
            <Divider />
            <ToggleItem
              icon="tag"
              label="Promotional Offers"
              subtitle="Deals & discounts"
              value={promotionalOffers}
              onToggle={setPromotionalOffers}
            />
          </MenuCard>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <SectionLabel title="Preferences" />
          <MenuCard>
            <ToggleItem
              icon="navigation"
              label="Location Services"
              subtitle="For faster delivery"
              value={locationServices}
              onToggle={setLocationServices}
            />
            <Divider />
            <ToggleItem
              icon="moon"
              label="Dark Mode"
              subtitle="Coming soon"
              value={darkMode}
              onToggle={setDarkMode}
            />
            <Divider />
            <ToggleItem
              icon="play-circle"
              label="Auto-Play Videos"
              subtitle="Play videos automatically"
              value={autoPlayVideos}
              onToggle={setAutoPlayVideos}
            />
            <Divider />
            <MenuItem
              icon="globe"
              label="Language"
              rightText="English"
              onPress={() => Alert.alert('Language', 'Language selection coming soon')}
            />
            <Divider />
            <MenuItem
              icon="dollar-sign"
              label="Currency"
              rightText="INR (₹)"
              onPress={() => Alert.alert('Currency', 'Currency selection coming soon')}
            />
          </MenuCard>
        </View>

        {/* ── Security & Privacy ── */}
        <View style={styles.section}>
          <SectionLabel title="Security & Privacy" />
          <MenuCard>
            <ToggleItem
              icon="cpu"
              label="Biometric Auth"
              subtitle="Fingerprint or face ID"
              value={biometricAuth}
              onToggle={setBiometricAuth}
            />
            <Divider />
            <MenuItem
              icon="lock"
              label="Change Password"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <Divider />
            <MenuItem
              icon="shield"
              label="Privacy Policy"
              onPress={() => navigation.navigate('Privacy')}
            />
            <Divider />
            <MenuItem
              icon="file-text"
              label="Terms & Conditions"
              onPress={() => navigation.navigate('Terms')}
            />
          </MenuCard>
        </View>

        {/* ── Data & Storage ── */}
        <View style={styles.section}>
          <SectionLabel title="Data & Storage" />
          <MenuCard>
            <MenuItem
              icon="trash-2"
              label="Clear Cache"
              subtitle="Free up storage space"
              onPress={handleClearCache}
            />
            <Divider />
            <MenuItem
              icon="download"
              label="Download Quality"
              rightText="High"
              onPress={() => Alert.alert('Download Quality', 'Quality settings coming soon')}
            />
            <Divider />
            <ToggleItem
              icon="wifi"
              label="Data Saver"
              subtitle="Reduce data usage"
              value={dataSaver}
              onToggle={setDataSaver}
            />
          </MenuCard>
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <SectionLabel title="About" />
          <MenuCard>
            <MenuItem
              icon="info"
              label="App Version"
              rightText="1.0.0"
              showChevron={false}
            />
            <Divider />
            <MenuItem
              icon="star"
              label="Rate Us"
              onPress={() => Alert.alert('Rate Us', 'Thank you for your support!')}
            />
            <Divider />
            <MenuItem
              icon="share-2"
              label="Share App"
              onPress={() => Alert.alert('Share', 'Share feature coming soon')}
            />
            <Divider />
            <MenuItem
              icon="help-circle"
              label="Help & Support"
              onPress={() => navigation.navigate('HelpCenter')}
            />
          </MenuCard>
        </View>

        {/* ── Reset Button ── */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetSettings}
          activeOpacity={0.75}
        >
          <Feather name="refresh-cw" size={16} color="#555" />
          <Text style={styles.resetText}>Reset settings to default</Text>
        </TouchableOpacity>

        {/* ── Danger Zone ── */}
        <View style={styles.dangerCard}>
          <Feather name="alert-triangle" size={17} color="#E53935" style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dangerTitle}>Danger zone</Text>
            <Text style={styles.dangerSub}>
              Some actions here cannot be undone. Please proceed with caution.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0EF',
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.8,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B0B8C1',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingLeft: 2,
  },

  // Menu
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 13,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.1,
  },
  menuSub: {
    fontSize: 11,
    color: '#A0AAB4',
    fontWeight: '500',
    marginTop: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightText: {
    fontSize: 12,
    color: '#A0AAB4',
    fontWeight: '600',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#F4F4F4',
    marginLeft: 65,
  },

  // Reset
  resetBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },

  // Danger
  dangerCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE8E8',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E53935',
    marginBottom: 3,
  },
  dangerSub: {
    fontSize: 11,
    color: '#EF9A9A',
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default SettingsScreen;