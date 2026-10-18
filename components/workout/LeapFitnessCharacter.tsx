import React, { useRef } from 'react';
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
  const animAsset = getExerciseAnimation(exerciseId);

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
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    maxWidth: 420,
    maxHeight: 330,
    backgroundColor: '#FFFFFF',
  },
  posterImage: {
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    maxWidth: 420,
    maxHeight: 330,
    backgroundColor: '#FFFFFF',
  },
});
