import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Step = 'source' | 'editor' | 'uploading' | 'done';

const TEXT_COLORS = ['#FFFFFF', '#000000', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899'];

function AddStory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

  const [step, setStep] = useState<Step>('source');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSteps, setUploadSteps] = useState({ image: false, db: false, record: false });

  const progressAnim = useRef(new Animated.Value(0)).current;

  // ─── Pick from Gallery ───────────────────────────────────────────────
  const pickFromGallery = async () => {
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
  };

  // ─── Take a Photo ────────────────────────────────────────────────────
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('editor');
    }
  };

  // ─── Upload Story ────────────────────────────────────────────────────
  const uploadStory = async () => {
    if (!imageUri || !user.uid) return;
    setStep('uploading');
    setUploadProgress(0);
    setUploadSteps({ image: false, db: false, record: false });

    try {
      // Animate to 40%
      animateTo(40);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const ext = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.uid}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, blob, { contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      setUploadSteps(s => ({ ...s, image: true }));
      animateTo(70);

      const { data: urlData } = supabase.storage.from('stories').getPublicUrl(fileName);
      setUploadSteps(s => ({ ...s, db: true }));
      animateTo(85);

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

      setUploadSteps(s => ({ ...s, record: true }));
      animateTo(100);

      setTimeout(() => setStep('done'), 600);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Something went wrong.');
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

  // ─── Render: Choose Source ───────────────────────────────────────────
  if (step === 'source') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Story</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.sourceBody}>
          <Text style={styles.sourceHint}>Choose how to add your story</Text>

          <TouchableOpacity style={styles.sourceCard} onPress={takePhoto} activeOpacity={0.8}>
            <View style={[styles.sourceIconBox, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Ionicons name="camera" size={30} color={Colors.primary} />
            </View>
            <View style={styles.sourceTextCol}>
              <Text style={styles.sourceCardTitle}>Camera</Text>
              <Text style={styles.sourceCardSub}>Take a new photo or video</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sourceCard} onPress={pickFromGallery} activeOpacity={0.8}>
            <View style={[styles.sourceIconBox, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="images" size={30} color="#3B82F6" />
            </View>
            <View style={styles.sourceTextCol}>
              <Text style={styles.sourceCardTitle}>Gallery</Text>
              <Text style={styles.sourceCardSub}>Choose from your photos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Render: Editor ──────────────────────────────────────────────────
  if (step === 'editor') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('source')}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Text</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={uploadStory}>
              <Text style={styles.nextBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Photo Preview with Text Overlay */}
        <View style={styles.editorPreview}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          )}
          <View style={styles.editorDimOverlay} />
          {overlayText.length > 0 && (
            <View style={styles.overlayTextWrap}>
              <Text style={[styles.overlayTextDisplay, { color: textColor }]}>{overlayText}</Text>
            </View>
          )}
        </View>

        {/* Text Input */}
        <View style={[styles.editorBottom, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.overlayInput]}
            placeholder="Write something..."
            placeholderTextColor={Colors.textMuted}
            value={overlayText}
            onChangeText={setOverlayText}
            maxLength={80}
          />
          {/* Color Picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
            {TEXT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setTextColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  textColor === c && styles.colorDotSelected,
                ]}
              />
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── Render: Uploading ───────────────────────────────────────────────
  if (step === 'uploading') {
    const circumference = 2 * Math.PI * 44;
    const strokeDashoffset = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
    });

    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.uploadingTitle}>Uploading Story...</Text>

        {/* Circular Progress */}
        <View style={styles.circleWrap}>
          <Text style={styles.progressPercent}>{uploadProgress}%</Text>
          {/* Simple animated ring using border */}
          <View style={styles.circleTrack}>
            <View
              style={[
                styles.circleFill,
                { transform: [{ rotate: `${(uploadProgress / 100) * 360}deg` }] },
              ]}
            />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsList}>
          <StepRow label="Uploading image" done={uploadSteps.image} />
          <StepRow label="Saving to Supabase" done={uploadSteps.db} />
          <StepRow label="Creating story record" done={uploadSteps.record} />
        </View>
        <Text style={styles.pleaseWait}>Please wait...</Text>
      </SafeAreaView>
    );
  }

  // ─── Render: Done ────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={50} color={Colors.primary} />
        </View>
        <Text style={styles.successTitle}>Story Posted!</Text>
        <Text style={styles.successSub}>Your story is now live for 24 hours.</Text>
        <TouchableOpacity
          style={styles.viewStoryBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.viewStoryBtnText}>View Story</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

function StepRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, done && styles.stepDotDone]}>
        {done && <Ionicons name="checkmark" size={12} color="#000" />}
      </View>
      <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  // ── Source ──
  sourceBody: { flex: 1, padding: 20, gap: 14 },
  sourceHint: { color: Colors.textMuted, fontSize: 13, marginBottom: 6 },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceTextCol: { flex: 1 },
  sourceCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  sourceCardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cancelBtn: {
    margin: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },

  // ── Editor ──
  nextBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  editorPreview: {
    flex: 1,
    backgroundColor: '#111',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorDimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayTextWrap: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
  },
  overlayTextDisplay: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  editorBottom: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  overlayInput: {
    color: Colors.textPrimary,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  colorRow: { flexDirection: 'row' },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: { borderColor: Colors.primary, transform: [{ scale: 1.2 }] },

  // ── Uploading ──
  uploadingTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 32, textAlign: 'center' },
  circleWrap: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  circleTrack: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  circleFill: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: Colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressPercent: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  stepsList: { gap: 14, width: '100%', marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepLabel: { color: Colors.textMuted, fontSize: 14 },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: '600' },
  pleaseWait: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },

  // ── Done ──
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginBottom: 10 },
  successSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 36 },
  viewStoryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});

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

export default function AddStoryWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AddStory />
    </ErrorBoundary>
  );
}
