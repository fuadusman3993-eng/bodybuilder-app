import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
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
          icon="notifications-outline" 
          title="Notifications" 
          description="Get workout reminders, updates and more." 
        />
        <PermissionCard 
          icon="camera-outline" 
          title="Camera" 
          description="Track your progress and capture your workouts." 
        />
        <PermissionCard 
          icon="location-outline" 
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#FACC15', // Yellowish color from the screenshot
    width: '100%',
    height: 56,
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
