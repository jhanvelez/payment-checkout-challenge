import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radii, shadows, spacing } from '../theme';
import { formatCurrency } from '../utils/currency';
import { AppText } from './AppText';

interface CartBarProps {
  itemCount: number;
  totalInCents: number;
  onPress: () => void;
}

export function CartBar({ itemCount, totalInCents, onPress }: CartBarProps): React.JSX.Element | null {
  if (itemCount === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={styles.wrapper}
    >
      <Pressable onPress={onPress} testID="cart-bar">
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bar}
        >
          <View style={styles.badge}>
            <AppText variant="captionStrong" color={colors.textOnPrimary}>
              {itemCount}
            </AppText>
          </View>
          <AppText variant="bodyStrong" color={colors.textOnPrimary} style={styles.label}>
            Ver carrito
          </AppText>
          <AppText variant="bodyStrong" color={colors.textOnPrimary}>
            {formatCurrency(totalInCents)}
          </AppText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.floating,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.pill,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  label: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
