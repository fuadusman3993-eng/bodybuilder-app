import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, Alert, Animated, ScrollView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useUserStore, UserTier } from '../store/userStore';
import { Colors } from '../constants/colors';
import { invalidateCommunityCache } from './(tabs)/community';

const BG = '#0A0F1A';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isCoach = user.role === 'coach';
  const isPremium = user.tier === UserTier.PREMIUM;
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(!isCoach && !isPremium);

  useEffect(() => {
    checkPostLimit();
  }, [user.uid, user.role, user.tier]);

  const checkPostLimit = async () => {
    if (isCoach || isPremium || !user.uid) {
      setCheckingLimit(false);
      return;
    }
    try {
      // Free trainees: 1 post per 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('uid', user.uid)
        .gte('created_at', thirtyDaysAgo);

      if (!error && (count || 0) >= 1) {
        setLimitReached(true);
      }
    } catch (e) {
      console.warn('Check limit error:', e);
    } finally {
      setCheckingLimit(false);
    }
  };

  const animateTo = (val: number) => {
    setProgress(val);
    Animated.timing(progressAnim, {
      toValue: val / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const pickImage = async () => {
    if (limitReached) {
      Alert.alert(
        'Post Limit Reached',
        'Free accounts can share 1 post per month. As a Coach or with a Premium subscription, you can post without limits!'
      );
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const handlePost = async () => {
    if (limitReached) {
      Alert.alert(
        'Post Limit Reached',
        'Free trainee accounts can share 1 post per month. Upgrade to Premium for unlimited monthly posts!'
      );
      return;
    }
    if (!imageUri) {
      Alert.alert('No photo selected', 'Please select a photo first.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in again before posting.');
      return;
    }

    setUploading(true);
    animateTo(20);

    try {
      // 1. Fetch image as blob and convert to ArrayBuffer for cross-platform upload
      const response = await fetch(imageUri);
      if (!response.ok) throw new Error('Failed to read the selected image.');
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
      const fileName = `${user.uid}_${Date.now()}.${ext}`;

      animateTo(40);

      // Convert blob → ArrayBuffer (works on both web and mobile)
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read image data.'));
        reader.readAsArrayBuffer(blob);
      });

      animateTo(55);

      // 2. Upload to Supabase storage bucket 'posts'
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;

      animateTo(75);

      // 3. Get public URL
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      const avatarUrl = user.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`;

      // 4. Insert post record into 'posts' table
      const { error: dbError } = await supabase.from('posts').insert({
        uid: user.uid,
        username: user.name || 'User',
        avatar_url: avatarUrl,
        image_url: urlData.publicUrl,
        caption: caption.trim() || null,
        likes_count: 0,
        created_at: new Date().toISOString(),
      });
      if (dbError) throw dbError;

      animateTo(100);
      setUploading(false);
      invalidateCommunityCache();

      if (Platform.OS === 'web') {
        window.alert('✅ Posted! Your post is now live in the Community!');
        router.replace('/(tabs)/community');
      } else {
        Alert.alert('✅ Posted!', 'Your post is now live in the Community!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/community') }
        ]);
      }
    } catch (e: any) {
      console.warn('Post upload error:', e);
      setUploading(false);
      setProgress(0);
      progressAnim.setValue(0);
      const errMsg = e?.message || 'Could not upload your post. Please try again.';
      if (Platform.OS === 'web') {
        window.alert('Post Failed: ' + errMsg);
      } else {
        Alert.alert('Post Failed', errMsg);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, (!imageUri || uploading || limitReached) && { opacity: 0.4 }]}
          onPress={handlePost}
          disabled={!imageUri || uploading || limitReached}
        >
          <Text style={styles.postBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {uploading && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
            }]}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Monthly Limit Card if reached */}
        {limitReached && (
          <View style={styles.limitCard}>
            <View style={styles.limitHeader}>
              <Ionicons name="lock-closed" size={18} color="#F59E0B" />
              <Text style={styles.limitTitle}>Monthly Free Post Limit Reached (1/1)</Text>
            </View>
            <Text style={styles.limitDesc}>
              Free trainee accounts can share 1 post every 30 days. Real Coaches and Premium members enjoy unlimited posting privileges!
            </Text>
          </View>
        )}

        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={imageUri} style={styles.pickedImage} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>Tap to select a photo</Text>
            </View>
          )}
          {imageUri && (
            <View style={styles.changePhotoOverlay}>
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.changePhotoText}>Change</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Image
            source={user.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`}
            placeholder="https://ui-avatars.com/api/?name=User&background=2A3241&color=fff&size=150"
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.miniAvatar}
          />
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={Colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={300}
            editable={!limitReached}
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📸 Community Guidelines</Text>
          <Text style={styles.tipText}>• Coaches post unlimited workouts and advice</Text>
          <Text style={styles.tipText}>• Free trainees get 1 post per month to share major milestones</Text>
          <Text style={styles.tipText}>• Premium trainees can post without restrictions</Text>
        </View>

        {uploading && (
          <View style={styles.uploadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingText}>Uploading... {progress}%</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },

  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 0 },
  progressFill: { height: '100%', backgroundColor: Colors.primary },

  scroll: { padding: 16, paddingBottom: 80 },

  limitCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  limitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  limitTitle: { color: '#F59E0B', fontSize: 14, fontWeight: '700' },
  limitDesc: { color: Colors.textSecondary, fontSize: 12.5, lineHeight: 18 },

  imagePicker: { borderRadius: 16, overflow: 'hidden', height: 360, marginBottom: 16, position: 'relative' },
  pickedImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.6)', justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', gap: 12 },
  placeholderText: { color: Colors.textMuted, fontSize: 14 },
  changePhotoOverlay: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  changePhotoText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  captionContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  miniAvatar: { width: 36, height: 36, borderRadius: 18, marginTop: 4 },
  captionInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, lineHeight: 22, minHeight: 60 },

  tipsCard: { backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 8 },
  tipsTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  tipText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },

  uploadingState: { alignItems: 'center', marginTop: 30, gap: 12 },
  uploadingText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
