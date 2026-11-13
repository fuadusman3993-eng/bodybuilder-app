import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../store/themeStore';

const { width, height } = Dimensions.get('window');

type CameraMode = 'video' | 'photo' | 'note';

interface ChatCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onSendMedia: (uri: string, type: 'image' | 'video') => void;
}

export default function ChatCameraModal({
  visible,
  onClose,
  onSendMedia,
}: ChatCameraModalProps) {
  const { colors } = useTheme();

  // Camera permissions & state
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [mode, setMode] = useState<CameraMode>('photo');

  // Capture & Preview
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recent media strip
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);

  // Request permissions on visible
  useEffect(() => {
    if (!visible) return;

    if (!permission?.granted) {
      requestPermission();
    }

    let isMounted = true;
    async function fetchRecentPhotos() {
      if (Platform.OS === 'web') {
        setRecentPhotos([
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80',
        ]);
        return;
      }

      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const res = await MediaLibrary.getAssetsAsync({
            first: 8,
            mediaType: ['photo'],
            sortBy: [MediaLibrary.SortBy.creationTime],
          });
          if (isMounted && res.assets && res.assets.length > 0) {
            setRecentPhotos(res.assets.map((a) => a.uri));
          }
        }
      } catch (err) {
        console.warn('[ChatCameraModal] Recent photos error:', err);
      }
    }

    fetchRecentPhotos();
    return () => {
      isMounted = false;
    };
  }, [visible, permission]);

  // Flash Mode Toggle
  const toggleFlash = () => {
    if (flash === 'off') setFlash('on');
    else if (flash === 'on') setFlash('auto');
    else setFlash('off');
  };

  // Flip Front/Back Camera
  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Capture Photo
  const handleCapture = async () => {
    if (Platform.OS === 'web') {
      // Web fallback: use file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setCapturedUri(url);
        }
      };
      input.click();
      return;
    }

    if (!cameraRef.current) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pick from Gallery shortcut
  const handleOpenGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setCapturedUri(res.assets[0].uri);
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Gallery picker error:', err);
    }
  };

  // Confirm and Send Media
  const handleSend = () => {
    if (!capturedUri) return;
    onSendMedia(capturedUri, 'image');
    setCapturedUri(null);
    onClose();
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {capturedUri ? (
          /* ── Preview Screen: Review photo before sending ── */
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />

            {/* Top Toolbar */}
            <View style={styles.previewTopBar}>
              <TouchableOpacity style={styles.iconCircle} onPress={handleRetake}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Send Toolbar */}
            <View style={styles.previewBottomBar}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                onPress={handleSend}
              >
                <Text style={styles.sendBtnText}>Send</Text>
                <Ionicons name="send" size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── Camera Viewfinder Screen (Image 2 Replica) ── */
          <View style={styles.cameraWrap}>
            {/* Camera View */}
            {Platform.OS === 'web' ? (
              <View style={styles.webFallbackWrap}>
                <Ionicons name="camera" size={64} color="rgba(255,255,255,0.4)" />
                <Text style={styles.webFallbackText}>Tap the shutter button to take a photo</Text>
              </View>
            ) : permission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                enableTorch={flash === 'on'}
              />
            ) : (
              <View style={styles.permissionWrap}>
                <Ionicons name="camera-outline" size={54} color="#FFF" />
                <Text style={styles.permissionText}>Camera permission is needed to take photos</Text>
                <TouchableOpacity
                  style={[styles.grantBtn, { backgroundColor: colors.primary }]}
                  onPress={requestPermission}
                >
                  <Text style={styles.grantBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Top Action Bar: Close (X) & Flash Toggle */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.iconCircle} onPress={onClose}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconCircle} onPress={toggleFlash}>
                <Ionicons
                  name={
                    flash === 'on'
                      ? 'flash'
                      : flash === 'auto'
                      ? 'flash-outline'
                      : 'flash-off-outline'
                  }
                  size={24}
                  color={flash === 'on' ? '#FBBF24' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls Area (Recent Strip + Shutter + Modes) */}
            <View style={styles.bottomControls}>
              {/* 1. Recent Photos Preview Strip (Image 2 style) */}
              {recentPhotos.length > 0 && (
                <View style={styles.recentStripWrap}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentStripScroll}
                  >
                    {recentPhotos.map((uri, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.recentStripThumb}
                        activeOpacity={0.8}
                        onPress={() => setCapturedUri(uri)}
                      >
                        <Image source={{ uri }} style={styles.recentStripImg} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2. Shutter Control Row: [Gallery] [ Shutter ○ ] [ Flip 🔄 ] */}
              <View style={styles.shutterRow}>
                {/* Gallery Picker Shortcut */}
                <TouchableOpacity style={styles.sideBtn} onPress={handleOpenGallery}>
                  {recentPhotos[0] ? (
                    <Image source={{ uri: recentPhotos[0] }} style={styles.galleryShortcutThumb} />
                  ) : (
                    <Ionicons name="images" size={28} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Main Shutter Button */}
                <TouchableOpacity
                  style={styles.shutterOuterRing}
                  activeOpacity={0.85}
                  onPress={handleCapture}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.shutterInnerCircle} />
                  )}
                </TouchableOpacity>

                {/* Flip Camera Button */}
                <TouchableOpacity style={styles.sideBtn} onPress={toggleFacing}>
                  <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* 3. Bottom Mode Selector: [ Video ] [ Photo ] [ Video note ] */}
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modePill, mode === 'video' && styles.modePillActive]}
                  onPress={() => setMode('video')}
                >
                  <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>
                    Video
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modePill, mode === 'photo' && styles.modePillActive]}
                  onPress={() => setMode('photo')}
                >
                  <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>
                    Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modePill, mode === 'note' && styles.modePillActive]}
                  onPress={() => setMode('note')}
                >
                  <Text style={[styles.modeText, mode === 'note' && styles.modeTextActive]}>
                    Video note
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Fallback views
  webFallbackWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  webFallbackText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  permissionWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 30,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  grantBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  grantBtnText: {
    color: '#000',
    fontWeight: '800',
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
  },

  // Recent Photos Strip (Image 2)
  recentStripWrap: {
    width: '100%',
    paddingHorizontal: 16,
  },
  recentStripScroll: {
    gap: 8,
  },
  recentStripThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#1F2937',
  },
  recentStripImg: {
    width: '100%',
    height: '100%',
  },

  // Shutter Controls Row
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
  },
  sideBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryShortcutThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },

  // Mode Selector (Video / Photo / Video note)
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modePillActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // Preview Screen
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  previewTopBar: {
    paddingTop: 48,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  previewBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 10,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
});
