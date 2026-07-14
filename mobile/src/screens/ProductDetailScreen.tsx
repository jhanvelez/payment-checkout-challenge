import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { QuantitySelector } from '../components/QuantitySelector';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { ErrorState } from '../components/ErrorState';
import { colors, radii, spacing } from '../theme';
import { formatCurrency } from '../utils/currency';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addItem } from '../features/cart/cartSlice';
import { fetchProductById } from '../services/productsApi';
import { extractApiErrorMessage } from '../services/apiClient';
import type { RootStackParamList } from '../navigation/types';
import type { ProductDto } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { productId } = route.params;
  const dispatch = useAppDispatch();
  const cachedProduct = useAppSelector((state) =>
    state.products.items.find((item) => item.id === productId),
  );

  const [product, setProduct] = useState<ProductDto | undefined>(cachedProduct);
  const [isLoading, setIsLoading] = useState(!cachedProduct);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (cachedProduct) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchProductById(productId)
      .then((result) => {
        if (!cancelled) {
          setProduct(result);
          setError(null);
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setError(extractApiErrorMessage(fetchError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cachedProduct, productId]);

  const totalInCents = useMemo(
    () => (product ? product.priceInCents * quantity : 0),
    [product, quantity],
  );

  const handleRetry = (): void => {
    setError(null);
    setIsLoading(true);
    fetchProductById(productId)
      .then((result) => setProduct(result))
      .catch((fetchError: unknown) => setError(extractApiErrorMessage(fetchError)))
      .finally(() => setIsLoading(false));
  };

  const handleAddToCart = (): void => {
    if (!product) {
      return;
    }
    dispatch(addItem({ product, quantity }));
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <SkeletonBlock height={280} borderRadius={radii.lg} />
        <View style={styles.skeletonText}>
          <SkeletonBlock height={24} width="70%" />
          <SkeletonBlock height={18} width="40%" />
        </View>
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen style={styles.screen}>
        <ErrorState message={error ?? 'Producto no encontrado'} onRetry={handleRetry} />
      </Screen>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrapper}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>

        <View style={styles.body}>
          <AppText variant="title">{product.name}</AppText>
          <AppText variant="display" color={colors.primary} style={styles.price}>
            {formatCurrency(product.priceInCents, product.currency)}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.description}>
            {product.description}
          </AppText>

          {outOfStock ? (
            <AppText variant="bodyStrong" color={colors.error} style={styles.stockNotice}>
              Producto agotado
            </AppText>
          ) : (
            <>
              <AppText variant="captionStrong" color={colors.textSecondary} style={styles.quantityLabel}>
                Cantidad ({product.stock} disponibles)
              </AppText>
              <QuantitySelector quantity={quantity} max={product.stock} onChange={setQuantity} />
            </>
          )}
        </View>
      </ScrollView>

      {!outOfStock && (
        <View style={styles.footer}>
          <Button
            label={`Agregar · ${formatCurrency(totalInCents, product.currency)}`}
            onPress={handleAddToCart}
            testID="add-to-cart-button"
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonText: {
    gap: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
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
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  price: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  stockNotice: {
    marginTop: spacing.lg,
  },
  quantityLabel: {
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
