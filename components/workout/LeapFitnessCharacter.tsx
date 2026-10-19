import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { getExerciseAnimation } from '@/constants/exerciseAnimations';

interface LeapFitnessCharacterProps {
  exerciseId: string;
  isPaused?: boolean;
}

export default function LeapFitnessCharacter({
  exerciseId,
  isPaused = false,
}: LeapFitnessCharacterProps) {
  const videoRef = useRef<Video>(null);
  const webVideoRef = useRef<any>(null);
  const animAsset = getExerciseAnimation(exerciseId);

  // Play / Pause control for HTML5 video on web
  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      if (isPaused) {
        webVideoRef.current.pause?.();
      } else {
        webVideoRef.current.play?.().catch(() => {});
      }
    }
  }, [isPaused, exerciseId]);

  // WEB: Direct HTML5 <video> with strict objectFit contain & center positioning
  if (Platform.OS === 'web' && animAsset.video) {
    let videoUrl = '';
    const raw = animAsset.video as any;
    if (typeof raw === 'string') {
      videoUrl = raw;
    } else if (raw?.uri) {
      videoUrl = raw.uri;
    } else if (raw?.default) {
      videoUrl = raw.default;
    } else if (typeof raw === 'number') {
      try {
        const { Image: RNImage } = require('react-native');
        videoUrl = RNImage.resolveAssetSource(raw)?.uri || '';
      } catch (_) {}
    }

    if (videoUrl) {
      return (
        <View style={styles.container}>
          <video
            ref={webVideoRef}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              maxWidth: 340,
              maxHeight: 310,
              objectFit: 'contain',
              objectPosition: 'center center',
              display: 'block',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>
      );
    }
  }

  // NATIVE: Expo AV Video Player
  return (
    <View style={styles.container}>
      {animAsset.video ? (
        <Video
          ref={videoRef as any}
          source={animAsset.video}
          style={styles.videoPlayer}
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay={!isPaused}
          isMuted
          usePoster
          posterSource={animAsset.thumbnail}
          posterStyle={styles.posterImage}
        />
      ) : (
        <Image
          source={animAsset.thumbnail}
          style={styles.fallbackImage}
          contentFit="contain"
          transition={150}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    maxWidth: 340,
    maxHeight: 310,
    backgroundColor: '#FFFFFF',
  },
  posterImage: {
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    maxWidth: 340,
    maxHeight: 310,
    backgroundColor: '#FFFFFF',
  },
});
