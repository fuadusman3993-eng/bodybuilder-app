import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDomainStore, AppDomain } from '../../store/domainStore';
import { useTheme } from '../../store/themeStore';

const DOMAINS: { key: AppDomain; label: string }[] = [
  { key: 'Health', label: 'Health' },
  { key: 'Football', label: 'Football' },
  { key: 'Fitness', label: 'Fitness' },
];

export default function HomeTopTabBar() {
  const { currentDomain, setDomain } = useDomainStore();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {DOMAINS.map((d) => {
        const isActive = currentDomain === d.key;
        return (
          <TouchableOpacity
            key={d.key}
            style={styles.tabBtn}
            onPress={() => setDomain(d.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? colors.textPrimary : colors.textMuted },
                isActive && styles.activeTabText,
              ]}
            >
              {d.label}
            </Text>
            {isActive && (
              <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flex: 1,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '800',
    fontSize: 16,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 3,
    borderRadius: 1.5,
  },
});
