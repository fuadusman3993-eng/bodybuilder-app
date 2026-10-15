import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface MuscleAnatomyViewProps {
  primaryMuscles: string[];   // e.g. ['chest', 'triceps'] or ['abs'] or ['quads']
  secondaryMuscles?: string[];
  exerciseName?: string;
}

export default function MuscleAnatomyView({
  primaryMuscles = [],
  secondaryMuscles = [],
  exerciseName,
}: MuscleAnatomyViewProps) {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [viewAngle, setViewAngle] = useState<'front' | 'back'>('front');

  // Normalize target muscles
  const targets = primaryMuscles.map(m => m.toLowerCase());
  const secondaries = (secondaryMuscles || []).map(m => m.toLowerCase());

  const isChest = targets.includes('chest') || secondaries.includes('chest');
  const isAbs = targets.includes('abs') || secondaries.includes('abs') || targets.includes('core');
  const isQuads = targets.includes('quads') || secondaries.includes('quads') || targets.includes('legs');
  const isCalves = targets.includes('calves') || secondaries.includes('calves');
  const isShoulders = targets.includes('shoulders') || secondaries.includes('shoulders');
  const isArms = targets.includes('biceps') || targets.includes('triceps') || secondaries.includes('biceps') || secondaries.includes('triceps');
  const isBack = targets.includes('back') || secondaries.includes('back');
  const isGlutes = targets.includes('glutes') || secondaries.includes('glutes');

  // Color selection
  const highlightColor = '#EF4444'; // Glowing Red as in Caliverse 3D
  const secondaryColor = '#F97316'; // Orange
  const bodyBaseColor = '#27272A';  // Sleek Dark Gray
  const bodyOutlineColor = '#3F3F46';

  const getColor = (isActive: boolean, isSec: boolean) => {
    if (isActive) return highlightColor;
    if (isSec) return secondaryColor;
    return bodyBaseColor;
  };

  return (
    <View style={styles.card}>
      {/* Top Bar: Muscle Tags & Gender/Angle Toggles */}
      <View style={styles.topRow}>
        <View style={styles.targetBadge}>
          <View style={styles.targetDot} />
          <Text style={styles.targetLabel}>
            {primaryMuscles.length > 0 ? primaryMuscles.join(' • ').toUpperCase() : 'FULL BODY'}
          </Text>
        </View>

        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, gender === 'male' && styles.toggleBtnActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.toggleText, gender === 'male' && styles.toggleTextActive]}>M</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, gender === 'female' && styles.toggleBtnActive]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.toggleText, gender === 'female' && styles.toggleTextActive]}>F</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.toggleBtn, viewAngle === 'front' && styles.toggleBtnActive]}
            onPress={() => setViewAngle('front')}
          >
            <Text style={[styles.toggleText, viewAngle === 'front' && styles.toggleTextActive]}>Front</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewAngle === 'back' && styles.toggleBtnActive]}
            onPress={() => setViewAngle('back')}
          >
            <Text style={[styles.toggleText, viewAngle === 'back' && styles.toggleTextActive]}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SVG Anatomical Visualizer */}
      <View style={styles.svgWrapper}>
        <Svg width="180" height="240" viewBox="0 0 180 240">
          <Defs>
            <LinearGradient id="glowRed" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FF4D4D" />
              <Stop offset="1" stopColor="#DC2626" />
            </LinearGradient>
            <LinearGradient id="glowOrange" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDBA74" />
              <Stop offset="1" stopColor="#EA580C" />
            </LinearGradient>
          </Defs>

          {/* HEAD */}
          <Circle cx="90" cy="22" r="14" fill="#334155" stroke={bodyOutlineColor} strokeWidth="1.5" />
          {/* NECK */}
          <Path d="M84 34 L96 34 L95 44 L85 44 Z" fill="#334155" />

          {viewAngle === 'front' ? (
            <>
              {/* SHOULDERS */}
              <Path
                d="M60 46 Q70 42 85 44 L85 58 Q70 56 56 56 Z"
                fill={getColor(isShoulders, false)}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M120 46 Q110 42 95 44 L95 58 Q110 56 124 56 Z"
                fill={getColor(isShoulders, false)}
                stroke={bodyOutlineColor}
              />

              {/* CHEST / PECS */}
              <Path
                d="M68 56 Q90 56 90 74 Q74 76 68 68 Z"
                fill={isChest ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />
              <Path
                d="M112 56 Q90 56 90 74 Q106 76 112 68 Z"
                fill={isChest ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />

              {/* ARMS / BICEPS */}
              <Path
                d="M54 58 Q50 82 46 106 Q42 110 46 120 L54 118 Q58 92 62 70 Z"
                fill={getColor(isArms, false)}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M126 58 Q130 82 134 106 Q138 110 134 120 L126 118 Q122 92 118 70 Z"
                fill={getColor(isArms, false)}
                stroke={bodyOutlineColor}
              />

              {/* ABS (6-Pack) */}
              <Path
                d="M78 78 L89 78 L89 90 L78 90 Z"
                fill={isAbs ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M91 78 L102 78 L102 90 L91 90 Z"
                fill={isAbs ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M78 92 L89 92 L89 104 L78 104 Z"
                fill={isAbs ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M91 92 L102 92 L102 104 L91 104 Z"
                fill={isAbs ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M80 106 L89 106 L89 118 L80 118 Z"
                fill={isAbs ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M91 106 L100 106 L100 118 L91 118 Z"
                fill={isAbs ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />

              {/* HIPS / PELVIS */}
              <Path
                d="M72 120 Q90 128 108 120 L102 136 L78 136 Z"
                fill={bodyBaseColor}
                stroke={bodyOutlineColor}
              />

              {/* QUADS (Upper Legs) */}
              <Path
                d="M68 138 Q66 170 72 186 L86 186 Q88 166 84 138 Z"
                fill={isQuads ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />
              <Path
                d="M112 138 Q114 170 108 186 L94 186 Q92 166 96 138 Z"
                fill={isQuads ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />

              {/* CALVES (Lower Legs) */}
              <Path
                d="M70 190 Q66 210 72 232 L82 232 Q86 214 84 190 Z"
                fill={isCalves ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M110 190 Q114 210 108 232 L98 232 Q94 214 96 190 Z"
                fill={isCalves ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
            </>
          ) : (
            <>
              {/* BACK VIEW */}
              {/* UPPER BACK / LATS */}
              <Path
                d="M66 50 Q90 46 114 50 L106 88 Q90 94 74 88 Z"
                fill={isBack ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />
              {/* LOWER BACK */}
              <Path
                d="M74 90 Q90 94 106 90 L102 118 Q90 122 78 118 Z"
                fill={isBack ? "url(#glowOrange)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              {/* GLUTES */}
              <Path
                d="M72 120 Q88 122 89 138 L72 144 Z"
                fill={isGlutes ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />
              <Path
                d="M108 120 Q92 122 91 138 L108 144 Z"
                fill={isGlutes ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
                strokeWidth="1.5"
              />
              {/* HAMSTRINGS */}
              <Path
                d="M70 146 Q68 168 72 186 L86 186 Q86 168 84 146 Z"
                fill={isQuads ? "url(#glowOrange)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M110 146 Q112 168 108 186 L94 186 Q94 168 96 146 Z"
                fill={isQuads ? "url(#glowOrange)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              {/* CALVES (Back) */}
              <Path
                d="M70 190 Q66 210 72 232 L82 232 Q86 214 84 190 Z"
                fill={isCalves ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
              <Path
                d="M110 190 Q114 210 108 232 L98 232 Q94 214 96 190 Z"
                fill={isCalves ? "url(#glowRed)" : bodyBaseColor}
                stroke={bodyOutlineColor}
              />
            </>
          )}
        </Svg>
      </View>

      {/* Legend / Status */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Primary Target</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3F3F46' }]} />
          <Text style={styles.legendText}>Resting</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 6,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  targetLabel: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#000',
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#334155',
    marginHorizontal: 2,
  },
  svgWrapper: {
    width: 180,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
});
