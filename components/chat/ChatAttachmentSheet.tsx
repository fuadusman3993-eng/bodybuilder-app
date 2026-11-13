import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

interface ChatAttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onOpenCamera: () => void;
  onShareLocation: () => void;
  onShareContact: () => void;
  onPickDocument: () => void;
  onCreatePoll: () => void;
  onShareEvent: () => void;
  onShareWorkout: () => void;
  onSelectRecentMedia: (uri: string) => void;
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
  onShareContact,
  onPickDocument,
  onCreatePoll,
  onShareEvent,
  onShareWorkout,
  onSelectRecentMedia,
}: ChatAttachmentSheetProps) {
  const { colors } = useTheme();
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);

  // Fetch recent photos on native devices
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    async function loadRecentPhotos() {
      if (Platform.OS === 'web') {
        // Fallback sample previews on web
        setRecentPhotos([
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80',
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&q=80',
        ]);
        return;
      }

      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const res = await MediaLibrary.getAssetsAsync({
            first: 10,
            mediaType: ['photo'],
            sortBy: [MediaLibrary.SortBy.creationTime],
          });
          if (isMounted && res.assets && res.assets.length > 0) {
            setRecentPhotos(res.assets.map((a) => a.uri));
          }
        }
      } catch (err) {
        console.warn('[ChatAttachmentSheet] MediaLibrary error:', err);
      }
    }

    loadRecentPhotos();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Grid Actions matching WhatsApp screenshot + FitPulse Workout
  const actions: ActionItem[] = [
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
      id: 'contact',
      title: 'Contact',
      icon: 'person',
      color: '#06B6D4',
      onPress: () => {
        onClose();
        onShareContact();
      },
    },
    {
      id: 'document',
      title: 'Document',
      icon: 'document-text',
      color: '#8B5CF6',
      onPress: () => {
        onClose();
        onPickDocument();
      },
    },
    {
      id: 'poll',
      title: 'Poll',
      icon: 'stats-chart',
      color: '#F59E0B',
      onPress: () => {
        onClose();
        onCreatePoll();
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
        onShareEvent();
      },
    },
    {
      id: 'workout',
      title: 'Workout',
      icon: 'barbell',
      color: '#00E676',
      badge: 'FitPulse',
      onPress: () => {
        onClose();
        onShareWorkout();
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: '#181E24', borderColor: colors.border }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Handle Pill */}
          <View style={styles.handle} />

          {/* ── 1. WhatsApp Actions Grid (2 Rows of 4 Circles) ── */}
          <View style={styles.gridContainer}>
            {actions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={item.onPress}
              >
                <View style={[styles.circleIconWrap, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                  {item.badge && (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 2. Recent Gallery Photos Horizontal Strip (Image 1 bottom) ── */}
          {recentPhotos.length > 0 && (
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
          )}
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
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 18,
  },
  actionBtn: {
    width: (width - 32) / 4,
    alignItems: 'center',
    gap: 8,
  },
  circleIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  badgeWrap: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#181E24',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  actionTitle: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Recent Photos Carousel
  recentSection: {
    marginTop: 22,
    paddingTop: 14,
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
    gap: 8,
  },
  recentThumbWrap: {
    width: 82,
    height: 82,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2A323D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recentThumbImg: {
    width: '100%',
    height: '100%',
  },
});
