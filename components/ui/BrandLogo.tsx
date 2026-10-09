import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  layout?: 'row' | 'column';
}

export default function BrandLogo({ size = 'medium', showText = true, layout = 'row' }: BrandLogoProps) {
  let scale = 1;
  if (size === 'small') scale = 0.65;
  if (size === 'large') scale = 1.6;

  // The actual FitPulse "F" logo exact SVG replica
  const LogoSVG = () => (
    <Svg width={46 * scale} height={34 * scale} viewBox="0 0 46 34" fill="none">
      <Path
        d="M6.5 34 L17 13.5 C19 9 22 6 27 6 L46 6 L42.5 13.5 L27 13.5 C24 13.5 22 15 20.5 18 L12.5 34 Z"
        fill={Colors.primary}
      />
      <Path
        d="M20 34 L26 22 C27.5 18.5 30 16 34 16 L44.5 16 L41 23.5 L34 23.5 C31.5 23.5 30 25 28.5 28 L25.5 34 Z"
        fill={Colors.primary}
      />
    </Svg>
  );

  return (
    <View style={[styles.container, layout === 'column' && styles.column]}>
      <View style={styles.iconWrap}>
        <LogoSVG />
      </View>
      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize: 24 * scale,
              marginLeft: layout === 'row' ? 8 * scale : 0,
              marginTop: layout === 'column' ? 12 * scale : 0,
            }
          ]}
        >
          Fit<Text style={styles.textPulse}>Pulse</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  textPulse: {
    color: Colors.primary,
  },
});
