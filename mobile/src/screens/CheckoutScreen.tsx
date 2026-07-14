import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { CardBrandBadge } from '../components/CardBrandBadge';
import { CartSummary } from '../components/CartSummary';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCartTotalInCents } from '../features/cart/cartSlice';
import { startCheckout } from '../features/checkout/checkoutSlice';
import { checkoutFormSchema, type CheckoutFormValues } from '../features/checkout/checkoutSchema';
import { detectCardBrand, formatCardNumber } from '../utils/cardValidation';
import { formatCurrency } from '../utils/currency';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const defaultValues: CheckoutFormValues = {
  fullName: '',
  email: '',
  phone: '',
  cardNumber: '',
  cardHolder: '',
  expMonth: '',
  expYear: '',
  cvc: '',
};

export function CheckoutScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const totalInCents = useAppSelector(selectCartTotalInCents);
  const checkoutStatus = useAppSelector((state) => state.checkout.status);
  const checkoutError = useAppSelector((state) => state.checkout.error);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues,
  });

  const cardNumber = watch('cardNumber');
  const cardBrand = useMemo(() => detectCardBrand(cardNumber ?? ''), [cardNumber]);

  const onSubmit = async (values: CheckoutFormValues) => {
    const result = await dispatch(
      startCheckout({
        customer: { email: values.email, fullName: values.fullName, phone: values.phone || undefined },
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    );

    if (startCheckout.fulfilled.match(result)) {
      navigation.navigate('Processing', {
        transactionId: result.payload.id,
        card: {
          number: values.cardNumber,
          cvc: values.cvc,
          expMonth: values.expMonth,
          expYear: values.expYear,
          cardHolder: values.cardHolder,
        },
      });
    }
  };

  if (items.length === 0) {
    return (
      <Screen style={styles.emptyContainer}>
        <AppText variant="title" style={styles.emptyTitle}>
          Tu carrito está vacío
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.emptyMessage}>
          Agrega productos desde la tienda para continuar con el pago.
        </AppText>
        <Button label="Ir a la tienda" onPress={() => navigation.navigate('Home')} style={styles.emptyButton} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Checkout</AppText>

        <CartSummary items={items} totalInCents={totalInCents} />

        <View style={styles.section}>
          <AppText variant="subtitle">Datos del comprador</AppText>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <TextField
                label="Nombre completo"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.fullName?.message}
                testID="checkout-fullName"
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                label="Correo electrónico"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="checkout-email"
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <TextField
                label="Teléfono (opcional)"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="phone-pad"
                testID="checkout-phone"
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <AppText variant="subtitle">Datos de la tarjeta</AppText>
            <CardBrandBadge brand={cardBrand} />
          </View>
          <Controller
            control={control}
            name="cardNumber"
            render={({ field }) => (
              <TextField
                label="Número de tarjeta"
                value={formatCardNumber(field.value)}
                onChangeText={(text) => field.onChange(formatCardNumber(text))}
                onBlur={field.onBlur}
                error={errors.cardNumber?.message}
                keyboardType="number-pad"
                maxLength={23}
                testID="checkout-cardNumber"
              />
            )}
          />
          <Controller
            control={control}
            name="cardHolder"
            render={({ field }) => (
              <TextField
                label="Nombre del titular"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.cardHolder?.message}
                autoCapitalize="characters"
                testID="checkout-cardHolder"
              />
            )}
          />
          <View style={styles.row}>
            <Controller
              control={control}
              name="expMonth"
              render={({ field }) => (
                <TextField
                  label="Mes (MM)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.expMonth?.message}
                  keyboardType="number-pad"
                  maxLength={2}
                  containerStyle={styles.smallInput}
                  testID="checkout-expMonth"
                />
              )}
            />
            <Controller
              control={control}
              name="expYear"
              render={({ field }) => (
                <TextField
                  label="Año (AA)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.expYear?.message}
                  keyboardType="number-pad"
                  maxLength={2}
                  containerStyle={styles.smallInput}
                  testID="checkout-expYear"
                />
              )}
            />
            <Controller
              control={control}
              name="cvc"
              render={({ field }) => (
                <TextField
                  label="CVC"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.cvc?.message}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  containerStyle={styles.smallInput}
                  testID="checkout-cvc"
                />
              )}
            />
          </View>
        </View>

        {checkoutStatus === 'failed' && checkoutError ? (
          <AppText variant="caption" color={colors.error} style={styles.checkoutError}>
            {checkoutError}
          </AppText>
        ) : null}

        <Button
          label={`Pagar · ${formatCurrency(totalInCents)}`}
          onPress={handleSubmit(onSubmit)}
          loading={checkoutStatus === 'creating'}
          testID="checkout-submit-button"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallInput: {
    flex: 1,
  },
  checkoutError: {
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
