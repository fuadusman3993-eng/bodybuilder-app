import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Platform, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { THEME_LIST, ThemeDefinition, getTheme } from '../../constants/themes';
import { useThemeStore } from '../../store/themeStore';
import { useUserStore } from '../../store/userStore';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ThemeSelectorModal({ visible, onClose }: ThemeSelectorModalProps) {
  const router = useRouter();
  const { activeThemeId, setTheme, unlockTheme, isThemeUnlocked } = useThemeStore();
  const { user } = useUserStore();
  const coinsBalance = user.coinsBalance ?? 0;

  const [selectedThemeForUnlock, setSelectedThemeForUnlock] = useState<ThemeDefinition | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const activeTheme = getTheme(activeThemeId);

  const handleSelectTheme = (theme: ThemeDefinition) => {
    const unlocked = isThemeUnlocked(theme.id);
    if (!unlocked) {
      setSelectedThemeForUnlock(theme);
      return;
    }
    setTheme(theme.id);
  };

  const handleConfirmUnlock = async () => {
    if (!selectedThemeForUnlock) return;
    setUnlocking(true);
    try {
      const res = await unlockTheme(selectedThemeForUnlock.id);
      if (res.success) {
        setSelectedThemeForUnlock(null);
      } else {
        if (Platform.OS === 'web') {
          window.alert(res.error || 'Unlock failed');
        } else {
          Alert.alert('Unable to Unlock', res.error || 'Please check your coin balance.');
        }
      }
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: activeTheme.colors.surface }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Handle */}
          <View style={styles.handle} />

          {/* Header (Telegram Theme Style) */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="color-palette" size={24} color={activeTheme.colors.primary} />
              <Text style={[styles.headerTitle, { color: activeTheme.colors.textPrimary }]}>
                Themes
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* ── 1. THEME PHONE PREVIEW CARDS (Matches Image 1) ── */}
            <Text style={[styles.sectionSubtitle, { color: activeTheme.colors.textMuted }]}>
              Select your preferred app atmosphere
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
            >
              {THEME_LIST.map((theme) => {
                const isActive = activeThemeId === theme.id;
                const isUnlocked = isThemeUnlocked(theme.id);

                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={styles.cardItem}
                    activeOpacity={0.85}
                    onPress={() => handleSelectTheme(theme)}
                  >
                    {/* Phone Screen Mockup Card */}
                    <View
                      style={[
                        styles.phoneMockup,
                        {
                          backgroundColor: theme.preview.bgColor,
                          borderColor: isActive
                            ? theme.preview.accentColor
                            : theme.colors.border,
                          borderWidth: isActive ? 2.5 : 1,
                        },
                      ]}
                    >
                      {/* Top mini header */}
                      <View style={[styles.mockupHeader, { backgroundColor: theme.preview.surfaceColor }]}>
                        <View style={[styles.mockupDot, { backgroundColor: theme.preview.accentColor }]} />
                        <View style={[styles.mockupBar, { backgroundColor: theme.colors.borderLight }]} />
                      </View>

                      {/* Mockup Chat / Card Bubbles (Matching Image 1) */}
                      <View style={styles.mockupBody}>
                        {/* Bubble 1: Incoming message */}
                        <View
                          style={[
                            styles.mockupBubbleLeft,
                            { backgroundColor: theme.preview.surfaceColor },
                          ]}
                        >
                          <View style={[styles.mockupTextLine, { backgroundColor: theme.colors.borderLight, width: '70%' }]} />
                          <View style={[styles.mockupTextLine, { backgroundColor: theme.colors.borderLight, width: '40%' }]} />
                        </View>

                        {/* Bubble 2: Outgoing accent message */}
                        <View
                          style={[
                            styles.mockupBubbleRight,
                            {
                              backgroundColor: theme.preview.bubbleColor,
                              borderColor: theme.preview.accentColor,
                              borderWidth: 0.5,
                            },
                          ]}
                        >
                          <View style={[styles.mockupTextLine, { backgroundColor: theme.preview.accentColor, width: '80%' }]} />
                        </View>
                      </View>

                      {/* Bottom Radio Checkmark Circle (Matches Image 1) */}
                      <View style={styles.mockupBottom}>
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isActive
                                ? theme.preview.accentColor
                                : 'rgba(255, 255, 255, 0.35)',
                              backgroundColor: isActive
                                ? 'transparent'
                                : 'rgba(0, 0, 0, 0.2)',
                            },
                          ]}
                        >
                          {isActive && (
                            <View
                              style={[
                                styles.radioCircleInner,
                                { backgroundColor: theme.preview.accentColor },
                              ]}
                            />
                          )}
                        </View>
                      </View>

                      {/* Lock Overlay if locked */}
                      {!isUnlocked && (
                        <View style={styles.lockOverlay}>
                          <View style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={13} color="#000" />
                            <Text style={styles.lockBadgeText}>PRO</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Theme Label Below Card */}
                    <Text
                      style={[
                        styles.themeCardLabel,
                        {
                          color: isActive
                            ? theme.preview.accentColor
                            : activeTheme.colors.textPrimary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {theme.label}
                    </Text>

                    {/* Badge: Free or Coins */}
                    {theme.isFree ? (
                      <Text style={[styles.themeStatusText, { color: activeTheme.colors.textMuted }]}>
                        Free
                      </Text>
                    ) : (
                      <View style={styles.proTag}>
                        <Ionicons name="sparkles" size={10} color="#FDBF2D" />
                        <Text style={styles.proTagText}>🪙 {theme.unlockCostCoins}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── 2. COLOR ACCENT CIRCLES (Matches Image 1) ── */}
            <View style={styles.accentSection}>
              <Text style={[styles.sectionHeading, { color: activeTheme.colors.textSecondary }]}>
                Color Accent
              </Text>

              <View style={styles.swatchRow}>
                {THEME_LIST.map((theme) => {
                  const isActive = activeThemeId === theme.id;
                  const isUnlocked = isThemeUnlocked(theme.id);

                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[
                        styles.swatchBtn,
                        isActive && [
                          styles.swatchBtnActive,
                          { borderColor: theme.preview.accentColor },
                        ],
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectTheme(theme)}
                    >
                      <View
                        style={[
                          styles.swatchCircle,
                          { backgroundColor: theme.preview.accentColor },
                        ]}
                      >
                        {!isUnlocked && (
                          <Ionicons name="lock-closed" size={12} color="#000" />
                        )}
                        {isActive && isUnlocked && (
                          <Ionicons name="checkmark" size={14} color="#000" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── 3. ACTIVE PALETTE DETAILS ── */}
            <View
              style={[
                styles.detailsBox,
                {
                  backgroundColor: activeTheme.colors.background,
                  borderColor: activeTheme.colors.border,
                },
              ]}
            >
              <View style={styles.detailsHeader}>
                <View
                  style={[
                    styles.detailsIndicator,
                    { backgroundColor: activeTheme.colors.primary },
                  ]}
                />
                <Text style={[styles.detailsTitle, { color: activeTheme.colors.textPrimary }]}>
                  {activeTheme.name}
                </Text>
              </View>

              <Text style={[styles.detailsDesc, { color: activeTheme.colors.textMuted }]}>
                {activeTheme.description}
              </Text>

              <View style={styles.paletteChipsRow}>
                <View style={styles.paletteChip}>
                  <View style={[styles.chipColorDot, { backgroundColor: activeTheme.colors.background }]} />
                  <Text style={[styles.chipText, { color: activeTheme.colors.textMuted }]}>
                    BG: {activeTheme.colors.background}
                  </Text>
                </View>

                <View style={styles.paletteChip}>
                  <View style={[styles.chipColorDot, { backgroundColor: activeTheme.colors.surface }]} />
                  <Text style={[styles.chipText, { color: activeTheme.colors.textMuted }]}>
                    Surface: {activeTheme.colors.surface}
                  </Text>
                </View>

                <View style={styles.paletteChip}>
                  <View style={[styles.chipColorDot, { backgroundColor: activeTheme.colors.primary }]} />
                  <Text style={[styles.chipText, { color: activeTheme.colors.textMuted }]}>
                    Accent: {activeTheme.colors.primary}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── 4. WALLET & COIN SHORTCUT ── */}
            <TouchableOpacity
              style={[
                styles.walletRow,
                {
                  backgroundColor: activeTheme.colors.surfaceLight,
                  borderColor: activeTheme.colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                setTimeout(() => router.push('/wallet'), 200);
              }}
            >
              <View style={styles.walletLeft}>
                <Ionicons name="wallet-outline" size={20} color={activeTheme.colors.primary} />
                <Text style={[styles.walletTitle, { color: activeTheme.colors.textPrimary }]}>
                  FitPulse Balance
                </Text>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletCoins}>🪙 {coinsBalance} Coins</Text>
                <Ionicons name="chevron-forward" size={16} color={activeTheme.colors.textMuted} />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* ── 5. UNLOCK PREMIUM THEME MODAL SHEET ── */}
          {selectedThemeForUnlock && (
            <View style={styles.unlockModalWrapper}>
              <View
                style={[
                  styles.unlockSheet,
                  {
                    backgroundColor: activeTheme.colors.background,
                    borderColor: activeTheme.colors.border,
                  },
                ]}
              >
                <View style={styles.unlockHeaderRow}>
                  <View style={styles.proPill}>
                    <Ionicons name="sparkles" size={13} color="#000" />
                    <Text style={styles.proPillText}>FITPULSE PRO THEME</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedThemeForUnlock(null)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={20} color={activeTheme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.unlockTitle, { color: activeTheme.colors.textPrimary }]}>
                  {selectedThemeForUnlock.name}
                </Text>
                <Text style={[styles.unlockSubtitle, { color: activeTheme.colors.textMuted }]}>
                  {selectedThemeForUnlock.description}
                </Text>

                <View style={styles.unlockCostBox}>
                  <Text style={[styles.costLabel, { color: activeTheme.colors.textSecondary }]}>
                    Unlock Price
                  </Text>
                  <Text style={styles.costValue}>
                    🪙 {selectedThemeForUnlock.unlockCostCoins} Coins
                  </Text>
                  <Text style={[styles.balanceNote, { color: activeTheme.colors.textMuted }]}>
                    Your Balance: 🪙 {coinsBalance} Coins
                  </Text>
                </View>

                {coinsBalance >= (selectedThemeForUnlock.unlockCostCoins || 0) ? (
                  <TouchableOpacity
                    style={[
                      styles.unlockActionBtn,
                      { backgroundColor: selectedThemeForUnlock.preview.accentColor },
                    ]}
                    activeOpacity={0.85}
                    disabled={unlocking}
                    onPress={handleConfirmUnlock}
                  >
                    <Ionicons name="lock-open" size={18} color="#000" />
                    <Text style={styles.unlockActionBtnText}>
                      {unlocking ? 'Unlocking...' : `Unlock Now (🪙 ${selectedThemeForUnlock.unlockCostCoins})`}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.unlockActionBtn, { backgroundColor: '#FDBF2D' }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedThemeForUnlock(null);
                      onClose();
                      setTimeout(() => router.push('/wallet'), 200);
                    }}
                  >
                    <Ionicons name="add-circle" size={18} color="#000" />
                    <Text style={styles.unlockActionBtnText}>
                      Get More Coins in Wallet
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  /* Cards Row matching Image 1 */
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  cardItem: {
    width: 102,
    alignItems: 'center',
  },
  phoneMockup: {
    width: 100,
    height: 154,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  mockupHeader: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  mockupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mockupBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  mockupBody: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    gap: 8,
  },
  mockupBubbleLeft: {
    width: '80%',
    padding: 6,
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    gap: 4,
  },
  mockupBubbleRight: {
    width: '75%',
    alignSelf: 'flex-end',
    padding: 6,
    borderRadius: 8,
    borderBottomRightRadius: 2,
  },
  mockupTextLine: {
    height: 4,
    borderRadius: 2,
  },
  mockupBottom: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDBF2D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  themeCardLabel: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  themeStatusText: {
    fontSize: 11,
    marginTop: 2,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  proTagText: {
    color: '#FDBF2D',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Accent section */
  accentSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  swatchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBtnActive: {
    borderWidth: 2,
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Details Box */
  detailsBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailsIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  detailsDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  paletteChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  paletteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
  },

  /* Wallet shortcut */
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletCoins: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDBF2D',
  },

  /* Unlock Sheet */
  unlockModalWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  unlockSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  unlockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDBF2D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proPillText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unlockTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  unlockSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  unlockCostBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  costValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FDBF2D',
    marginVertical: 4,
  },
  balanceNote: {
    fontSize: 12,
  },
  unlockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  unlockActionBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
});
