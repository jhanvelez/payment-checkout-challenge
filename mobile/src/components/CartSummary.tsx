import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { AppText } from './AppText';
import { colors, spacing } from '../theme';
import { formatCurrency } from '../utils/currency';
import type { CartItem } from '../features/cart/cartSlice';

interface CartSummaryProps {
  items: CartItem[];
  totalInCents: number;
}

export function CartSummary({ items, totalInCents }: CartSummaryProps): React.JSX.Element {
  const currency = items[0]?.currency ?? 'COP';

  return (
    <Card style={styles.card}>
      <AppText variant="subtitle" style={styles.title}>
        Resumen del pedido
      </AppText>
      {items.map((item) => (
        <View key={item.productId} style={styles.row}>
          <AppText variant="body" color={colors.textSecondary} style={styles.itemName} numberOfLines={1}>
            {item.quantity} × {item.name}
          </AppText>
          <AppText variant="bodyStrong">
            {formatCurrency(item.unitPriceInCents * item.quantity, item.currency)}
          </AppText>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}>
        <AppText variant="subtitle">Total</AppText>
        <AppText variant="subtitle" color={colors.primary}>
          {formatCurrency(totalInCents, currency)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
