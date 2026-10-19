import React, { useRef, useEffect, useState } from 'react';
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
  const [videoError, setVideoError] = useState(false);
  const animAsset = getExerciseAnimation(exerciseId);

  // Reset video error when exercise changes
  useEffect(() => {
    setVideoError(false);
  }, [exerciseId]);

  // Play / Pause control for HTML5 video on web
  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current && !videoError) {
      if (isPaused) {
        webVideoRef.current.pause?.();
      } else {
        webVideoRef.current.play?.().catch(() => {});
      }
    }
  }, [isPaused, exerciseId, videoError]);

  // WEB: Direct HTML5 <video> with strict objectFit contain & center positioning, with instant image fallback
  if (Platform.OS === 'web') {
    let videoUrl = '';
    if (!videoError && animAsset.video) {
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
    }

    if (videoUrl && !videoError) {
      return (
        <View style={styles.container}>
          <video
            ref={webVideoRef}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: 340,
              maxHeight: 310,
              objectFit: 'contain',
              objectPosition: 'center center',
              display: 'block',
              margin: '0 auto',
            }}
          />
        </View>
      );
    }

    // Web Fallback: Render guaranteed exercise thumbnail / graphic
    return (
      <View style={styles.container}>
        <Image
          source={animAsset.thumbnail || animAsset.source}
          style={styles.fallbackImage}
          contentFit="contain"
          transition={150}
        />
      </View>
    );
  }

  // NATIVE: Expo AV Video Player with instant image fallback on error
  return (
    <View style={styles.container}>
      {animAsset.video && !videoError ? (
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
          onError={() => setVideoError(true)}
        />
      ) : (
        <Image
          source={animAsset.thumbnail || animAsset.source}
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
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    maxWidth: 340,
    maxHeight: 310,
  },
  posterImage: {
    resizeMode: 'contain',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    maxWidth: 340,
    maxHeight: 310,
  },
});
