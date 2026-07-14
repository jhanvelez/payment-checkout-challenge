import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { ErrorState } from '../components/ErrorState';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { tokenizeCardThunk, submitPaymentThunk, resetPayment } from '../features/payment/paymentSlice';
import { resetCheckout } from '../features/checkout/checkoutSlice';
import { recordTransactionResult } from '../features/transaction/transactionSlice';
import { clearCart } from '../features/cart/cartSlice';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

export function ProcessingScreen({ navigation, route }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const tokenizeStatus = useAppSelector((state) => state.payment.tokenizeStatus);
  const paymentStatus = useAppSelector((state) => state.payment.paymentStatus);
  const error = useAppSelector((state) => state.payment.error);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function runPayment() {
      const tokenizeResult = await dispatch(tokenizeCardThunk(route.params.card));
      if (cancelled || !tokenizeCardThunk.fulfilled.match(tokenizeResult)) {
        return;
      }

      const paymentResult = await dispatch(
        submitPaymentThunk({
          transactionId: route.params.transactionId,
          cardToken: tokenizeResult.payload.id,
        }),
      );
      if (cancelled || !submitPaymentThunk.fulfilled.match(paymentResult)) {
        return;
      }

      dispatch(recordTransactionResult(paymentResult.payload));
      dispatch(clearCart());
      dispatch(resetCheckout());
      dispatch(resetPayment());
      navigation.replace('Result');
    }

    void runPayment();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const hasError = tokenizeStatus === 'failed' || paymentStatus === 'failed';

  if (hasError) {
    return (
      <Screen style={styles.container}>
        <ErrorState
          message={error ?? 'No pudimos procesar tu pago'}
          onRetry={() => {
            dispatch(resetPayment());
            setAttempt((current) => current + 1);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="title" style={styles.title}>
        {paymentStatus === 'processing' ? 'Procesando tu pago...' : 'Validando tu tarjeta...'}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
        No cierres la aplicación
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
