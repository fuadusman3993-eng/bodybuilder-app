import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { captureSystemError } from '../lib/telemetryService';

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Automatically report broken route / 404 to CEO Dashboard
    const msg = `ተጠቃሚው የሌለ ወይም የተበላሸ ገጽ ከፍቶ አልሰራም (404 Page Not Found): ${pathname || 'Unknown Route'}`;
    captureSystemError(msg, {
      component: 'AppNavigation',
      severity: 'critical',
      metadata: { pathname, type: '404_not_found' },
    });
  }, [pathname]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.title}>ገጹ አልተገኘም (Page Not Found)</Text>
        <Text style={styles.subtitle}>
          የጠየቁት ገጽ ({pathname}) በአሁኑ ሰዓት አይገኝም። ይህ ችግር ወዲያውኑ ለ CEO Mission Control ሪፖርት ተደርጓል።
        </Text>

        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="home-outline" size={18} color="#050B0E" />
          <Text style={styles.homeBtnText}>ወደ ዋና ገጽ ተመለስ (Go to Home)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B0E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  homeBtnText: {
    color: '#050B0E',
    fontWeight: '700',
    fontSize: 14,
  },
});
