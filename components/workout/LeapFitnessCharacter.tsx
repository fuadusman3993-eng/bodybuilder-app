import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LeapFitnessCharacterProps {
  exerciseId: string;
  isPaused?: boolean;
}

export default function LeapFitnessCharacter({
  exerciseId,
  isPaused = false,
}: LeapFitnessCharacterProps) {
  // Animation pulse / bounce for realistic workout rhythm
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (!isPaused) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 750,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.stopAnimation();
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPaused, exerciseId]);

  const translateY = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  // 1. EXACT REAL LEAP FITNESS APP ASSETS (Extracted directly from Image 3 and High Stepping)
  if (exerciseId === 'side-plank-right' || exerciseId === 'side-plank') {
    return (
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.imageWrapper, { transform: [{ translateY }] }]}>
          <Image
            source={require('../../assets/exercises/side_plank_right.png')}
            style={styles.realAppImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  if (exerciseId === 'high-stepping') {
    return (
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.imageWrapper, { transform: [{ translateY }] }]}>
          <Image
            source={require('../../assets/exercises/high_stepping.png')}
            style={styles.realAppImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  // 2. REALISTIC ANATOMICAL VECTOR ATHLETE FOR OTHER EXERCISES (NO ROBOTS / NO STICK FIGURES)
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.characterWrapper,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Svg width="280" height="280" viewBox="0 0 280 280">
          <Defs>
            {/* Blue athletic tank top */}
            <LinearGradient id="blueVest" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0284C7" />
            </LinearGradient>
            {/* Shaded dark gym shorts */}
            <LinearGradient id="gymShorts" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>
            {/* Natural skin tone with muscle contour */}
            <LinearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDBA74" />
              <Stop offset="100%" stopColor="#F97316" />
            </LinearGradient>
            {/* Fitness yoga mat (turquoise matching Image 3) */}
            <LinearGradient id="cyanMat" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#BAE6FD" />
              <Stop offset="100%" stopColor="#7DD3FC" />
            </LinearGradient>
          </Defs>

          {/* JUMPING JACKS (Dynamic Athletic Pose with Muscles & Shaded Contours) */}
          {exerciseId === 'jumping-jacks' ? (
            <G id="realisticJumpingJacks">
              {/* Ground Shadow */}
              <Path d="M70 262 Q140 252 210 262 Q140 272 70 262 Z" fill="rgba(0,0,0,0.06)" />

              {/* Head with realistic profile and hair */}
              <Path
                d="M130 38 Q142 38 144 48 Q144 58 138 66 Q130 68 124 64 Q120 54 122 44 Q124 38 130 38 Z"
                fill="url(#skin)"
              />
              <Path
                d="M120 46 Q124 32 138 32 Q148 34 148 44 Q142 38 134 38 Q126 40 120 48 Z"
                fill="#475569"
              />
              {/* Athletic neck */}
              <Path d="M127 66 L137 66 L139 76 L125 76 Z" fill="url(#skin)" />

              {/* Arms extending overhead in V-formation */}
              {/* Left Arm */}
              <Path
                d="M122 80 Q98 52 82 28 L94 22 Q110 46 128 76 Z"
                fill="url(#skin)"
              />
              {/* Right Arm */}
              <Path
                d="M142 80 Q166 52 182 28 L170 22 Q154 46 136 76 Z"
                fill="url(#skin)"
              />
              {/* Hands */}
              <Circle cx="88" cy="24" r="7" fill="url(#skin)" />
              <Circle cx="176" cy="24" r="7" fill="url(#skin)" />

              {/* Torso with muscular contours & blue vest */}
              <Path
                d="M118 78 Q132 72 146 78 L148 136 Q132 140 116 136 Z"
                fill="url(#blueVest)"
              />

              {/* Athletic dark shorts */}
              <Path
                d="M116 134 L148 134 L158 178 L138 178 L132 152 L126 178 L106 178 Z"
                fill="url(#gymShorts)"
              />

              {/* Muscular legs spread in jump */}
              {/* Left Thigh & Calf */}
              <Path
                d="M112 178 Q98 214 84 246 L96 250 Q110 218 126 178 Z"
                fill="url(#skin)"
              />
              {/* Left Sneaker with white sole */}
              <Path d="M72 248 Q94 250 98 260 L80 262 L70 254 Z" fill="#334155" />
              <Path d="M70 260 L98 260" stroke="#FFF" strokeWidth="2.5" />

              {/* Right Thigh & Calf */}
              <Path
                d="M152 178 Q166 214 180 246 L168 250 Q154 218 138 178 Z"
                fill="url(#skin)"
              />
              {/* Right Sneaker with white sole */}
              <Path d="M192 248 Q170 250 166 260 L184 262 L194 254 Z" fill="#334155" />
              <Path d="M166 260 L194 260" stroke="#FFF" strokeWidth="2.5" />
            </G>
          ) : exerciseId === 'plank' || exerciseId === 'pushup' ? (
            /* PLANK / PUSHUP (Realistic Horizontal Athletic Pose on Yoga Mat matching Image 3) */
            <G id="realisticPlank">
              {/* Yoga Mat */}
              <Rect x="20" y="210" width="240" height="14" rx="4" fill="url(#cyanMat)" />

              {/* Athletic Head Profile */}
              <Path
                d="M214 140 Q226 142 226 154 Q226 164 216 166 Q208 166 206 156 Q206 144 214 140 Z"
                fill="url(#skin)"
              />
              <Path
                d="M210 142 Q218 132 226 136 Q232 144 228 152 Q224 144 216 144 Z"
                fill="#475569"
              />

              {/* Upper Body & Blue Tank Top (Horizontal Plank Alignment) */}
              <Path
                d="M208 158 L142 168 L140 196 L204 188 Z"
                fill="url(#blueVest)"
              />

              {/* Forearm & Elbow supporting body on the mat */}
              <Path
                d="M196 182 L198 212 L212 212 L206 182 Z"
                fill="url(#skin)"
              />

              {/* Dark Athletic Shorts */}
              <Path
                d="M144 168 L98 174 L96 202 L142 198 Z"
                fill="url(#gymShorts)"
              />

              {/* Straight Athletic Legs extending back */}
              <Path
                d="M102 178 L42 190 L40 206 L100 198 Z"
                fill="url(#skin)"
              />

              {/* Athletic Shoes on Toes */}
              <Path
                d="M32 192 L46 196 L42 212 L28 206 Z"
                fill="#334155"
              />
              <Path d="M28 210 L44 212" stroke="#FFF" strokeWidth="2" />
            </G>
          ) : exerciseId === 'standing-bicycle-crunches' || exerciseId === 'russian-twists' ? (
            /* CRUNCHES / RUSSIAN TWISTS (Realistic Core Contraction Pose) */
            <G id="realisticCrunches">
              {/* Ground Shadow */}
              <Path d="M80 260 Q140 250 200 260 Q140 270 80 260 Z" fill="rgba(0,0,0,0.06)" />

              {/* Head Profile tilted in rotation */}
              <Circle cx="134" cy="50" r="16" fill="url(#skin)" />
              <Path d="M122 46 Q128 32 142 34 Q148 40 148 48 Q142 40 134 40 Z" fill="#475569" />

              {/* Hands behind head in crunch position */}
              <Path d="M122 52 L112 62 L120 72 L128 62 Z" fill="url(#skin)" />
              <Path d="M146 52 L156 62 L148 72 L140 62 Z" fill="url(#skin)" />

              {/* Torso rotated in cross-crunch */}
              <Path d="M120 72 Q136 68 148 74 L146 132 Q132 136 118 130 Z" fill="url(#blueVest)" />

              {/* Shorts */}
              <Path d="M116 130 L148 132 L150 172 L134 172 L128 148 L122 172 L110 170 Z" fill="url(#gymShorts)" />

              {/* Standing leg straight down */}
              <Path d="M114 170 L112 244 L124 244 L126 172 Z" fill="url(#skin)" />
              <Path d="M106 244 Q126 242 130 252 L106 254 Z" fill="#334155" />

              {/* Diagonal Knee Drive across body toward elbow */}
              <Path d="M136 170 Q156 160 162 174 L148 184 Q138 174 132 178 Z" fill="url(#skin)" />
              <Path d="M162 174 L154 214 L144 212 L150 182 Z" fill="url(#skin)" />
              <Path d="M148 214 Q160 218 162 228 L148 232 Z" fill="#334155" />
            </G>
          ) : (
            /* DEFAULT REALISTIC ATHLETE (Deep Squat / Athletic Stand) */
            <G id="realisticAthlete">
              <Path d="M80 262 Q140 252 200 262 Q140 272 80 262 Z" fill="rgba(0,0,0,0.06)" />

              {/* Head with hair & jawline */}
              <Circle cx="140" cy="52" r="18" fill="url(#skin)" />
              <Path d="M128 48 Q134 32 148 34 Q158 38 158 48 Q150 40 140 40 Z" fill="#475569" />

              {/* Neck & Shoulders */}
              <Rect x="134" y="66" width="12" height="12" fill="url(#skin)" rx="2" />

              {/* Blue Vest */}
              <Path d="M122 76 Q140 72 156 76 L158 132 Q140 136 120 132 Z" fill="url(#blueVest)" />

              {/* Arms */}
              <Path d="M120 78 Q108 98 106 122 L116 124 Q120 102 128 84 Z" fill="url(#skin)" />
              <Path d="M158 78 Q170 98 172 122 L162 124 Q158 102 150 84 Z" fill="url(#skin)" />

              {/* Shorts */}
              <Path d="M120 130 L158 130 L160 172 L144 172 L138 148 L134 172 L118 172 Z" fill="url(#gymShorts)" />

              {/* Legs */}
              <Path d="M120 172 L118 244 L130 244 L132 172 Z" fill="url(#skin)" />
              <Path d="M112 244 Q132 242 136 252 L112 254 Z" fill="#334155" />

              <Path d="M146 172 L148 244 L160 244 L158 172 Z" fill="url(#skin)" />
              <Path d="M142 244 Q162 242 166 252 L142 254 Z" fill="#334155" />
            </G>
          )}
        </Svg>
      </Animated.View>
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
  },
  characterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  imageWrapper: {
    width: 320,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realAppImage: {
    width: '100%',
    height: '100%',
  },
});
