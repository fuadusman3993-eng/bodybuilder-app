/**
 * AvatarCustomizerModal
 * ─────────────────────
 * Slide-up modal for picking avatar color + icon style.
 * Shows a live preview of the resulting avatar.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import UserAvatar, {
  FITNESS_AVATAR_COLORS,
  FITNESS_AVATAR_ICON_NAMES,
  AvatarIconStyle,
} from '../ui/UserAvatar';

interface Props {
  visible: boolean;
  onClose: () => void;
  uid?: string;
  name?: string;
  currentColor?: string;
  currentIcon?: AvatarIconStyle;
  onSave: (color: string, icon: AvatarIconStyle) => Promise<void>;
}

const ICONS: AvatarIconStyle[] = [
  'initials',
  'flash',
  'barbell',
  'flame',
  'trophy',
  'shield-checkmark',
];

const ICON_LABEL: Record<AvatarIconStyle, string> = {
  initials: 'Initials',
  flash: 'Flash',
  barbell: 'Barbell',
  flame: 'Flame',
  trophy: 'Trophy',
  'shield-checkmark': 'Shield',
};

export default function AvatarCustomizerModal({
  visible,
  onClose,
  uid,
  name,
  currentColor,
  currentIcon = 'initials',
  onSave,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string>(
    currentColor || FITNESS_AVATAR_COLORS[0]
  );
  const [selectedIcon, setSelectedIcon] = useState<AvatarIconStyle>(currentIcon);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedColor, selectedIcon);
      onClose();
    } catch (_) {
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Title */}
        <Text style={styles.title}>Customize Avatar</Text>

        {/* Live preview */}
        <View style={styles.previewWrap}>
          <UserAvatar
            uid={uid}
            name={name}
            avatarColor={selectedColor}
            avatarIcon={selectedIcon}
            size={90}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Color palette */}
          <Text style={styles.sectionLabel}>Choose Colour</Text>
          <View style={styles.colorGrid}>
            {FITNESS_AVATAR_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(c)}
                activeOpacity={0.8}
              >
                {selectedColor === c && (
                  <Ionicons name="checkmark" size={18} color={c === '#334155' ? '#FFF' : '#000'} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon styles */}
          <Text style={styles.sectionLabel}>Choose Style</Text>
          <View style={styles.iconRow}>
            {ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
                activeOpacity={0.8}
              >
                {/* Mini preview using the actual UserAvatar */}
                <UserAvatar
                  uid={uid}
                  name={name}
                  avatarColor={selectedColor}
                  avatarIcon={icon}
                  size={44}
                />
                <Text
                  style={[
                    styles.iconLabel,
                    selectedIcon === icon && { color: Colors.primary },
                  ]}
                >
                  {ICON_LABEL[icon]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save Avatar Style</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0E1A2B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  iconOption: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,230,118,0.08)',
  },
  iconLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});
