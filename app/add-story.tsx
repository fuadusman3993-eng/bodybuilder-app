import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, TextInput, Alert, Animated, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

const TEXT_COLORS = ['#FFFFFF', '#000000', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899'];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
          <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: '#FFF', textAlign: 'center' }}>{String(this.state.error)}</Text>
          <TouchableOpacity onPress={() => this.setState({hasError: false})} style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 }}>
            <Text style={{ color: '#FFF' }}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function AddStory() {
  const router = useRouter();
  const { user } = useUserStore();

  const [step, setStep] = useState<'camera' | 'editor' | 'uploading' | 'done'>('camera');
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // Editor
  const [overlayText, setOverlayText] = useState('');
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);

  // Upload
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // ─── Camera Capture ──────────────────────────────────────────────────
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        if (photo) {
          setImageUri(photo.uri);
          setStep('editor');
        }
      } catch (e) {
        console.warn('Capture error', e);
      }
    }
  };

  // ─── Pick from Gallery (Web + Native) ───────────────────────────────
  const pickFromGallery = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setImageUri(url);
          setStep('editor');
        }
      };
      input.click();
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setStep('editor');
      }
    } catch (e) {
      console.warn('Gallery error:', e);
    }
  };

  // ─── Upload Story ────────────────────────────────────────────────────
  const uploadStory = async () => {
    if (!imageUri || !user.uid) return;
    setStep('uploading');
    setUploadProgress(0);

    try {
      animateTo(30);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
      const fileName = `${user.uid}_${Date.now()}.${ext}`;

      animateTo(60);

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, blob, { contentType: mimeType, upsert: false });

      if (uploadError) throw uploadError;

      animateTo(80);

      const { data: urlData } = supabase.storage.from('stories').getPublicUrl(fileName);
      const avatarUrl = `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`;

      const { error: dbError } = await supabase.from('stories').insert({
        uid: user.uid,
        username: user.name || 'User',
        avatar_url: avatarUrl,
        image_url: urlData.publicUrl,
        caption: overlayText.trim() || null,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      animateTo(100);
      setTimeout(() => setStep('done'), 600);
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert('Upload failed: ' + (e.message || 'Error'));
      } else {
        Alert.alert('Upload failed', e.message || 'Something went wrong.');
      }
      setStep('editor');
    }
  };

  const animateTo = (value: number) => {
    setUploadProgress(value);
    Animated.timing(progressAnim, {
      toValue: value / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

  // ─── Render: Camera ───────────────────────────────────────────
  if (step === 'camera') {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={[styles.container, styles.center]}>
          <Text style={{ color: '#FFF' }}>We need your permission to show the camera</Text>
          <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: Colors.primary, borderRadius: 8 }} onPress={requestPermission}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 20 }} onPress={pickFromGallery}>
            <Text style={{ color: Colors.primary }}>Or Pick from Gallery</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView style={StyleSheet.absoluteFillObject} facing={facing} ref={cameraRef}>
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                <Ionicons name="camera-reverse" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
                <Ionicons name="images" size={28} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.captureOuter} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <View style={styles.galleryBtn} /> 
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ─── Render: Editor ──────────────────────────────────────────────────
  if (step === 'editor' && imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} />
        
        {/* Top Controls */}
        <SafeAreaView style={styles.editorTop}>
          <TouchableOpacity onPress={() => setStep('camera')} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.colorPicker}>
            {TEXT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, textColor === c && styles.colorDotActive]}
                onPress={() => setTextColor(c)}
              />
            ))}
          </View>
        </SafeAreaView>

        {/* Text Overlay */}
        <View style={styles.overlayTextContainer}>
          <TextInput
            style={[styles.overlayTextInput, { color: textColor }]}
            placeholder="Type something..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={overlayText}
            onChangeText={setOverlayText}
            multiline
            textAlign="center"
            autoFocus
          />
        </View>

        {/* Bottom Controls */}
        <SafeAreaView style={styles.editorBottom}>
          <TouchableOpacity style={styles.postBtn} onPress={uploadStory}>
            <Text style={styles.postBtnText}>Post Story</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Render: Uploading ───────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.uploadingTitle}>Uploading Story...</Text>
        <View style={styles.progressCircle}>
          <Animated.View style={[styles.progressFill, {
            transform: [{
              rotate: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }]
          }]} />
          <View style={styles.progressInner}>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── Render: Done ────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.center]}>
      <Ionicons name="checkmark-circle" size={100} color={Colors.primary} />
      <Text style={styles.successTitle}>Story Posted!</Text>
      <TouchableOpacity
        style={styles.viewStoryBtn}
        onPress={() => {
          router.back();
        }}
      >
        <Text style={styles.viewStoryBtnText}>Return to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AddStoryWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AddStory />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  // Camera
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  cameraFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 30, paddingBottom: 50 },
  captureOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FFF' },
  galleryBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 25 },

  // Editor
  editorTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  colorPicker: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20, gap: 8 },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#FFF' },
  overlayTextContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlayTextInput: { fontSize: 36, fontWeight: '900', textAlign: 'center', width: '100%', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  editorBottom: { padding: 20, paddingBottom: 40, alignItems: 'flex-end' },
  postBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, gap: 8 },
  postBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },

  // Uploading
  uploadingTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 40 },
  progressCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  progressFill: { position: 'absolute', width: '100%', height: '100%', backgroundColor: Colors.primary, left: '-50%', top: '-50%', transformOrigin: 'bottom right' },
  progressInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', position: 'absolute' },
  progressText: { fontSize: 28, fontWeight: '900', color: Colors.primary },

  // Success
  successTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', marginVertical: 20 },
  viewStoryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  viewStoryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
