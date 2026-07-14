import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max: number;
  onChange: (quantity: number) => void;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max,
  onChange,
}: QuantitySelectorProps): React.JSX.Element {
  const canDecrement = quantity > min;
  const canIncrement = quantity < max;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Disminuir cantidad"
        disabled={!canDecrement}
        onPress={() => onChange(quantity - 1)}
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
      >
        <AppText variant="title" color={canDecrement ? colors.textPrimary : colors.textMuted}>
          −
        </AppText>
      </Pressable>
      <AppText variant="subtitle" style={styles.value}>
        {quantity}
      </AppText>
      <Pressable
        accessibilityLabel="Aumentar cantidad"
        disabled={!canIncrement}
        onPress={() => onChange(quantity + 1)}
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
      >
        <AppText variant="title" color={canIncrement ? colors.textPrimary : colors.textMuted}>
          +
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    padding: 4,
    alignSelf: 'flex-start',
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    minWidth: 32,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
});
