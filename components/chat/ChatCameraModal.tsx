import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../store/themeStore';
import {
  getRealRecentPhotos,
  saveRealPhoto,
  pickRealPhotosFromDevice,
} from '../../lib/recentPhotosService';

type CameraMode = 'video' | 'photo' | 'note';

interface ChatCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onSendMedia: (uri: string, type: 'image' | 'video') => void;
  conversationId?: string;
  userUid?: string;
}

export default function ChatCameraModal({
  visible,
  onClose,
  onSendMedia,
  conversationId,
  userUid,
}: ChatCameraModalProps) {
  const { colors } = useTheme();

  // Native Camera permissions & ref
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // WebRTC HTML5 Video stream refs & state (for mobile browser / Vercel)
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const webStreamRef = useRef<MediaStream | null>(null);
  const [webCameraActive, setWebCameraActive] = useState(false);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);

  // Camera Settings
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [mode, setMode] = useState<CameraMode>('photo');

  // Capture & Preview
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real device recent photos (zero dummy stock data)
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);

  // Stop web camera stream cleanly (hardware LED/camera turns off)
  const stopWebCamera = useCallback(() => {
    if (webStreamRef.current) {
      try {
        webStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      webStreamRef.current = null;
    }
    if (webVideoRef.current) {
      try {
        webVideoRef.current.srcObject = null;
      } catch (_) {}
    }
    setWebCameraActive(false);
  }, []);

  // Start real HTML5 camera stream on Web
  const startWebCamera = useCallback(async (currentFacing: 'back' | 'front') => {
    if (Platform.OS !== 'web') return;
    stopWebCamera();
    setWebCameraError(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setWebCameraError('Camera is not supported on this browser.');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: currentFacing === 'back' ? { ideal: 'environment' } : 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (_) {
        // Fallback constraint if exact facingMode is not recognized
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      webStreamRef.current = stream;
      setWebCameraActive(true);

      if (webVideoRef.current) {
        webVideoRef.current.srcObject = stream;
        webVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('[ChatCameraModal] Web camera start error:', err);
      setWebCameraError(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : 'Unable to start camera. Please verify device camera is available.'
      );
    }
  }, [stopWebCamera]);

  // Load real recent photos
  const loadRecentPhotos = useCallback(async () => {
    try {
      const photos = await getRealRecentPhotos(conversationId, userUid);
      setRecentPhotos(photos);
    } catch (err) {
      console.warn('[ChatCameraModal] loadRecentPhotos error:', err);
    }
  }, [conversationId, userUid]);

  // Handle visibility & camera lifecycle
  useEffect(() => {
    if (!visible) {
      if (Platform.OS === 'web') {
        stopWebCamera();
      }
      return;
    }

    // Modal is opened
    loadRecentPhotos();

    if (Platform.OS === 'web') {
      startWebCamera(facing);
    } else if (!permission?.granted) {
      requestPermission();
    }

    return () => {
      if (Platform.OS === 'web') {
        stopWebCamera();
      }
    };
  }, [visible, facing, permission?.granted, requestPermission, startWebCamera, stopWebCamera, loadRecentPhotos]);

  // Flash Mode Toggle
  const toggleFlash = async () => {
    const nextFlash = flash === 'off' ? 'on' : flash === 'on' ? 'auto' : 'off';
    setFlash(nextFlash);

    // If web browser supports torch constraint
    if (Platform.OS === 'web' && webStreamRef.current) {
      try {
        const track = webStreamRef.current.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as any;
        if (capabilities && 'torch' in capabilities) {
          await track.applyConstraints({
            advanced: [{ torch: nextFlash === 'on' }] as any,
          });
        }
      } catch (_) {}
    }
  };

  // Flip Front/Back Camera
  const toggleFacing = () => {
    const nextFacing = facing === 'back' ? 'front' : 'back';
    setFacing(nextFacing);
    if (Platform.OS === 'web') {
      startWebCamera(nextFacing);
    }
  };

  // Capture Photo (Real capture on both Web and Native)
  const handleCapture = async () => {
    // 1. Web HTML5 Canvas Frame Capture
    if (Platform.OS === 'web') {
      const video = webVideoRef.current;
      if (!video || !webStreamRef.current) {
        await handleOpenGallery();
        return;
      }

      try {
        setIsProcessing(true);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (facing === 'front') {
            // Mirror selfie
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedUri(dataUrl);

          // Save to real recent storage
          await saveRealPhoto(dataUrl);
          loadRecentPhotos();
        }
      } catch (err) {
        console.warn('[ChatCameraModal] Web capture error:', err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. Native Expo Camera Capture
    if (!cameraRef.current) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        await saveRealPhoto(photo.uri);
        loadRecentPhotos();
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Real Device Gallery
  const handleOpenGallery = async () => {
    try {
      const picked = await pickRealPhotosFromDevice();
      if (picked && picked.length > 0) {
        setCapturedUri(picked[0]);
        loadRecentPhotos();
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Open gallery error:', err);
    }
  };

  // Confirm and Send Media
  const handleSend = () => {
    if (!capturedUri) return;
    onSendMedia(capturedUri, 'image');
    setCapturedUri(null);
    if (Platform.OS === 'web') {
      stopWebCamera();
    }
    onClose();
  };

  const handleRetake = () => {
    setCapturedUri(null);
    if (Platform.OS === 'web') {
      startWebCamera(facing);
    }
  };

  const handleClose = () => {
    if (Platform.OS === 'web') {
      stopWebCamera();
    }
    setCapturedUri(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={handleClose}>
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
            {/* Camera Viewfinder: Real WebRTC on Web, CameraView on Native */}
            {Platform.OS === 'web' ? (
              webCameraError ? (
                <View style={styles.permissionWrap}>
                  <Ionicons name="videocam-off-outline" size={54} color="#EF4444" />
                  <Text style={styles.permissionText}>{webCameraError}</Text>
                  <TouchableOpacity
                    style={[styles.grantBtn, { backgroundColor: colors.primary }]}
                    onPress={() => startWebCamera(facing)}
                  >
                    <Text style={styles.grantBtnText}>Retry Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.grantBtn, { backgroundColor: '#374151', marginTop: 10 }]}
                    onPress={handleOpenGallery}
                  >
                    <Text style={[styles.grantBtnText, { color: '#FFF' }]}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={StyleSheet.absoluteFillObject}>
                  {/* Real Live HTML5 Video Stream */}
                  <video
                    ref={(el) => {
                      webVideoRef.current = el;
                      if (el && webStreamRef.current && el.srcObject !== webStreamRef.current) {
                        el.srcObject = webStreamRef.current;
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
                      transform: facing === 'front' ? 'scaleX(-1)' : 'none',
                      backgroundColor: '#000000',
                    }}
                  />
                </View>
              )
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
              <TouchableOpacity style={styles.iconCircle} onPress={handleClose}>
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
              {/* 1. Real Recent Photos Preview Strip (Image 2 style) */}
              <View style={styles.recentStripWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentStripScroll}
                >
                  {/* + Pick From Device Button */}
                  <TouchableOpacity
                    style={styles.recentStripPickBtn}
                    activeOpacity={0.8}
                    onPress={handleOpenGallery}
                  >
                    <Ionicons name="images-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.recentStripPickText}>Gallery</Text>
                  </TouchableOpacity>

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
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  grantBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  grantBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
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
    alignItems: 'center',
  },
  recentStripPickBtn: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  recentStripPickText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  galleryShortcutThumb: {
    width: '100%',
    height: '100%',
  },
  shutterOuterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },

  // Modes Row
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modePillActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Preview Screen
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  previewBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 36,
    zIndex: 10,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  retakeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
});
