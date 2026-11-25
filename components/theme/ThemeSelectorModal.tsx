import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { THEME_LIST, ThemeDefinition, getTheme } from '../../constants/themes';
import { useThemeStore, AutoNightMode, AppFontFamily } from '../../store/themeStore';
import { useUserStore, UserTier } from '../../store/userStore';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

// 10 Telegram Color Accent Swatches
const ACCENT_SWATCHES = [
  { id: 'blue', color: '#2AABEE', label: 'Telegram Blue', isPro: false },
  { id: 'cyan', color: '#06B6D4', label: 'Cyan Wave', isPro: false },
  { id: 'green', color: '#00E676', label: 'FitPulse Emerald', isPro: false },
  { id: 'pink', color: '#EC4899', label: 'Bubblegum Pink', isPro: true },
  { id: 'amber', color: '#D97706', label: 'Amber Bronze', isPro: true },
  { id: 'purple', color: '#8B5CF6', label: 'Electric Purple', isPro: true },
  { id: 'red', color: '#EF4444', label: 'Crimson Red', isPro: true },
  { id: 'slate', color: '#475569', label: 'Slate Dark', isPro: true },
  { id: 'gold', color: '#F59E0B', label: 'Cyber Gold', isPro: true },
];

const NAME_COLORS = [
  '#EC4899', // Pink (Telegram default)
  '#00E676', // Emerald
  '#2AABEE', // Sky Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Gold
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export default function ThemeSelectorModal({ visible, onClose }: ThemeSelectorModalProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const isPro = user.tier === UserTier.PREMIUM;

  const {
    activeThemeId,
    setTheme,
    customAccentColor,
    setCustomAccentColor,
    useSystemAccent,
    setUseSystemAccent,
    nameColor,
    setNameColor,
    autoNightMode,
    setAutoNightMode,
    fontFamily,
    setFontFamily,
  } = useThemeStore();

  const activeTheme = getTheme(activeThemeId);
  const activeAccent = customAccentColor || activeTheme.preview.accentColor;

  // Sub-modals & sheets
  const [showProPrompt, setShowProPrompt] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('PRO Feature');
  const [showColorCreator, setShowColorCreator] = useState(false);
  const [hexInput, setHexInput] = useState(activeAccent);
  const [showNameColorModal, setShowNameColorModal] = useState(false);
  const [showNightModal, setShowNightModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);

  const requirePro = (featureName: string, action: () => void) => {
    if (isPro) {
      action();
    } else {
      setProFeatureName(featureName);
      setShowProPrompt(true);
    }
  };

  const handleSelectTheme = (theme: ThemeDefinition) => {
    if (!theme.isFree && !isPro) {
      requirePro(`${theme.label} Theme`, () => setTheme(theme.id));
      return;
    }
    setTheme(theme.id);
  };

  const handleSelectAccent = (swatch: typeof ACCENT_SWATCHES[0]) => {
    if (swatch.isPro) {
      requirePro(`${swatch.label} Accent`, () => {
        setCustomAccentColor(swatch.color);
      });
    } else {
      setCustomAccentColor(swatch.color);
    }
  };

  const handleApplyCustomHex = () => {
    let cleanHex = hexInput.trim();
    if (!cleanHex.startsWith('#')) {
      cleanHex = '#' + cleanHex;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      setCustomAccentColor(cleanHex);
      setShowColorCreator(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: activeTheme.colors.surface }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="color-palette" size={24} color={activeAccent} />
              <Text style={[styles.headerTitle, { color: activeTheme.colors.textPrimary }]}>
                Themes
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Subtitle */}
            <Text style={[styles.sectionSubtitle, { color: activeTheme.colors.textMuted }]}>
              Select your preferred app atmosphere
            </Text>

            {/* ── 1. ORIGINAL PHONE MOCKUP CARDS CAROUSEL (Image 1 Restored with Day) ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
            >
              {THEME_LIST.map((theme) => {
                const isActive = activeThemeId === theme.id;
                const isThemeLocked = !theme.isFree && !isPro;

                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={styles.cardItem}
                    activeOpacity={0.85}
                    onPress={() => handleSelectTheme(theme)}
                  >
                    {/* Exact Original Phone Mockup (Image 1) */}
                    <View
                      style={[
                        styles.phoneMockup,
                        {
                          backgroundColor: theme.preview.bgColor,
                          borderColor: isActive ? theme.preview.accentColor : theme.colors.border,
                          borderWidth: isActive ? 2.5 : 1,
                        },
                      ]}
                    >
                      {/* Top mini header notch */}
                      <View style={[styles.mockupHeader, { backgroundColor: theme.preview.surfaceColor }]}>
                        <View style={[styles.mockupDot, { backgroundColor: theme.preview.accentColor }]} />
                        <View style={[styles.mockupBar, { backgroundColor: theme.colors.borderLight }]} />
                      </View>

                      {/* Mockup Chat Bubbles (Image 1) */}
                      <View style={styles.mockupBody}>
                        {/* Bubble 1: Incoming message */}
                        <View
                          style={[
                            styles.mockupBubbleLeft,
                            { backgroundColor: theme.preview.surfaceColor },
                          ]}
                        >
                          <View
                            style={[
                              styles.mockupTextLine,
                              { backgroundColor: theme.colors.borderLight, width: '70%' },
                            ]}
                          />
                          <View
                            style={[
                              styles.mockupTextLine,
                              { backgroundColor: theme.colors.borderLight, width: '40%' },
                            ]}
                          />
                        </View>

                        {/* Bubble 2: Outgoing accent message */}
                        <View
                          style={[
                            styles.mockupBubbleRight,
                            {
                              backgroundColor: theme.preview.bubbleColor,
                              borderColor: theme.preview.accentColor,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.mockupTextLine,
                              { backgroundColor: theme.preview.accentColor, width: '80%' },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Bottom Radio Circle (Image 1) */}
                      <View style={styles.mockupBottom}>
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isActive
                                ? theme.preview.accentColor
                                : 'rgba(255, 255, 255, 0.35)',
                              backgroundColor: isActive ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
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

                      {/* PRO Lock overlay */}
                      {isThemeLocked && (
                        <View style={styles.lockOverlay}>
                          <View style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={11} color="#000" />
                            <Text style={styles.lockBadgeText}>PRO</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Label below phone card */}
                    <Text
                      style={[
                        styles.themeCardLabel,
                        {
                          color: isActive ? theme.preview.accentColor : activeTheme.colors.textPrimary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {theme.label}
                    </Text>

                    {/* Free or PRO status text */}
                    {theme.isFree ? (
                      <Text style={[styles.themeStatusText, { color: activeTheme.colors.textMuted }]}>
                        Free
                      </Text>
                    ) : (
                      <View style={styles.proTag}>
                        <Ionicons name="sparkles" size={10} color="#FDBF2D" />
                        <Text style={styles.proTagText}>PRO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── 2. COLOR ACCENT SWATCHES & CUSTOM COLOR CREATOR ── */}
            <Text style={[styles.sectionHeading, { color: activeTheme.colors.textSecondary }]}>
              Color Accent
            </Text>

            <View style={styles.swatchesRow}>
              {ACCENT_SWATCHES.map((swatch) => {
                const isSelected = activeAccent.toLowerCase() === swatch.color.toLowerCase();
                return (
                  <TouchableOpacity
                    key={swatch.id}
                    style={styles.swatchWrap}
                    onPress={() => handleSelectAccent(swatch)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.swatchCircle, { backgroundColor: swatch.color }]}>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      ) : swatch.isPro && !isPro ? (
                        <Ionicons name="lock-closed" size={11} color="rgba(0,0,0,0.6)" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* 🎨 Rainbow / Custom Color Creator Button (PRO) */}
              <TouchableOpacity
                style={styles.swatchWrap}
                onPress={() =>
                  requirePro('Custom Color Creator', () => {
                    setHexInput(activeAccent);
                    setShowColorCreator(true);
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.rainbowCircle}>
                  <Ionicons name="color-palette" size={17} color="#FFF" />
                  {!isPro && (
                    <View style={styles.miniLockBadge}>
                      <Ionicons name="lock-closed" size={8} color="#000" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* ── 3. SYSTEM ACCENT COLOR CHECKBOX (PRO) ── */}
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() =>
                requirePro('System Accent Color', () => {
                  setUseSystemAccent(!useSystemAccent);
                })
              }
            >
              <View
                style={[
                  styles.checkboxSquare,
                  {
                    borderColor: useSystemAccent ? activeAccent : activeTheme.colors.borderLight,
                    backgroundColor: useSystemAccent ? activeAccent : 'transparent',
                  },
                ]}
              >
                {useSystemAccent && <Ionicons name="checkmark" size={16} color="#000" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: activeTheme.colors.textPrimary }]}>
                System accent color
              </Text>
              {!isPro && (
                <View style={styles.proSmallPill}>
                  <Text style={styles.proSmallPillText}>PRO</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: activeTheme.colors.border }]} />

            {/* ── 4. THEME SETTINGS (IMAGE 2) ── */}
            <Text style={[styles.sectionHeading, { color: activeAccent, marginTop: 4 }]}>
              Theme settings
            </Text>

            {/* 1. Your name color (PRO ACC ብቻ) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: activeTheme.colors.border }]}
              activeOpacity={0.75}
              onPress={() =>
                requirePro('Your Name Color', () => {
                  setShowNameColorModal(true);
                })
              }
            >
              <View style={styles.settingLeft}>
                <Ionicons name="brush-outline" size={20} color={activeTheme.colors.textMuted} />
                <Text style={[styles.settingLabel, { color: activeTheme.colors.textPrimary }]}>
                  Your name color
                </Text>
              </View>

              <View style={styles.settingRight}>
                {/* Styled Name Pill Preview (Matches Image 2 "فؤاد") */}
                <View
                  style={[
                    styles.namePill,
                    {
                      backgroundColor: nameColor + '20',
                      borderColor: nameColor + '50',
                    },
                  ]}
                >
                  <Text style={[styles.namePillText, { color: nameColor }]}>
                    {user.name || 'User'}
                  </Text>
                </View>
                {!isPro && (
                  <View style={styles.proSmallPill}>
                    <Text style={styles.proSmallPillText}>PRO</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={activeTheme.colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* 2. Auto-night mode */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: activeTheme.colors.border }]}
              activeOpacity={0.75}
              onPress={() => setShowNightModal(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={20} color={activeTheme.colors.textMuted} />
                <Text style={[styles.settingLabel, { color: activeTheme.colors.textPrimary }]}>
                  Auto-night mode
                </Text>
              </View>

              <View style={styles.settingRight}>
                <Text style={[styles.settingValText, { color: activeTheme.colors.textMuted }]}>
                  {autoNightMode === 'off'
                    ? 'Off'
                    : autoNightMode === 'scheduled'
                    ? 'Scheduled'
                    : 'System'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={activeTheme.colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* 3. Font family */}
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.75}
              onPress={() => setShowFontModal(true)}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.fontAIcon,
                    { borderColor: activeTheme.colors.borderLight },
                  ]}
                >
                  <Text style={[styles.fontAIconText, { color: activeTheme.colors.textMuted }]}>
                    A
                  </Text>
                </View>
                <Text style={[styles.settingLabel, { color: activeTheme.colors.textPrimary }]}>
                  Font family
                </Text>
              </View>

              <View style={styles.settingRight}>
                <Text style={[styles.settingValText, { color: activeTheme.colors.textMuted }]}>
                  {fontFamily}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={activeTheme.colors.textMuted} />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* ── SUB-MODAL A: Custom Color Creator (PRO) ── */}
          <Modal visible={showColorCreator} transparent animationType="fade">
            <View style={styles.subModalOverlay}>
              <View
                style={[
                  styles.subModalBox,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: activeTheme.colors.border,
                  },
                ]}
              >
                <View style={styles.subModalHeader}>
                  <Text style={[styles.subModalTitle, { color: activeTheme.colors.textPrimary }]}>
                    🎨 Custom Color Creator
                  </Text>
                  <TouchableOpacity onPress={() => setShowColorCreator(false)}>
                    <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: activeTheme.colors.textMuted, fontSize: 13, marginBottom: 14 }}>
                  Enter any custom HEX color code to apply across your app:
                </Text>

                <View style={styles.hexInputRow}>
                  <View style={[styles.colorPreviewBox, { backgroundColor: hexInput || '#00E676' }]} />
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        backgroundColor: activeTheme.colors.background,
                        color: activeTheme.colors.textPrimary,
                        borderColor: activeTheme.colors.border,
                      },
                    ]}
                    value={hexInput}
                    onChangeText={setHexInput}
                    placeholder="#00E676"
                    placeholderTextColor={activeTheme.colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={7}
                  />
                </View>

                {/* Quick Presets */}
                <View style={styles.presetColorRow}>
                  {['#FF1493', '#00F0FF', '#7928CA', '#FF4D4D', '#F5A623', '#50E3C2'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.presetDot, { backgroundColor: c }]}
                      onPress={() => setHexInput(c)}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: activeAccent }]}
                  onPress={handleApplyCustomHex}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>Apply Color</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ── SUB-MODAL B: Choose Your Name Color (PRO) ── */}
          <Modal visible={showNameColorModal} transparent animationType="fade">
            <View style={styles.subModalOverlay}>
              <View
                style={[
                  styles.subModalBox,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: activeTheme.colors.border,
                  },
                ]}
              >
                <View style={styles.subModalHeader}>
                  <Text style={[styles.subModalTitle, { color: activeTheme.colors.textPrimary }]}>
                    🏷 Choose Your Name Color
                  </Text>
                  <TouchableOpacity onPress={() => setShowNameColorModal(false)}>
                    <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: activeTheme.colors.textMuted, fontSize: 13, marginBottom: 16 }}>
                  Select the accent color used to highlight your name in chats and profiles:
                </Text>

                <View style={styles.nameColorsGrid}>
                  {NAME_COLORS.map((color) => {
                    const isSelected = nameColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.nameColorItem,
                          {
                            backgroundColor: color + '15',
                            borderColor: isSelected ? color : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          setNameColor(color);
                          setShowNameColorModal(false);
                        }}
                      >
                        <View style={[styles.nameDot, { backgroundColor: color }]} />
                        <Text style={[styles.nameSampleText, { color }]}>
                          {user.name || 'User'}
                        </Text>
                        {isSelected && <Ionicons name="checkmark" size={16} color={color} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Modal>

          {/* ── SUB-MODAL C: Auto-Night Mode Picker ── */}
          <Modal visible={showNightModal} transparent animationType="fade">
            <View style={styles.subModalOverlay}>
              <View
                style={[
                  styles.subModalBox,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: activeTheme.colors.border,
                  },
                ]}
              >
                <View style={styles.subModalHeader}>
                  <Text style={[styles.subModalTitle, { color: activeTheme.colors.textPrimary }]}>
                    🌙 Auto-Night Mode
                  </Text>
                  <TouchableOpacity onPress={() => setShowNightModal(false)}>
                    <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {(['off', 'scheduled', 'system'] as AutoNightMode[]).map((mode) => {
                  const isSelected = autoNightMode === mode;
                  const label =
                    mode === 'off'
                      ? 'Off (Always use selected theme)'
                      : mode === 'scheduled'
                      ? 'Scheduled (Night mode 8:00 PM – 7:00 AM)'
                      : 'System (Match device OS Dark/Light)';
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.pickerOptionRow,
                        isSelected && { backgroundColor: activeTheme.colors.primary + '18' },
                      ]}
                      onPress={() => {
                        setAutoNightMode(mode);
                        setShowNightModal(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: activeTheme.colors.textPrimary }]}>
                        {label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={activeTheme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Modal>

          {/* ── SUB-MODAL D: Font Family Picker ── */}
          <Modal visible={showFontModal} transparent animationType="fade">
            <View style={styles.subModalOverlay}>
              <View
                style={[
                  styles.subModalBox,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: activeTheme.colors.border,
                  },
                ]}
              >
                <View style={styles.subModalHeader}>
                  <Text style={[styles.subModalTitle, { color: activeTheme.colors.textPrimary }]}>
                    🔤 Font Family
                  </Text>
                  <TouchableOpacity onPress={() => setShowFontModal(false)}>
                    <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {(['Default', 'Modern', 'Monospace', 'Rounded'] as AppFontFamily[]).map((f) => {
                  const isSelected = fontFamily === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.pickerOptionRow,
                        isSelected && { backgroundColor: activeTheme.colors.primary + '18' },
                      ]}
                      onPress={() => {
                        setFontFamily(f);
                        setShowFontModal(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: activeTheme.colors.textPrimary }]}>
                        {f}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={activeTheme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Modal>

          {/* ── SUB-MODAL E: PRO Upgrade Prompt ── */}
          <Modal visible={showProPrompt} transparent animationType="fade">
            <View style={styles.subModalOverlay}>
              <View
                style={[
                  styles.subModalBox,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: '#00E676',
                  },
                ]}
              >
                <View style={styles.subModalHeader}>
                  <View style={styles.proTitleWrap}>
                    <Ionicons name="sparkles" size={20} color="#00E676" />
                    <Text style={[styles.subModalTitle, { color: '#00E676' }]}>FitPulse PRO</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowProPrompt(false)}>
                    <Ionicons name="close" size={22} color={activeTheme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.proPromptDesc, { color: activeTheme.colors.textSecondary }]}>
                  <Text style={{ fontWeight: '800', color: activeTheme.colors.textPrimary }}>
                    {proFeatureName}
                  </Text>{' '}
                  is an exclusive FitPulse PRO feature. Upgrade to unlock full theme customization,
                  name colors, custom color creators, and system accents.
                </Text>

                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: '#00E676', flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
                  onPress={() => {
                    setShowProPrompt(false);
                    onClose();
                    setTimeout(() => router.push('/wallet'), 200);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>Upgrade to PRO</Text>
                  <Ionicons name="arrow-forward" size={15} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  // 1. EXACT ORIGINAL PHONE MOCKUPS (Image 1 Style Restored)
  cardsRow: {
    gap: 12,
    paddingRight: 20,
    marginBottom: 20,
  },
  cardItem: {
    alignItems: 'center',
    width: 90,
  },
  phoneMockup: {
    width: 90,
    height: 154,
    borderRadius: 22,
    padding: 7,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  mockupDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  mockupBar: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
  },
  mockupBody: {
    gap: 6,
    marginVertical: 4,
  },
  mockupBubbleLeft: {
    padding: 5,
    borderRadius: 6,
    width: '82%',
    gap: 3,
  },
  mockupBubbleRight: {
    padding: 5,
    borderRadius: 6,
    width: '82%',
    alignSelf: 'flex-end',
    borderWidth: 0.5,
  },
  mockupTextLine: {
    height: 3,
    borderRadius: 1.5,
  },
  mockupBottom: {
    alignItems: 'center',
    paddingBottom: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FDBF2D',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockBadgeText: {
    color: '#000',
    fontSize: 9.5,
    fontWeight: '900',
  },
  themeCardLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  themeStatusText: {
    fontSize: 11,
    marginTop: 1,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  proTagText: {
    color: '#FDBF2D',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // 2. Swatches Row
  swatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  swatchWrap: {
    padding: 2,
  },
  swatchCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rainbowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  miniLockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFD700',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 3. System Accent Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  proSmallPill: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#00E676',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  proSmallPillText: {
    color: '#00E676',
    fontSize: 9.5,
    fontWeight: '800',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },

  // 4. Theme Settings Section
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  namePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  namePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  settingValText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fontAIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontAIconText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Sub-Modals
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  proTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proPromptDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 14,
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  colorPreviewBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hexInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
  },
  presetColorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  presetDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  applyBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  nameColorsGrid: {
    gap: 10,
  },
  nameColorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  nameDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  nameSampleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
