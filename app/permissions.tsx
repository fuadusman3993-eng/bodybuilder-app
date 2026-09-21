import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCameraPermissions } from 'expo-camera';
import Logo from '../components/auth/Logo';
import PermissionCard from '../components/auth/PermissionCard';
import { Colors } from '../constants/colors';

export default function PermissionsScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const handleAllowAccess = async () => {
    try {
      // 1. Request Notifications (Expo Notifications requires manual handling on some platforms, 
      // but requestPermissionsAsync is standard)
      await Notifications.requestPermissionsAsync();

      // 2. Request Camera
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      // 3. Request Location
      await Location.requestForegroundPermissionsAsync();

      // Proceed to login regardless of deny/allow (as per requirements: "must NOT crash")
      router.replace('/login');
    } catch (error) {
      console.warn('Permission request error:', error);
      // Still proceed to login if something fails
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Logo size="small" />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          Enable App <Text style={styles.titleHighlight}>Features</Text>
        </Text>
        <Text style={styles.subtitle}>
          We need a few permissions to give you the best experience.
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <PermissionCard 
          icon="notifications" 
          title="Notifications" 
          description="Get workout reminders, updates and more." 
        />
        <PermissionCard 
          icon="camera" 
          title="Camera" 
          description="Track your progress and capture your workouts." 
        />
        <PermissionCard 
          icon="location" 
          title="Location" 
          description="Find nearby gyms and personal trainers." 
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleAllowAccess} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Allow Access</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          You can change these permissions anytime in your device settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#FACC15',
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  }
});
