import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  // No white bg — bar is transparent so page bg (sky blue) shows through
  bar:        'transparent',
  pillActive: '#1A8FAD',   // deep teal — active pill
  pillInactive:'rgba(255,255,255,0.35)', // frosted soft white — inactive pill
  iconActive: '#FFFFFF',   // white icon on teal pill
  iconInactive:'#3A6878',  // dark slate-teal — inactive icon
  labelActive: '#0F4F63',  // deep teal text
  labelInactive:'#7A9EAD', // muted blue-grey text
  border:     'rgba(255,255,255,0.5)',  // very soft top line
  badge:      '#F43F5E',
  white:      '#FFFFFF',
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'Home',       label: 'Home',       icon: 'home-outline'  },
   { id: 'Categories', label: 'Categories', icon: 'grid-outline'  },
  { id: 'OrderAgain', label: 'Orders',     icon: 'bag-outline'},
  { id: 'Print',      label: 'Print',      icon: 'print-outline' },
];

// ─── TabItem ──────────────────────────────────────────────────────────────────
const TabItem = ({ tab, isActive, onPress }) => {
  // Native driver — transforms only
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.08 : 1)).current;
  const liftAnim  = useRef(new Animated.Value(isActive ? -2 : 0)).current;

  // JS driver — background colour only
  const bgAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    const cfg = { tension: 160, friction: 9 };

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.08 : 1,
        useNativeDriver: true,
        ...cfg,
      }),
      Animated.spring(liftAnim, {
        toValue: isActive ? -2 : 0,
        useNativeDriver: true,
        ...cfg,
      }),
    ]).start();

    Animated.spring(bgAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: false,
      ...cfg,
    }).start();
  }, [isActive]);

  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [C.pillInactive, C.pillActive],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tabTouch}
    >
      {/* JS-driver: bg colour */}
      <Animated.View style={[styles.pill, { backgroundColor: bgColor }]}>
        {/* Native-driver: scale + lift */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }, { translateY: liftAnim }],
            alignItems: 'center',
          }}
        >
          <View style={{ position: 'relative' }}>
            <Icon
              name={tab.icon}
              size={20}
              color={isActive ? C.iconActive : C.iconInactive}
            />
            {tab.badge ? (
              <View style={[styles.badge, { borderColor: isActive ? C.pillActive : 'rgba(200,223,232,0.6)' }]}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>

      <Text
        style={[
          styles.label,
          { color: isActive ? C.labelActive : C.labelInactive },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── BottomTabNavigator ───────────────────────────────────────────────────────
const BottomTabNavigator = ({ activeTab = 'Home', onTabPress }) => (
  <View style={styles.container}>
    <View style={styles.row}>
      {TABS.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={() => onTabPress?.(tab.id)}
        />
      ))}
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor:  C.bar,          // transparent — sky bg shows through
    borderTopWidth:   1,
    borderTopColor:   C.border,
    paddingTop:       10,
    paddingBottom:    Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-around',
  },
  tabTouch: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  pill: {
    width:          48,
    height:         48,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontSize:      10,
    fontWeight:    '600',
    letterSpacing: 0.1,
  },
  badge: {
    position:          'absolute',
    top:               -5,
    right:             -9,
    backgroundColor:   C.badge,
    borderRadius:      8,
    minWidth:          16,
    height:            16,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
  },
  badgeText: {
    color:      C.white,
    fontSize:   9,
    fontWeight: '800',
    lineHeight: 12,
  },
});

export default BottomTabNavigator;