import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Animated,
  PanResponder,
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
const HALF_HEIGHT = Math.round(height * 0.62);
const FULL_HEIGHT = height;

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
  onShareContact,
  onPickDocument,
  onCreatePoll,
  onShareEvent,
}: ChatAttachmentSheetProps) {
  const { colors } = useTheme();
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'file' | 'location' | 'workout' | 'contact' | 'poll' | 'event'>('gallery');

  // Full-Screen vs Half-Sheet expansion state & animations
  const [isFullScreen, setIsFullScreen] = useState(false);
  const sheetHeightAnim = useRef(new Animated.Value(HALF_HEIGHT)).current;

  // Album dropdown state
  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: string; title: string }>({
    id: 'all',
    title: 'Gallery',
  });

  // WebRTC HTML5 Live Camera Preview for Tile 0
  const webPreviewVideoRef = useRef<any>(null);
  const webPreviewStreamRef = useRef<MediaStream | null>(null);
  const [webPreviewActive, setWebPreviewActive] = useState(false);

  // Stop camera preview hardware cleanly
  const stopCameraPreview = useCallback(() => {
    if (webPreviewStreamRef.current) {
      try {
        webPreviewStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      webPreviewStreamRef.current = null;
    }
    if (webPreviewVideoRef.current) {
      try {
        webPreviewVideoRef.current.srcObject = null;
      } catch (_) {}
    }
    setWebPreviewActive(false);
  }, []);

  // Expand to Full-Screen smoothly
  const expandToFull = useCallback(() => {
    setIsFullScreen(true);
    Animated.spring(sheetHeightAnim, {
      toValue: FULL_HEIGHT,
      useNativeDriver: false,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [sheetHeightAnim]);

  // Collapse to Half-Sheet smoothly
  const collapseToHalf = useCallback(() => {
    setShowAlbumDropdown(false);
    Animated.spring(sheetHeightAnim, {
      toValue: HALF_HEIGHT,
      useNativeDriver: false,
      bounciness: 0,
      speed: 16,
    }).start(() => {
      setIsFullScreen(false);
    });
  }, [sheetHeightAnim]);

  // Safe handler to close and cleanup camera
  const handleClose = useCallback(() => {
    stopCameraPreview();
    setShowAlbumDropdown(false);
    setIsFullScreen(false);
    sheetHeightAnim.setValue(HALF_HEIGHT);
    onClose();
  }, [stopCameraPreview, onClose, sheetHeightAnim]);

  // PanResponder for smooth dragging up & down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderMove: (_, gesture) => {
        if (isFullScreen) {
          if (gesture.dy > 0) {
            // Dragging down from full screen
            const newH = Math.max(HALF_HEIGHT, FULL_HEIGHT - gesture.dy);
            sheetHeightAnim.setValue(newH);
          }
        } else {
          if (gesture.dy < 0) {
            // Dragging up from half sheet
            const newH = Math.min(FULL_HEIGHT, HALF_HEIGHT - gesture.dy);
            sheetHeightAnim.setValue(newH);
          } else if (gesture.dy > 0) {
            // Dragging down to dismiss
            const newH = Math.max(0, HALF_HEIGHT - gesture.dy);
            sheetHeightAnim.setValue(newH);
          }
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isFullScreen) {
          if (gesture.dy > 90) {
            collapseToHalf();
          } else {
            expandToFull();
          }
        } else {
          if (gesture.dy < -50) {
            expandToFull();
          } else if (gesture.dy > 100) {
            handleClose();
          } else {
            collapseToHalf();
          }
        }
      },
    })
  ).current;

  // Start live camera stream when sheet is visible
  useEffect(() => {
    if (!visible) {
      stopCameraPreview();
      setIsFullScreen(false);
      sheetHeightAnim.setValue(HALF_HEIGHT);
      return;
    }

    let isMounted = true;

    async function startPreview() {
      if (Platform.OS !== 'web') return;
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 400 },
              height: { ideal: 400 },
            },
            audio: false,
          });
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          webPreviewStreamRef.current = stream;
          setWebPreviewActive(true);
          if (webPreviewVideoRef.current) {
            webPreviewVideoRef.current.srcObject = stream;
            webPreviewVideoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[ChatAttachmentSheet] startPreview error:', err);
      }
    }

    startPreview();

    return () => {
      isMounted = false;
      stopCameraPreview();
    };
  }, [visible, stopCameraPreview, sheetHeightAnim]);

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

  // Open full camera modal
  const handleOpenFullCamera = () => {
    stopCameraPreview();
    handleClose();
    onOpenCamera();
  };

  // Pick photos directly from device
  const handlePickFromDevice = async () => {
    try {
      const picked = await pickRealPhotosFromDevice();
      if (picked && picked.length > 0) {
        handleClose();
        onSelectRecentMedia(picked[0]);
      }
    } catch (err) {
      console.warn('[ChatAttachmentSheet] handlePickFromDevice error:', err);
    }
  };

  // Album list matching Telegram Image 2
  const albumsList = useMemo(() => [
    { id: 'all', title: 'All media', count: recentPhotos.length || 1, thumbnail: recentPhotos[0] },
    { id: 'videos', title: 'All videos', count: 0, icon: 'videocam' },
    { id: 'camera', title: 'Camera', count: Math.max(1, Math.ceil(recentPhotos.length * 0.5)), thumbnail: recentPhotos[0] },
    { id: 'screenshots', title: 'Screenshot', count: Math.max(1, Math.floor(recentPhotos.length * 0.3)), thumbnail: recentPhotos[1] || recentPhotos[0] },
    { id: 'telegram', title: 'Telegram', count: Math.max(1, Math.floor(recentPhotos.length * 0.2)), thumbnail: recentPhotos[2] || recentPhotos[0] },
    { id: 'whatsapp', title: 'WhatsApp Images', count: Math.max(1, Math.floor(recentPhotos.length * 0.4)), thumbnail: recentPhotos[0] },
    { id: 'fitpulse', title: 'FitPulse Workouts', count: 18, icon: 'barbell' },
    { id: 'pictures', title: 'Pictures', count: Math.max(1, Math.floor(recentPhotos.length * 0.1)), thumbnail: recentPhotos[1] || recentPhotos[0] },
  ], [recentPhotos]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeightAnim,
              backgroundColor: '#17212B',
              borderTopLeftRadius: isFullScreen ? 0 : 18,
              borderTopRightRadius: isFullScreen ? 0 : 18,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* ── 1. Top Bar / Handle / Header ── */}
          {isFullScreen ? (
            /* Telegram Full-Screen Header Bar (Image 1) */
            <View style={styles.fullScreenHeader} {...panResponder.panHandlers}>
              {/* FitPulse Chevron-Back Button */}
              <TouchableOpacity
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                onPress={collapseToHalf}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Album Selector Dropdown Pill (Gallery ▼) */}
              <TouchableOpacity
                style={styles.headerAlbumPill}
                activeOpacity={0.8}
                onPress={() => setShowAlbumDropdown(!showAlbumDropdown)}
              >
                <Text style={styles.headerAlbumTitle}>{selectedAlbum.title}</Text>
                <Ionicons
                  name={showAlbumDropdown ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>

              {/* Menu Dots [⋮] */}
              <TouchableOpacity
                style={styles.headerMenuBtn}
                activeOpacity={0.7}
                onPress={handlePickFromDevice}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            /* Half-Sheet Draggable Handle Pill */
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <TouchableOpacity
                style={styles.handleTouch}
                activeOpacity={0.8}
                onPress={expandToFull}
              >
                <View style={styles.handle} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── 2. Telegram Album Dropdown Menu Overlay (Image 2) ── */}
          {showAlbumDropdown && (
            <View style={styles.dropdownOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setShowAlbumDropdown(false)}
              />
              <View style={styles.dropdownCard}>
                <ScrollView
                  style={styles.dropdownScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {albumsList.map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={[
                        styles.albumRow,
                        selectedAlbum.id === album.id && styles.albumRowActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setSelectedAlbum({ id: album.id, title: album.title });
                        setShowAlbumDropdown(false);
                        if (album.id !== 'all') {
                          handlePickFromDevice();
                        }
                      }}
                    >
                      {album.thumbnail ? (
                        <Image
                          source={{ uri: album.thumbnail }}
                          style={styles.albumThumb}
                        />
                      ) : (
                        <View style={styles.albumIconThumb}>
                          <Ionicons
                            name={(album.icon as any) || 'images'}
                            size={18}
                            color="#5288C1"
                          />
                        </View>
                      )}
                      <Text style={styles.albumTitle} numberOfLines={1}>
                        {album.title}
                      </Text>
                      <Text style={styles.albumCount}>{album.count}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* ── 3. Telegram 3-Column Photo Grid ── */}
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={[
              styles.gridContainer,
              { paddingBottom: isFullScreen ? 40 : 95 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Tile 0: Live Camera Viewfinder Tile (Top-Left) */}
            <TouchableOpacity
              style={styles.cameraTile}
              activeOpacity={0.85}
              onPress={handleOpenFullCamera}
            >
              {Platform.OS === 'web' && webPreviewActive ? (
                <video
                  ref={(el) => {
                    webPreviewVideoRef.current = el;
                    if (el && webPreviewStreamRef.current && el.srcObject !== webPreviewStreamRef.current) {
                      el.srcObject = webPreviewStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // mirror for selfie viewfinder
                  } as any}
                />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <View style={styles.cameraIconCircle}>
                    <Ionicons name="camera" size={30} color="#FFFFFF" />
                  </View>
                </View>
              )}

              {/* Telegram-style circular camera badge in top-right corner */}
              <View style={styles.cameraCornerBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Tiles 1..N: Real Photos from Device with Selection Circles */}
            {recentPhotos.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.photoTile}
                activeOpacity={0.85}
                onPress={() => {
                  handleClose();
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

          {/* ── 4. Floating Bottom Action Navigation Bar (Docked at half-sheet) ── */}
          {!isFullScreen && (
            <View style={styles.bottomBarWrap}>
              <View style={styles.bottomBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bottomBarScroll}
                >
                  {/* 1. Gallery */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'gallery' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('gallery');
                      expandToFull();
                    }}
                  >
                    <Ionicons
                      name="images"
                      size={22}
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

                  {/* 2. File */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'file' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('file');
                      handleClose();
                      if (onPickDocument) onPickDocument();
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color={activeTab === 'file' ? '#5288C1' : '#8E9BA8'}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        activeTab === 'file' && styles.tabLabelActive,
                      ]}
                    >
                      File
                    </Text>
                  </TouchableOpacity>

                  {/* 3. Location */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'location' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('location');
                      handleClose();
                      onShareLocation();
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color={activeTab === 'location' ? '#5288C1' : '#8E9BA8'}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        activeTab === 'location' && styles.tabLabelActive,
                      ]}
                    >
                      Location
                    </Text>
                  </TouchableOpacity>

                  {/* 4. Workout */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'workout' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('workout');
                      handleClose();
                      onShareWorkout();
                    }}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={22}
                      color="#00E676"
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: '#00E676' },
                        activeTab === 'workout' && styles.tabLabelActive,
                      ]}
                    >
                      Workout
                    </Text>
                  </TouchableOpacity>

                  {/* 5. Contact */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'contact' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('contact');
                      handleClose();
                      if (onShareContact) onShareContact();
                    }}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={22}
                      color={activeTab === 'contact' ? '#5288C1' : '#8E9BA8'}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        activeTab === 'contact' && styles.tabLabelActive,
                      ]}
                    >
                      Contact
                    </Text>
                  </TouchableOpacity>

                  {/* 6. Poll */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'poll' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('poll');
                      handleClose();
                      if (onCreatePoll) onCreatePoll();
                    }}
                  >
                    <Ionicons
                      name="stats-chart-outline"
                      size={22}
                      color={activeTab === 'poll' ? '#5288C1' : '#8E9BA8'}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        activeTab === 'poll' && styles.tabLabelActive,
                      ]}
                    >
                      Poll
                    </Text>
                  </TouchableOpacity>

                  {/* 7. Event */}
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      activeTab === 'event' && styles.tabBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveTab('event');
                      handleClose();
                      if (onShareEvent) onShareEvent();
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color={activeTab === 'event' ? '#5288C1' : '#8E9BA8'}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        activeTab === 'event' && styles.tabLabelActive,
                      ]}
                    >
                      Event
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          )}
        </Animated.View>
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
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#17212B',
  },

  // Half-sheet handle
  handleContainer: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleTouch: {
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Full-screen Telegram Header Bar (Image 1)
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: 10,
    backgroundColor: '#17212B',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAlbumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    maxWidth: width * 0.6,
  },
  headerAlbumTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Telegram Album Dropdown Menu Overlay (Image 2)
  dropdownOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 98 : 62,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#242F3D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 380,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  albumRowActive: {
    backgroundColor: 'rgba(82, 136, 193, 0.22)',
  },
  albumThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#17212B',
  },
  albumIconThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#1E2B3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  albumCount: {
    color: '#8E9BA8',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // 3-Column Photo Grid
  gridScroll: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },

  // Tile 0: Live Camera Viewfinder
  cameraTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#0E1621',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E2B3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCornerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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

  // Floating Bottom Navigation Bar (Docked at half-sheet)
  bottomBarWrap: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  bottomBar: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(14, 22, 33, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
  },
  bottomBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 62,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(82, 136, 193, 0.25)',
  },
  tabLabel: {
    color: '#8E9BA8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#5288C1',
    fontWeight: '700',
  },
});
