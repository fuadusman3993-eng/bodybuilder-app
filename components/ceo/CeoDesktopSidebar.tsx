import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BrandLogo from '../ui/BrandLogo';

export type CeoNavTab = 'home' | 'chat' | 'errors' | 'users' | 'finance' | 'controls';

interface CeoDesktopSidebarProps {
  activeTab: CeoNavTab;
  onSelectTab: (tab: CeoNavTab) => void;
  unresolvedErrorsCount: number;
  onLogout: () => void;
}

interface NavItemDef {
  key: CeoNavTab;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  badgeColor?: string;
}

export default function CeoDesktopSidebar({
  activeTab,
  onSelectTab,
  unresolvedErrorsCount,
  onLogout,
}: CeoDesktopSidebarProps) {
  const navItems: NavItemDef[] = [
    {
      key: 'home',
      title: 'Home',
      subtitle: 'Dashboard',
      icon: 'home',
    },
    {
      key: 'chat',
      title: 'Chat',
      subtitle: 'AI Operations',
      icon: 'chatbubbles',
    },
    {
      key: 'errors',
      title: 'Errors',
      subtitle: 'System Issues',
      icon: 'warning',
      badge: unresolvedErrorsCount > 0 ? unresolvedErrorsCount : 3,
      badgeColor: '#EF4444',
    },
    {
      key: 'users',
      title: 'Users',
      subtitle: 'User Management',
      icon: 'people',
    },
    {
      key: 'finance',
      title: 'Finance',
      subtitle: 'Payments & Revenue',
      icon: 'card',
    },
    {
      key: 'controls',
      title: 'Controls',
      subtitle: 'Settings & Controls',
      icon: 'settings',
    },
  ];

  return (
    <View style={styles.sidebar}>
      {/* ── BRAND LOGO ── */}
      <View style={styles.brandContainer}>
        <View style={styles.brandLogoRow}>
          <BrandLogo size="small" showText={false} />
          <View style={{ marginLeft: 4 }}>
            <Text style={styles.brandTitle}>FitPulse</Text>
            <Text style={styles.brandSub}>MISSION CONTROL</Text>
          </View>
        </View>
      </View>

      {/* ── NAVIGATION LIST ── */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.key;

          if (isActive) {
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.9}
                onPress={() => onSelectTab(item.key)}
                style={styles.activePillWrapper}
              >
                <LinearGradient
                  colors={['#00E676', '#00B359']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activePill}
                >
                  <View style={styles.navItemLeft}>
                    <Ionicons name={item.icon} size={22} color="#FFFFFF" style={styles.navIcon} />
                    <View>
                      <Text style={styles.activeTitle}>{item.title}</Text>
                      <Text style={styles.activeSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>

                  {item.badge && item.badge > 0 ? (
                    <View style={[styles.badgeContainer, { backgroundColor: item.badgeColor || '#EF4444' }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(item.key)}
              style={styles.inactiveNavItem}
            >
              <View style={styles.navItemLeft}>
                <Ionicons name={item.icon} size={22} color="#8A95A5" style={styles.navIcon} />
                <View>
                  <Text style={styles.inactiveTitle}>{item.title}</Text>
                  <Text style={styles.inactiveSubtitle}>{item.subtitle}</Text>
                </View>
              </View>

              {item.badge && item.badge > 0 ? (
                <View style={[styles.badgeContainer, { backgroundColor: item.badgeColor || '#EF4444' }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── FOOTER: CEO ADMIN & LOGOUT ── */}
      <View style={styles.sidebarFooter}>
        <View style={styles.profileBox}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>CEO Admin</Text>
            <Text style={styles.profileRole}>Super Admin</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color="#8A95A5" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#070D18',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandContainer: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    gap: 8,
  },
  activePillWrapper: {
    borderRadius: 12,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  inactiveNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  navIcon: {
    width: 24,
  },
  activeTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  activeSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  inactiveTitle: {
    color: '#E0E6ED',
    fontSize: 14.5,
    fontWeight: '600',
  },
  inactiveSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  badgeContainer: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  sidebarFooter: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  profileRole: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  logoutText: {
    color: '#8A95A5',
    fontSize: 13,
    fontWeight: '600',
  },
});
