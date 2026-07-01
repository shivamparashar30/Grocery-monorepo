import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1',
  '#96E6A1', '#DDA0DD', '#F7DC6F', '#FF8C69',
  '#87CEEB', '#98FB98', '#FFA07A', '#BA55D3',
];

const NUM_CONFETTI = 24;
const NUM_SPARKLES = 8;

const Confetti = ({ index, triggerAnim }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const angle = (index / NUM_CONFETTI) * Math.PI * 2;
  const distance = 120 + Math.random() * 140;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance - 40;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 6;
  const isRect = index % 3 === 0;
  const delay = 400 + Math.random() * 200;

  useEffect(() => {
    if (!triggerAnim) return;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateX, {
          toValue: targetX,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: targetY + 60,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 2 + Math.random() * 3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [triggerAnim]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: isRect ? size * 1.5 : size,
        height: size,
        borderRadius: isRect ? 2 : size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: spin }, { scale }],
      }}
    />
  );
};

const Sparkle = ({ index, triggerAnim }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const angle = (index / NUM_SPARKLES) * Math.PI * 2 + Math.PI / 8;
  const dist = 60 + Math.random() * 30;
  const x = Math.cos(angle) * dist;
  const y = Math.sin(angle) * dist;
  const delay = 600 + index * 80;

  useEffect(() => {
    if (!triggerAnim) return;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [triggerAnim]);

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: width / 2 - 4 + x,
          top: height * 0.35 + y,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Icon name="star" size={12} color="#FFE66D" />
    </Animated.View>
  );
};

const LoginSuccessOverlay = ({ visible, userName, onFinish }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const nameFade = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(20)).current;
  const subFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset all values
    overlayOpacity.setValue(0);
    circleScale.setValue(0);
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    ringScale.setValue(0.8);
    ringOpacity.setValue(0);
    textFade.setValue(0);
    textSlide.setValue(30);
    nameFade.setValue(0);
    nameSlide.setValue(20);
    subFade.setValue(0);

    Animated.sequence([
      // 1. Background fades in
      Animated.timing(overlayOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      // 2. Circle scales up with spring
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1, friction: 6, tension: 60, useNativeDriver: true,
        }),
        // Ring pulse
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringOpacity, { toValue: 0.4, duration: 300, useNativeDriver: true }),
            Animated.spring(ringScale, { toValue: 1.3, friction: 5, tension: 40, useNativeDriver: true }),
          ]),
          Animated.timing(ringOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
      // 3. Checkmark bounces in
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1, friction: 4, tension: 100, useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      // 4. Welcome text slides up
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(textSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
      // 5. Name slides up
      Animated.parallel([
        Animated.timing(nameFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(nameSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
      // 6. Subtitle
      Animated.timing(subFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 7. Hold
      Animated.delay(1000),
      // 8. Fade out
      Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

        {/* Confetti */}
        <View style={styles.confettiContainer}>
          {Array.from({ length: NUM_CONFETTI }).map((_, i) => (
            <Confetti key={i} index={i} triggerAnim={visible} />
          ))}
        </View>

        {/* Sparkles */}
        {Array.from({ length: NUM_SPARKLES }).map((_, i) => (
          <Sparkle key={i} index={i} triggerAnim={visible} />
        ))}

        {/* Ring pulse */}
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />

        {/* Success circle */}
        <Animated.View style={[styles.circle, { transform: [{ scale: circleScale }] }]}>
          <Animated.View style={{ transform: [{ scale: checkScale }], opacity: checkOpacity }}>
            <Icon name="check" size={52} color="#fff" />
          </Animated.View>
        </Animated.View>

        {/* Welcome text */}
        <Animated.Text
          style={[styles.welcomeText, { opacity: textFade, transform: [{ translateY: textSlide }] }]}
        >
          Welcome back!
        </Animated.Text>

        {/* User name */}
        <Animated.Text
          style={[styles.userName, { opacity: nameFade, transform: [{ translateY: nameSlide }] }]}
        >
          {userName || 'User'}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subFade }]}>
          Let's get shopping
        </Animated.Text>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    left: width / 2,
    top: height * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#fff',
  },
  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 32,
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    fontWeight: '500',
  },
});

export default LoginSuccessOverlay;
