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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import {
  getRealRecentPhotos,
  pickRealPhotosFromDevice,
} from '../../lib/recentPhotosService';

const { width, height } = Dimensions.get('window');
const TILE_GAP = 2;
const TILE_SIZE = Math.floor((width - TILE_GAP * 2) / 3);

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
  const [activeTab, setActiveTab] = useState<'gallery' | 'file' | 'location' | 'workout'>('gallery');

  // Load real recent photos
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: '#17212B' }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Handle Pill */}
          <View style={styles.handle} />

          {/* ── 1. Telegram 3-Column Photo Grid ── */}
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Tile 0: Live Camera Shortcut Tile (Top-Left) */}
            <TouchableOpacity
              style={styles.cameraTile}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onOpenCamera();
              }}
            >
              <View style={styles.cameraIconCircle}>
                <Ionicons name="camera" size={30} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Tiles 1..N: Real Photos from Device / Gallery with Selection Circles */}
            {recentPhotos.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.photoTile}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onSelectRecentMedia(uri);
                }}
              >
                <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />

                {/* Telegram-style Circular Selection Checkmark [○] */}
                <View style={styles.selectCircle}>
                  <View style={styles.selectInnerDot} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Extra Tile: Pick More from Device */}
            <TouchableOpacity
              style={styles.pickMoreTile}
              activeOpacity={0.8}
              onPress={handlePickFromDevice}
            >
              <Ionicons name="add" size={34} color="#5288C1" />
              <Text style={styles.pickMoreText}>More Photos</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── 2. Floating Bottom Action Navigation Bar (Exact Telegram Style) ── */}
          <View style={styles.bottomBarWrap}>
            <View style={styles.bottomBar}>
              {/* Tab 1: Gallery (Active Pill) */}
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'gallery' && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTab('gallery');
                  handlePickFromDevice();
                }}
              >
                <Ionicons
                  name="images"
                  size={20}
                  color={activeTab === 'gallery' ? '#5288C1' : '#8E9BA8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'gallery' && styles.tabLabelActive,
                  ]}
                >
                  Gallery
                </Text>
              </TouchableOpacity>

              {/* Tab 2: File */}
              <TouchableOpacity
                style={styles.tabBtn}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  if (onPickDocument) onPickDocument();
                }}
              >
                <Ionicons name="document-text-outline" size={20} color="#8E9BA8" />
                <Text style={styles.tabLabel}>File</Text>
              </TouchableOpacity>

              {/* Tab 3: Location */}
              <TouchableOpacity
                style={styles.tabBtn}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onShareLocation();
                }}
              >
                <Ionicons name="location-outline" size={20} color="#8E9BA8" />
                <Text style={styles.tabLabel}>Location</Text>
              </TouchableOpacity>

              {/* Tab 4: Workout */}
              <TouchableOpacity
                style={styles.tabBtn}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onShareWorkout();
                }}
              >
                <Ionicons name="barbell-outline" size={20} color="#00E676" />
                <Text style={[styles.tabLabel, { color: '#00E676' }]}>Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: height * 0.62,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#17212B',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginVertical: 8,
  },

  // 3-Column Photo Grid
  gridScroll: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    paddingBottom: 90, // Space so floating bottom bar doesn't obscure photos
  },

  // Tile 0: Camera Shortcut
  cameraTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#0E1621',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tiles 1..N: Real Photo Tiles
  photoTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: 'relative',
    backgroundColor: '#242F3D',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },

  // Telegram Selection Checkmark Circle [○]
  selectCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },

  // Pick More Tile
  pickMoreTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#1E2B3A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  pickMoreText: {
    color: '#5288C1',
    fontSize: 11,
    fontWeight: '700',
  },

  // Floating Bottom Navigation Bar (Docked at bottom of sheet)
  bottomBarWrap: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(14, 22, 33, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(82, 136, 193, 0.18)',
  },
  tabLabel: {
    color: '#8E9BA8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#5288C1',
    fontWeight: '700',
  },
});
