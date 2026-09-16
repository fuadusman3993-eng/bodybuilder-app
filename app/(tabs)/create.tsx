import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { profileData } from '../../constants/mockData';
import { useUserStore, UserTier } from '../../store/userStore';
import GuestBlocker from '../../components/ui/GuestBlocker';

export default function CreateScreen() {
  const [content, setContent] = useState('');
  const { user } = useUserStore();

  if (user.tier === UserTier.GUEST) {
    return <GuestBlocker feature="create" />;
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity style={[styles.postButton, !content && styles.postButtonDisabled]}>
          <Text style={[styles.postButtonText, !content && styles.postButtonTextDisabled]}>Post</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputContainer}>
          <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
          <TextInput
            style={styles.input}
            placeholder="What's on your mind? Share your progress..."
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
          />
        </View>

        {/* Media Placeholder */}
        <TouchableOpacity style={styles.mediaUploadArea} activeOpacity={0.7}>
          <View style={styles.mediaUploadInner}>
            <Ionicons name="images-outline" size={32} color={Colors.textSecondary} />
            <Text style={styles.mediaUploadText}>Add Photo / Video</Text>
          </View>
        </TouchableOpacity>

        {/* Action Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarAction}>
            <Ionicons name="location-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarAction}>
            <Ionicons name="happy-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarAction}>
            <Ionicons name="pricetag-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  postButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mediaUploadArea: {
    marginHorizontal: 16,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaUploadInner: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mediaUploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 'auto',
    marginBottom: 80, // Space for bottom nav
  },
  toolbarAction: {
    marginRight: 24,
  },
});
