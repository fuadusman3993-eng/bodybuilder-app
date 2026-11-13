import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import {
  getRealRecentPhotos,
  pickRealPhotosFromDevice,
} from '../../lib/recentPhotosService';

const { width } = Dimensions.get('window');

interface ChatAttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onOpenCamera: () => void;
  onShareLocation: () => void;
  onShareWorkout: () => void;
  onSelectRecentMedia: (uri: string) => void;
  conversationId?: string;
  userUid?: string;
  onShareContact?: () => void;
  onPickDocument?: () => void;
  onCreatePoll?: () => void;
  onShareEvent?: () => void;
}

interface ActionItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: string;
  onPress: () => void;
}

export default function ChatAttachmentSheet({
  visible,
  onClose,
  onPickGallery,
  onOpenCamera,
  onShareLocation,
  onShareWorkout,
  onSelectRecentMedia,
  conversationId,
  userUid,
  onPickDocument,
  onShareEvent,
}: ChatAttachmentSheetProps) {
  const { colors } = useTheme();
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);

  // Fetch real recent photos (zero dummy stock data)
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    async function loadRecentPhotos() {
      try {
        const photos = await getRealRecentPhotos(conversationId, userUid);
        if (isMounted) {
          setRecentPhotos(photos);
        }
      } catch (err) {
        console.warn('[ChatAttachmentSheet] loadRecentPhotos error:', err);
      }
    }

    loadRecentPhotos();
    return () => {
      isMounted = false;
    };
  }, [visible, conversationId, userUid]);

  // Pick photos directly from device
  const handlePickFromDevice = async () => {
    try {
      const picked = await pickRealPhotosFromDevice();
      if (picked && picked.length > 0) {
        onClose();
        onSelectRecentMedia(picked[0]);
      }
    } catch (err) {
      console.warn('[ChatAttachmentSheet] handlePickFromDevice error:', err);
    }
  };

  // 1. Primary Row Actions (The 4 core features: Gallery, Camera, Location, Workout)
  const primaryActions: ActionItem[] = [
    {
      id: 'gallery',
      title: 'Gallery',
      icon: 'images',
      color: '#3B82F6',
      onPress: () => {
        onClose();
        onPickGallery();
      },
    },
    {
      id: 'camera',
      title: 'Camera',
      icon: 'camera',
      color: '#EC4899',
      onPress: () => {
        onClose();
        onOpenCamera();
      },
    },
    {
      id: 'location',
      title: 'Location',
      icon: 'location',
      color: '#10B981',
      onPress: () => {
        onClose();
        onShareLocation();
      },
    },
    {
      id: 'workout',
      title: 'Workout',
      icon: 'barbell',
      color: '#00E676',
      onPress: () => {
        onClose();
        onShareWorkout();
      },
    },
  ];

  // 2. Secondary Row Actions (Tucked neatly underneath: Document, Event)
  const secondaryActions: ActionItem[] = [
    {
      id: 'document',
      title: 'Document',
      icon: 'document-text',
      color: '#8B5CF6',
      onPress: () => {
        onClose();
        if (onPickDocument) onPickDocument();
      },
    },
    {
      id: 'event',
      title: 'Event',
      icon: 'calendar',
      color: '#F43F5E',
      badge: 'New',
      onPress: () => {
        onClose();
        if (onShareEvent) onShareEvent();
      },
    },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Handle Pill */}
          <View style={styles.handle} />

          {/* ── 1. Primary 4 FitPulse Actions (Gallery, Camera, Location, Workout) ── */}
          <View style={styles.primaryRow}>
            {primaryActions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={item.onPress}
              >
                <View style={[styles.circleIconWrap, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 2. Secondary Actions (Tucked underneath: Document & Event) ── */}
          <View style={styles.secondaryRow}>
            {secondaryActions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={item.onPress}
              >
                <View style={[styles.secondaryCircleWrap, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={20} color="#FFFFFF" />
                  {item.badge && (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.secondaryActionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 3. Real Recent Gallery Photos (Clear, Visible 76x76 Size) ── */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentHeaderText}>Recent Photos</Text>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onPickGallery();
                }}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>All Media →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {/* + Pick directly from device */}
              <TouchableOpacity
                style={styles.pickFromDeviceCard}
                activeOpacity={0.8}
                onPress={handlePickFromDevice}
              >
                <Ionicons name="images-outline" size={26} color={colors.primary} />
                <Text style={[styles.pickFromDeviceText, { color: colors.textPrimary }]}>
                  Pick From{'\n'}Device
                </Text>
              </TouchableOpacity>

              {recentPhotos.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentThumbWrap}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    onSelectRecentMedia(uri);
                  }}
                >
                  <Image source={{ uri }} style={styles.recentThumbImg} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Primary Row (4 Core Actions)
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionBtn: {
    width: (width - 64) / 4,
    alignItems: 'center',
    gap: 7,
  },
  circleIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  actionTitle: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Secondary Row (Tucked Underneath: Document & Event)
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  secondaryActionBtn: {
    alignItems: 'center',
    gap: 5,
    width: 64,
  },
  secondaryCircleWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  secondaryActionTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },

  // Recent Photos Carousel (Clear 76x76 size)
  recentSection: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  recentHeaderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recentScroll: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  pickFromDeviceCard: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  pickFromDeviceText: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  recentThumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  recentThumbImg: {
    width: '100%',
    height: '100%',
  },
});
