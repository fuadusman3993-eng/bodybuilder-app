import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

export default function CreatePostRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/create');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#050B0E', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
