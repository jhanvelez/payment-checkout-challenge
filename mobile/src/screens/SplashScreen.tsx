import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography } from '../theme';
import { AppText } from '../components/AppText';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SPLASH_DURATION_MS = 1400;

export function SplashScreen({ navigation }: Props): React.JSX.Element {
  const scale = useSharedValue(0.85);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 600 });
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [navigation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.badge, animatedStyle]} entering={FadeIn.duration(500)}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badgeGradient}
        >
          <AppText variant="display" color={colors.textOnPrimary}>
            $
          </AppText>
        </LinearGradient>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(500)}>
        <AppText variant="title" style={styles.title}>
          Checkout
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Pagos rápidos y seguros
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    overflow: 'hidden',
  },
  badgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
