import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../store/themeStore';
import { saveRealPhoto } from '../../lib/recentPhotosService';

const { width } = Dimensions.get('window');

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
  const wasRecordingRef = useRef(false);

  // Camera Settings
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');

  // Capture & Preview
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Start real HTML5 camera stream on Web (with audio enabled for video hold)
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
          audio: true, // Audio ready for tap-or-hold
        });
      } catch (_) {
        // Fallback constraint if audio or exact facingMode fails
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
          ? 'Camera permission denied. Please allow access in browser settings.'
          : 'Unable to start camera. Please verify device camera is available.'
      );
    }
  }, [stopWebCamera]);

  // Handle visibility & camera lifecycle
  useEffect(() => {
    if (!visible) {
      if (Platform.OS === 'web') {
        stopWebCamera();
      }
      return;
    }

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
  }, [visible, facing, permission?.granted, requestPermission, startWebCamera, stopWebCamera]);

  // Flash Mode Toggle
  const toggleFlash = async () => {
    const nextFlash = flash === 'off' ? 'on' : flash === 'on' ? 'auto' : 'off';
    setFlash(nextFlash);

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
      startWebCamera(nextFacing);
    }
  };

  // ── 1. PHOTO CAPTURE (TAP) ──
  const capturePhoto = async () => {
    if (Platform.OS === 'web') {
      const video = webVideoRef.current;
      if (!video || !webStreamRef.current) return;

      try {
        setIsProcessing(true);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (facing === 'front') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedUri(dataUrl);
          setCapturedType('image');
          await saveRealPhoto(dataUrl);
        }
      } catch (err) {
        console.warn('[ChatCameraModal] Web capture error:', err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Native CameraView photo capture
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
      }
    } catch (err) {
      console.warn('[ChatCameraModal] Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 2. VIDEO RECORDING (HOLD / LONG PRESS) ──
  const startRecording = async () => {
    if (isRecording) return;

    if (Platform.OS === 'web') {
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

      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
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

    if (cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch (_) {}
    }
    setIsRecording(false);
  };

  // Tap handler (Photo)
  const handleShutterPress = () => {
    if (wasRecordingRef.current) {
      wasRecordingRef.current = false;
      return;
    }
    capturePhoto();
  };

  // Hold handler (Video)
  const handleShutterLongPress = () => {
    wasRecordingRef.current = true;
    startRecording();
  };

  // Release handler (Stop video if recording)
  const handleShutterPressOut = () => {
    if (isRecording) {
      stopRecording();
      wasRecordingRef.current = false;
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
      startWebCamera(facing);
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
          /* ── Camera Viewfinder Screen (Telegram Exact Replica) ── */
          <View style={styles.cameraWrap}>
            {/* Camera Viewfinder */}
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
                </View>
              ) : (
                <View style={StyleSheet.absoluteFillObject}>
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
                mode="picture"
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

            {/* Top Center Floating Recording Pill (Image 2) */}
            {isRecording && (
              <View style={styles.topCenterTimerWrap}>
                <View style={styles.recFloatingPill}>
                  <View style={styles.recRedDot} />
                  <Text style={styles.recTimerText}>{fmtSecs(recordingSecs)}</Text>
                </View>
              </View>
            )}

            {/* Top Bar: Close (X) on Top Left (Hidden during recording) */}
            {!isRecording && (
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconCircle} onPress={handleClose}>
                  <Ionicons name="close" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Bottom Controls (Telegram Screenshot Replica) ── */}
            <View style={styles.bottomControls}>
              <View style={styles.shutterRow}>
                {/* Left: Flash Toggle (Hidden during recording) */}
                <TouchableOpacity
                  style={[styles.iconCircleBottom, { opacity: isRecording ? 0 : 1 }]}
                  onPress={toggleFlash}
                  disabled={isRecording}
                >
                  <Ionicons
                    name={
                      flash === 'on'
                        ? 'flash'
                        : flash === 'auto'
                        ? 'flash-outline'
                        : 'flash-off'
                    }
                    size={24}
                    color={flash === 'on' ? '#FBBF24' : '#FFFFFF'}
                  />
                </TouchableOpacity>

                {/* Center: Shutter Button (Hollow White Ring in Photo mode, Solid Red Circle in Video mode) */}
                <TouchableOpacity
                  style={[
                    styles.shutterOuterRing,
                    isRecording && styles.shutterOuterRingRec,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleShutterPress}
                  onLongPress={handleShutterLongPress}
                  onPressOut={handleShutterPressOut}
                  delayLongPress={280}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isRecording ? (
                    <View style={styles.shutterInnerCircleRecording} />
                  ) : null}
                </TouchableOpacity>

                {/* Right: Camera Flip Toggle (Hidden during recording) */}
                <TouchableOpacity
                  style={[styles.iconCircleBottom, { opacity: isRecording ? 0 : 1 }]}
                  onPress={toggleFacing}
                  disabled={isRecording}
                >
                  <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Telegram Subtitle: "Tap for photo, hold for video" (Hidden during recording) */}
              {!isRecording && (
                <Text style={styles.shutterHintText}>Tap for photo, hold for video</Text>
              )}
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

  // Active recording floating timer pill (Image 2)
  topCenterTimerWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  recFloatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recTimerText: {
    color: '#FFFFFF',
    fontWeight: '700',
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

  // ── Bottom Controls (Telegram Screenshot Replica) ──
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  iconCircleBottom: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shutter button (Telegram White Ring in Idle, Solid Red Circle in Video)
  shutterOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterOuterRingRec: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  shutterInnerCircleRecording: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#E53935', // Solid Telegram Red
  },

  // Hint text
  shutterHintText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
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
