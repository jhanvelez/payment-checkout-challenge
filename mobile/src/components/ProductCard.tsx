import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';
import { formatCurrency } from '../utils/currency';
import { AppText } from './AppText';
import type { ProductDto } from '../types/api';

interface ProductCardProps {
  product: ProductDto;
  onPress: (product: ProductDto) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps): React.JSX.Element {
  const outOfStock = product.stock <= 0;

  return (
    <Pressable
      onPress={() => onPress(product)}
      disabled={outOfStock}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, outOfStock && styles.disabled]}
      testID={`product-card-${product.id}`}
    >
      <View style={styles.imageWrapper}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {outOfStock && (
          <View style={styles.outOfStockBadge}>
            <AppText variant="micro" color={colors.textOnPrimary}>
              AGOTADO
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {product.name}
        </AppText>
        <AppText variant="title" color={colors.primary} style={styles.price}>
          {formatCurrency(product.priceInCents, product.currency)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  imageWrapper: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  info: {
    padding: spacing.sm,
    gap: 4,
  },
  price: {
    marginTop: 2,
  },
});
