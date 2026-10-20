import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { invalidateCommunityCache } from './community';
import AuthBottomSheetModal from '../../components/auth/AuthBottomSheetModal';

export default function CreateScreen() {
  const router = useRouter();
  const { user, authInitialized } = useUserStore();

  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // ── Guest Guard ───────────────────────────────────────────
  if (!authInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const [showAuthModal, setShowAuthModal] = useState(false);

  if (user.tier === UserTier.GUEST || !user.uid) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/community')} style={styles.iconBtn}>
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Guest View matching Image 1 */}
        <View style={styles.guestCenterWrap}>
          <View style={styles.guestOutlineIconWrap}>
            <Ionicons name="create-outline" size={60} color="#757575" />
          </View>
          <Text style={styles.guestSubtitle}>Log in to share your workout & progress</Text>
          <TouchableOpacity
            style={styles.guestLoginPillBtn}
            activeOpacity={0.85}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={styles.guestLoginPillBtnText}>Login</Text>
          </TouchableOpacity>
        </View>

        <AuthBottomSheetModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </SafeAreaView>
    );
  }

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=00E676&color=000&size=150`;
  const avatarUrl = user?.avatar || defaultAvatar;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Please grant permission to access your photo library.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Permission Needed', msg);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.warn('Image picker error:', e);
    }
  };

  const handleClose = () => {
    if (content.trim() || imageUri) {
      const confirmDiscard = () => {
        setContent('');
        setImageUri(null);
        router.replace('/(tabs)/community');
      };

      if (Platform.OS === 'web') {
        if (window.confirm('Discard your unsaved post?')) {
          confirmDiscard();
        }
      } else {
        Alert.alert('Discard Post?', 'Are you sure you want to discard this post?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: confirmDiscard },
        ]);
      }
    } else {
      router.replace('/(tabs)/community');
    }
  };

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed && !imageUri) return;
    if (isPosting) return;

    setIsPosting(true);
    try {
      let uploadedImageUrl: string | null = null;

      if (imageUri) {
        const response = await fetch(imageUri);
        if (!response.ok) throw new Error('Could not read the selected image.');
        const blob = await response.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
        const fileName = `${user.uid}_${Date.now()}.${ext}`;

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(new Error('Failed to read image data.'));
          reader.readAsArrayBuffer(blob);
        });

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
        uploadedImageUrl = urlData.publicUrl;
      }

      const { error: dbError } = await supabase.from('posts').insert({
        uid: user.uid,
        username: user.name || 'User',
        avatar_url: avatarUrl,
        image_url: uploadedImageUrl,
        caption: trimmed || null,
        likes_count: 0,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      invalidateCommunityCache();
      setContent('');
      setImageUri(null);

      router.replace({ pathname: '/(tabs)/community', params: { justPosted: '1' } });
    } catch (e: any) {
      console.error('Post creation error:', e);
      const errMsg = e?.message || 'Failed to publish post. Please try again.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const canPost = (content.trim().length > 0 || !!imageUri) && !isPosting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!canPost}
          activeOpacity={0.8}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[styles.postButtonText, !canPost && styles.postButtonTextDisabled]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputContainer}>
            <Image
              source={avatarUrl}
              placeholder={defaultAvatar}
              cachePolicy="memory-disk"
              contentFit="cover"
              style={styles.avatar}
            />
            <TextInput
              style={styles.input}
              placeholder="What's on your mind? Share your progress..."
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              value={content}
              onChangeText={setContent}
              editable={!isPosting}
            />
          </View>

          {/* Media Area */}
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={imageUri} style={styles.previewImage} contentFit="cover" />
              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.previewActionBtn} onPress={pickImage} disabled={isPosting}>
                  <Ionicons name="camera-outline" size={16} color="#FFF" />
                  <Text style={styles.previewActionText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewActionBtn, styles.removeBtn]}
                  onPress={() => setImageUri(null)}
                  disabled={isPosting}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={[styles.previewActionText, { color: '#EF4444' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mediaUploadArea}
              activeOpacity={0.7}
              onPress={pickImage}
              disabled={isPosting}
            >
              <View style={styles.mediaUploadInner}>
                <Ionicons name="images-outline" size={36} color={Colors.primary} />
                <Text style={styles.mediaUploadText}>Add Photo / Progress</Text>
                <Text style={styles.mediaUploadSub}>Tap to browse your gallery</Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  postButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  postButtonTextDisabled: {
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  mediaUploadArea: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 220,
    borderWidth: 2,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaUploadInner: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mediaUploadText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mediaUploadSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  previewContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  previewImage: {
    width: '100%',
    height: 320,
  },
  previewActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  previewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  removeBtn: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  previewActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  /* TikTok Guest State (Image 1) */
  guestCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  guestOutlineIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  guestLoginPillBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    maxWidth: 240,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  guestLoginPillBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
