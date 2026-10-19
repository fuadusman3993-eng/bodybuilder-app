import React, { useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface AnimatedSelectionCardProps {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}

export default function AnimatedSelectionCard({
  selected,
  onPress,
  children,
  style,
}: AnimatedSelectionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const radioScaleAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(radioScaleAnim, {
      toValue: selected ? 1 : 0,
      tension: 60,
      friction: 6,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [selected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          selected && styles.cardSelected,
        ]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.09)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
});
