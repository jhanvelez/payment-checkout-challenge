import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';
import type { CardBrand } from '../utils/cardValidation';

const LABELS: Record<Exclude<CardBrand, 'unknown'>, string> = {
  visa: 'VISA',
  mastercard: 'MASTERCARD',
  amex: 'AMEX',
};

const BRAND_COLORS: Record<Exclude<CardBrand, 'unknown'>, string> = {
  visa: colors.visa,
  mastercard: colors.mastercard,
  amex: colors.primary,
};

interface CardBrandBadgeProps {
  brand: CardBrand;
}

export function CardBrandBadge({ brand }: CardBrandBadgeProps): React.JSX.Element | null {
  if (brand === 'unknown') {
    return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: BRAND_COLORS[brand] }]} testID="card-brand-badge">
      <AppText variant="micro" color={colors.textOnPrimary}>
        {LABELS[brand]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
});
