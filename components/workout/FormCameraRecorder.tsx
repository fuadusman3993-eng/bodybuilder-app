import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Only import Camera on native platforms to avoid Vercel web build crash
let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch {}
}

interface FormCameraProps {
  visible: boolean;
  onClose: () => void;
}

export default function FormCameraRecorder({ visible, onClose }: FormCameraProps) {
  const permissions = useCameraPermissions ? useCameraPermissions() : [null, async () => ({ granted: false })];
  const [permission, requestPermission] = permissions;

  const [recording, setRecording] = useState(false);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to record your form.');
    }
  };

  // Web: show graceful fallback
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.webFallback}>
          <View style={styles.webFallbackCard}>
            <Ionicons name="videocam-off-outline" size={48} color="#555" />
            <Text style={styles.webFallbackTitle}>Camera Not Available</Text>
            <Text style={styles.webFallbackText}>
              Form recording requires the BodyBuilder mobile app. Download the app to record your workouts.
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {permission?.granted && CameraView ? (
          <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.permissionBg]}>
            <Ionicons name="camera-outline" size={64} color="#555" />
            <Text style={styles.permText}>Camera permission required</Text>
            <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
              <Text style={styles.permBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        <SafeAreaView style={styles.overlay}>
          <TouchableOpacity style={styles.closeTop} onPress={onClose}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {permission?.granted && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.recordBtn, recording && styles.recordBtnActive]}
                onPress={() => setRecording(r => !r)}
              >
                <View style={[styles.recordBtnInner, recording && styles.recordBtnInnerActive]} />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  closeTop: { alignSelf: 'flex-start', padding: 20 },
  bottomBar: { padding: 40, alignItems: 'center' },
  recordBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  recordBtnActive: { borderColor: '#EF4444' },
  recordBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EF4444' },
  recordBtnInnerActive: { borderRadius: 8, width: 32, height: 32 },
  permissionBg: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  permText: { color: '#888', fontSize: 15, marginTop: 8 },
  permBtn: { backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30, marginTop: 8 },
  permBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  webFallback: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  webFallbackCard: { backgroundColor: '#111', borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, maxWidth: 360, width: '100%' },
  webFallbackTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  webFallbackText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  closeBtn: { backgroundColor: '#222', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30, marginTop: 8 },
  closeBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
