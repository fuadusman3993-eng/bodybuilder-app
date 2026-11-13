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
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../store/themeStore';
import {
  getRealRecentPhotos,
  saveRealPhoto,
  pickRealPhotosFromDevice,
} from '../../lib/recentPhotosService';

const { width } = Dimensions.get('window');

type CameraMode = 'video' | 'photo' | 'note';

interface ChatCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onSendMedia: (uri: string, type: 'image' | 'video') => void;
  conversationId?: string;
  userUid?: string;
}

function fmtSecs(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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

  // Video recording refs & state (both Web & Native)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const recTimerRef = useRef<any>(null);

  // Camera Settings
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [mode, setMode] = useState<CameraMode>('photo');
  const modeTranslateX = useRef(new Animated.Value(0)).current;

  // Capture & Preview
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image');
  const [isProcessing, setIsProcessing] = useState(false);

  // Real device recent photos (up to 50 real photos for horizontal swipe)
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);

  // Stop web camera stream cleanly (hardware LED/camera turns off)
  const stopWebCamera = useCallback(() => {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
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
    setIsRecording(false);
  }, []);

  // Start real HTML5 camera stream on Web
  const startWebCamera = useCallback(async (currentFacing: 'back' | 'front', withAudio = false) => {
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
          audio: withAudio,
        });
      } catch (_) {
        // Fallback constraint if exact facingMode is not recognized
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: withAudio,
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
          ? 'Camera or microphone permission denied. Please allow access in browser.'
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

  // Handle mode switch: smoothly slide the selected mode to center & update camera stream
  const handleModeChange = (newMode: CameraMode) => {
    if (isRecording) return; // Prevent switching while recording
    setMode(newMode);

    // Slot 0 (Video) offset +110, Slot 1 (Photo) offset 0, Slot 2 (Video note) offset -110
    const targetX = newMode === 'video' ? 110 : newMode === 'note' ? -110 : 0;
    Animated.spring(modeTranslateX, {
      toValue: targetX,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();

    if (Platform.OS === 'web') {
      const needsAudio = newMode === 'video' || newMode === 'note';
      startWebCamera(facing, needsAudio);
    }
  };

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
      const needsAudio = mode === 'video' || mode === 'note';
      startWebCamera(facing, needsAudio);
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
    if (isRecording) return;
    const nextFacing = facing === 'back' ? 'front' : 'back';
    setFacing(nextFacing);
    if (Platform.OS === 'web') {
      startWebCamera(nextFacing, mode === 'video' || mode === 'note');
    }
  };

  // ── PHOTO CAPTURE ──
  const capturePhoto = async () => {
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
          setCapturedType('image');

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
        setCapturedType('image');
        await saveRealPhoto(photo.uri);
        loadRecentPhotos();
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── VIDEO RECORDING (START / STOP) ──
  const startRecording = async () => {
    if (isRecording) return;

    if (Platform.OS === 'web') {
      if (!webStreamRef.current) {
        await startWebCamera(facing, true);
      }
      const stream = webStreamRef.current;
      if (!stream) return;

      try {
        videoChunksRef.current = [];
        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];
        const selectedMime = mimeTypes.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || '';
        const mr = selectedMime
          ? new MediaRecorder(stream, { mimeType: selectedMime })
          : new MediaRecorder(stream);

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };

        mr.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: selectedMime || 'video/mp4' });
          const videoUrl = URL.createObjectURL(blob);
          setCapturedUri(videoUrl);
          setCapturedType('video');
        };

        mr.start(100);
        mediaRecorderRef.current = mr;
        setIsRecording(true);
        setRecordingSecs(0);
        recTimerRef.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000);
      } catch (err) {
        console.warn('[ChatCameraModal] Web video record start error:', err);
      }
      return;
    }

    // Native CameraView recording
    if (!cameraRef.current) return;
    try {
      setIsRecording(true);
      setRecordingSecs(0);
      recTimerRef.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 60,
      });

      if (video?.uri) {
        setCapturedUri(video.uri);
        setCapturedType('video');
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Native record error:', err);
    } finally {
      setIsRecording(false);
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
        recTimerRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Native stop recording
    if (cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch (_) {}
    }
    setIsRecording(false);
  };

  // Main Shutter Button Action based on mode
  const handleShutterPress = () => {
    if (mode === 'photo') {
      capturePhoto();
    } else {
      // Video or Video note
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // Open Real Device Gallery (multi-photo)
  const handleOpenGallery = async () => {
    try {
      const picked = await pickRealPhotosFromDevice();
      if (picked && picked.length > 0) {
        setCapturedUri(picked[0]);
        setCapturedType('image');
        loadRecentPhotos();
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Open gallery error:', err);
    }
  };

  // Confirm and Send Media
  const handleSend = () => {
    if (!capturedUri) return;
    onSendMedia(capturedUri, capturedType);
    setCapturedUri(null);
    if (Platform.OS === 'web') {
      stopWebCamera();
    }
    onClose();
  };

  const handleRetake = () => {
    setCapturedUri(null);
    if (Platform.OS === 'web') {
      const needsAudio = mode === 'video' || mode === 'note';
      startWebCamera(facing, needsAudio);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
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
          /* ── Preview Screen: Review photo or video before sending ── */
          <View style={styles.previewContainer}>
            {capturedType === 'video' ? (
              Platform.OS === 'web' ? (
                <video
                  src={capturedUri}
                  autoPlay
                  loop
                  playsInline
                  controls
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000',
                  }}
                />
              ) : (
                <View style={styles.previewVideoWrap}>
                  <Ionicons name="play-circle" size={80} color="#00E676" />
                  <Text style={styles.previewVideoText}>Video Ready to Send</Text>
                </View>
              )
            ) : (
              <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
            )}

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
                <Text style={styles.sendBtnText}>Send {capturedType === 'video' ? 'Video' : 'Photo'}</Text>
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
                    onPress={() => startWebCamera(facing, mode === 'video' || mode === 'note')}
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
              ) : mode === 'note' ? (
                /* WhatsApp Circular Video Note Viewfinder */
                <View style={styles.circularNoteContainer}>
                  <View style={[styles.circularNoteMask, isRecording && styles.circularNoteMaskRec]}>
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
                </View>
              ) : (
                <View style={StyleSheet.absoluteFillObject}>
                  {/* Fullscreen Video Stream */}
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
                style={mode === 'note' ? styles.circularNoteMask : StyleSheet.absoluteFillObject}
                facing={facing}
                enableTorch={flash === 'on'}
                mode={mode === 'photo' ? 'picture' : 'video'}
              />
            ) : (
              <View style={styles.permissionWrap}>
                <Ionicons name="camera-outline" size={54} color="#FFF" />
                <Text style={styles.permissionText}>Camera permission is needed to take photos and video</Text>
                <TouchableOpacity
                  style={[styles.grantBtn, { backgroundColor: colors.primary }]}
                  onPress={requestPermission}
                >
                  <Text style={styles.grantBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Top Action Bar: Close (X), Active Recording Timer, & Flash Toggle */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.iconCircle} onPress={handleClose}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Active Recording Pill */}
              {isRecording ? (
                <View style={styles.recBadge}>
                  <View style={styles.recDotRed} />
                  <Text style={styles.recBadgeText}>{fmtSecs(recordingSecs)}</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}

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
              {/* 1. Real Recent Photos Preview Strip (ONLY in Photo mode to keep Video modes free and clean) */}
              {mode === 'photo' && !isRecording && (
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
                        onPress={() => {
                          setCapturedUri(uri);
                          setCapturedType('image');
                        }}
                      >
                        <Image source={{ uri }} style={styles.recentStripImg} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2. Shutter Control Row: [Gallery] [ Shutter ○ ] [ Flip 🔄 ] */}
              <View style={styles.shutterRow}>
                {/* Gallery Picker Shortcut (Visible only in Photo mode to keep space free) */}
                {mode === 'photo' ? (
                  <TouchableOpacity
                    style={styles.sideBtn}
                    onPress={handleOpenGallery}
                    disabled={isRecording}
                  >
                    {recentPhotos[0] ? (
                      <Image source={{ uri: recentPhotos[0] }} style={styles.galleryShortcutThumb} />
                    ) : (
                      <Ionicons name="images" size={28} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.sideBtnPlaceholder} />
                )}

                {/* Main Shutter Button */}
                <TouchableOpacity
                  style={[
                    styles.shutterOuterRing,
                    (mode === 'video' || mode === 'note') && styles.shutterOuterRingVideo,
                    isRecording && styles.shutterOuterRingRec,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleShutterPress}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isRecording ? (
                    <View style={styles.shutterStopSquare} />
                  ) : mode === 'video' || mode === 'note' ? (
                    <View style={styles.shutterInnerCircleVideo} />
                  ) : (
                    <View style={styles.shutterInnerCirclePhoto} />
                  )}
                </TouchableOpacity>

                {/* Flip Camera Button */}
                <TouchableOpacity
                  style={styles.sideBtn}
                  onPress={toggleFacing}
                  disabled={isRecording}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* 3. Bottom Mode Selector: DYNAMICALLY SLIDING CAROUSEL */}
              <View style={styles.modeContainer}>
                <Animated.View
                  style={[
                    styles.modeTrack,
                    { transform: [{ translateX: modeTranslateX }] },
                  ]}
                >
                  {/* Slot 1: Video */}
                  <TouchableOpacity
                    style={styles.modeSlot}
                    onPress={() => handleModeChange('video')}
                    disabled={isRecording}
                  >
                    <View style={[styles.modePill, mode === 'video' && styles.modePillActive]}>
                      <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>
                        Video
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Slot 2: Photo */}
                  <TouchableOpacity
                    style={styles.modeSlot}
                    onPress={() => handleModeChange('photo')}
                    disabled={isRecording}
                  >
                    <View style={[styles.modePill, mode === 'photo' && styles.modePillActive]}>
                      <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>
                        Photo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Slot 3: Video note */}
                  <TouchableOpacity
                    style={styles.modeSlot}
                    onPress={() => handleModeChange('note')}
                    disabled={isRecording}
                  >
                    <View style={[styles.modePill, mode === 'note' && styles.modePillActive]}>
                      <Text style={[styles.modeText, mode === 'note' && styles.modeTextActive]}>
                        Video note
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
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

  // Active recording timer pill
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  recDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
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

  // Circular Video Note Mask
  circularNoteContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
  circularNoteMask: {
    width: width * 0.76,
    height: width * 0.76,
    borderRadius: (width * 0.76) / 2,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
  },
  circularNoteMaskRec: {
    borderColor: '#00E676',
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
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

  // Shutter Styles (Photo vs Video vs Recording)
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
  shutterOuterRingVideo: {
    borderColor: '#EF4444',
  },
  shutterOuterRingRec: {
    borderColor: '#EF4444',
    transform: [{ scale: 1.06 }],
  },
  shutterInnerCirclePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  shutterInnerCircleVideo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
  },
  shutterStopSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },

  sideBtnPlaceholder: {
    width: 52,
    height: 52,
  },

  // ── Mode Carousel Slider (Dynamically centers active mode under shutter) ──
  modeContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 44,
  },
  modeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSlot: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
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
  previewVideoWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#111827',
  },
  previewVideoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
