import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LeapFitnessCharacterProps {
  exerciseId: string;
  isPaused?: boolean;
}

export default function LeapFitnessCharacter({
  exerciseId,
  isPaused = false,
}: LeapFitnessCharacterProps) {
  // Animation values for smooth vector keyframe loops
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loopAnimation: Animated.CompositeAnimation | null = null;

    if (!isPaused) {
      loopAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 650, // fast, energetic workout cadence
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loopAnimation.start();
    } else {
      animValue.stopAnimation();
    }

    return () => {
      if (loopAnimation) loopAnimation.stop();
    };
  }, [isPaused, exerciseId]);

  // Derived transforms
  const bounceY = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -18, 0],
  });

  const leftKneeY = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -42, 0],
  });

  const rightKneeY = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-42, 0, -42],
  });

  const leftArmRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '35deg'],
  });

  const rightArmRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['35deg', '-25deg'],
  });

  // Render specific animated SVG character pose based on exercise type
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.characterWrapper,
          {
            transform: [{ translateY: bounceY }],
          },
        ]}
      >
        <Svg width="260" height="300" viewBox="0 0 260 300">
          <Defs>
            {/* Blue Tank Top Gradient matching Image 2 */}
            <LinearGradient id="blueTank" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#38BDF8" />
              <Stop offset="1" stopColor="#0284C7" />
            </LinearGradient>

            {/* Dark Navy Shorts */}
            <LinearGradient id="darkShorts" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1E293B" />
              <Stop offset="1" stopColor="#0F172A" />
            </LinearGradient>

            {/* Skin Tone */}
            <LinearGradient id="skinTone" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDBA74" />
              <Stop offset="1" stopColor="#FB923C" />
            </LinearGradient>
          </Defs>

          {/* HEAD & HAIR */}
          <G id="head">
            {/* Face/Neck */}
            <Circle cx="130" cy="52" r="18" fill="url(#skinTone)" />
            {/* Ear */}
            <Circle cx="120" cy="52" r="4" fill="#F97316" />
            {/* Leap Fitness Brownish-Gray Hair */}
            <Path
              d="M116 48 Q122 32 136 32 Q148 34 148 46 Q146 38 136 38 Q126 40 120 50 Z"
              fill="#64748B"
            />
            {/* Neck */}
            <Rect x="124" y="66" width="12" height="12" fill="url(#skinTone)" rx="2" />
          </G>

          {/* TORSO / BLUE TANK TOP (Signature Leap Fitness Character) */}
          <G id="torso">
            {/* Blue Athletic Shirt */}
            <Path
              d="M115 76 Q130 72 145 76 L148 130 Q130 134 112 130 Z"
              fill="url(#blueTank)"
            />
            {/* Armhole Trim */}
            <Path
              d="M115 76 Q112 92 114 104"
              stroke="#0284C7"
              strokeWidth="2.5"
              fill="none"
            />
          </G>

          {/* ARMS (Bent at 90 degrees pumping in running/jumping motion) */}
          <G id="arms">
            {/* Left Arm / Shoulder */}
            <Path
              d="M114 78 Q100 88 94 108 L110 114 Q114 96 122 84 Z"
              fill="url(#skinTone)"
            />
            {/* Right Arm */}
            <Path
              d="M146 78 Q158 92 166 110 L152 116 Q144 98 138 84 Z"
              fill="url(#skinTone)"
            />
            {/* Forearms/Hands */}
            <Circle cx="94" cy="110" r="7" fill="url(#skinTone)" />
            <Circle cx="166" cy="112" r="7" fill="url(#skinTone)" />
          </G>

          {/* SHORTS (Black/Dark Navy Gym Shorts) */}
          <G id="shorts">
            <Path
              d="M112 128 L148 128 L152 172 L132 172 L130 148 L128 172 L108 172 Z"
              fill="url(#darkShorts)"
            />
          </G>

          {/* LEGS & FEET (HIGH STEPPING / RUNNING MOTION) */}
          {exerciseId === 'high-stepping' || exerciseId === 'mountain-climbers' ? (
            <G id="highKneesLegs">
              {/* Back Leg (Extending down) */}
              <Path
                d="M112 172 Q110 200 114 230 L122 230 Q124 200 126 172 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M112 230 L110 262 L122 262 L124 230 Z"
                fill="url(#skinTone)"
              />
              {/* Back Sneaker */}
              <Path
                d="M106 262 Q120 260 128 266 L124 274 L102 272 Z"
                fill="#475569"
              />

              {/* Front Leg (High Knee bent up toward chest matching Image 2!) */}
              <Path
                d="M132 170 Q146 160 162 176 L154 186 Q140 174 130 182 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M162 176 L156 220 L146 218 L154 184 Z"
                fill="url(#skinTone)"
              />
              {/* Front Sneaker (Tilted down in mid-air jumping posture!) */}
              <Path
                d="M152 220 Q164 224 166 236 L154 242 L144 228 Z"
                fill="#475569"
              />
              <Path
                d="M154 240 L166 236"
                stroke="#F8FAFC"
                strokeWidth="2.5"
              />
            </G>
          ) : exerciseId === 'jumping-jacks' ? (
            <G id="jumpingJacksLegs">
              {/* Spread Wide Legs */}
              <Path
                d="M110 172 L88 234 L100 236 L124 172 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M88 234 L72 268 L84 270 L98 236 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M66 268 L86 272 L82 278 L62 274 Z"
                fill="#475569"
              />

              <Path
                d="M148 172 L170 234 L158 236 L134 172 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M170 234 L186 268 L174 270 L160 236 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M192 268 L172 272 L176 278 L196 274 Z"
                fill="#475569"
              />
            </G>
          ) : (
            /* Default Neutral Squat / Stand Legs */
            <G id="standingLegs">
              <Path
                d="M112 172 L110 226 L122 226 L126 172 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M110 226 L108 266 L120 266 L122 226 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M102 266 Q122 264 126 272 L102 274 Z"
                fill="#475569"
              />

              <Path
                d="M132 172 L136 226 L148 226 L146 172 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M136 226 L138 266 L150 266 L148 226 Z"
                fill="url(#skinTone)"
              />
              <Path
                d="M134 266 Q154 264 158 272 L134 274 Z"
                fill="#475569"
              />
            </G>
          )}

          {/* GROUND SHADOW (Subtle oval shadow matching Image 2) */}
          <Path
            d="M95 285 Q130 278 165 285 Q130 292 95 285 Z"
            fill="rgba(0,0,0,0.06)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  characterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
