import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';

function CreateTabButton({ onPress, primaryColor, bgColor }: { onPress?: any; primaryColor?: string; bgColor?: string }) {
  const bg = primaryColor || Colors.primary;
  const iconColor = bgColor || Colors.background;
  return (
    <TouchableOpacity style={styles.createButton} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.createButtonInner, { backgroundColor: bg, shadowColor: bg }]}>
        <Ionicons name="add" size={28} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const activeTheme = useThemeStore((s) => s.getActiveTheme());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: activeTheme.colors.background },
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: activeTheme.colors.tabBar,
            borderTopColor: activeTheme.colors.tabBarBorder,
            height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          },
        ],
        tabBarActiveTintColor: activeTheme.colors.primary,
        tabBarInactiveTintColor: activeTheme.colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <CreateTabButton
              onPress={props.onPress}
              primaryColor={activeTheme.colors.primary}
              bgColor={activeTheme.colors.background}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopColor: Colors.tabBarBorder,
    borderTopWidth: 1,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  createButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    backgroundColor: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    minWidth: 18,
    height: 18,
    lineHeight: 18,
    borderRadius: 9,
  },
});
