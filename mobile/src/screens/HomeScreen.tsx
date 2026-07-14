import React, { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { ProductCard } from '../components/ProductCard';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { ErrorState } from '../components/ErrorState';
import { CartBar } from '../components/CartBar';
import { colors, radii, spacing } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadProducts } from '../features/products/productsSlice';
import { selectCartItemCount, selectCartTotalInCents } from '../features/cart/cartSlice';
import type { RootStackParamList } from '../navigation/types';
import type { ProductDto } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const SKELETON_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.products);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartTotalInCents = useAppSelector(selectCartTotalInCents);

  useEffect(() => {
    void dispatch(loadProducts());
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    void dispatch(loadProducts());
  }, [dispatch]);

  const handleSelectProduct = useCallback(
    (product: ProductDto) => {
      navigation.navigate('ProductDetail', { productId: product.id });
    },
    [navigation],
  );

  const handleOpenCart = useCallback(() => {
    navigation.navigate('Checkout');
  }, [navigation]);

  const isInitialLoading = status === 'loading' && items.length === 0;
  const isRefreshing = status === 'loading' && items.length > 0;

  return (
    <Screen style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="display">Tienda</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Elige tus productos favoritos
        </AppText>
      </View>

      {status === 'failed' && items.length === 0 ? (
        <ErrorState message={error ?? 'No pudimos cargar los productos'} onRetry={handleRetry} />
      ) : isInitialLoading ? (
        <View style={styles.grid}>
          {SKELETON_PLACEHOLDERS.map((key) => (
            <View key={key} style={styles.gridItem}>
              <SkeletonBlock height={220} borderRadius={radii.lg} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          testID="products-list"
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRetry}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} onPress={handleSelectProduct} />
            </View>
          )}
          ListEmptyComponent={
            <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
              No hay productos disponibles por ahora.
            </AppText>
          }
        />
      )}

      <CartBar itemCount={cartItemCount} totalInCents={cartTotalInCents} onPress={handleOpenCart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl * 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
