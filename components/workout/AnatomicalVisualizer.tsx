import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Exercise } from '../../constants/exercises';

interface AnatomicalVisualizerProps {
  exercise: Exercise;
  gender: 'M' | 'F';
  onGenderChange: (g: 'M' | 'F') => void;
  onStartWorkout?: () => void;
  showStartButton?: boolean;
  isLiveWorkout?: boolean;
}

export default function AnatomicalVisualizer({
  exercise,
  gender,
  onGenderChange,
  onStartWorkout,
  showStartButton = true,
  isLiveWorkout = false,
}: AnatomicalVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoSrc = gender === 'M' ? exercise.videoMaleUrl : exercise.videoFemaleUrl;
  const anatomicalImage = gender === 'M' ? exercise.anatomicalMaleImage : exercise.anatomicalFemaleImage;

  // Sync speed & play state on Web
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.playbackRate = speed;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [speed, isPlaying, videoSrc]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  return (
    <View style={styles.container}>
      {/* Visual Area */}
      <View style={styles.mediaWrap}>
        {Platform.OS === 'web' && !videoError ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoading(false)}
            onError={() => {
              setVideoError(true);
              setVideoLoading(false);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 16,
              backgroundColor: '#0a0f1d',
            }}
          />
        ) : (
          <Image
            source={{ uri: anatomicalImage || exercise.thumbnail }}
            style={styles.imageFallback}
            resizeMode="cover"
          />
        )}

        {/* Anatomical Muscle Highlight Overlay Tags */}
        <View style={styles.muscleTagsOverlay}>
          <View style={styles.muscleBadge}>
            <View style={[styles.muscleDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.muscleBadgeText}>
              {exercise.primaryMuscles?.[0] || exercise.muscleGroup} (Primary)
            </Text>
          </View>
          {exercise.primaryMuscles?.[1] && (
            <View style={styles.muscleBadge}>
              <View style={[styles.muscleDot, { backgroundColor: '#F97316' }]} />
              <Text style={styles.muscleBadgeText}>
                {exercise.primaryMuscles[1]}
              </Text>
            </View>
          )}
        </View>

        {/* Live GO! indicator in live session mode */}
        {isLiveWorkout && (
          <View style={styles.liveGoOverlay} pointerEvents="none">
            <Text style={styles.liveGoText}>GO!</Text>
          </View>
        )}
      </View>

      {/* Control Bar (Matching Image 2) */}
      <View style={styles.controlBar}>
        {showStartButton ? (
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.85}
            onPress={onStartWorkout}
          >
            <Ionicons name="walk-outline" size={18} color="#000" />
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Right Controls: Gender [M | F], Play/Pause, Speed [1.0x] */}
        <View style={styles.rightControls}>
          {/* Gender Segmented Switch */}
          <View style={styles.genderSwitch}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'M' && styles.genderBtnActive]}
              onPress={() => onGenderChange('M')}
            >
              <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>M</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'F' && styles.genderBtnActive]}
              onPress={() => onGenderChange('F')}
            >
              <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>F</Text>
            </TouchableOpacity>
          </View>

          {/* Pause / Play */}
          <TouchableOpacity style={styles.iconCtrlBtn} onPress={togglePlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Speed Selector */}
          <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed}>
            <Text style={styles.speedText}>{speed.toFixed(1)}x</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mediaWrap: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#020617',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
  },
  muscleTagsOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 6,
    flexDirection: 'column',
  },
  muscleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  muscleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muscleBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  liveGoOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveGoText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 2,
  },
  genderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  genderBtnActive: {
    backgroundColor: Colors.primary,
  },
  genderText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
  },
  genderTextActive: {
    color: '#000',
  },
  iconCtrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
