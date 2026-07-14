import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAppSelector } from '../store/hooks';
import { selectLastTransaction } from '../features/transaction/transactionSlice';
import { formatCurrency } from '../utils/currency';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const STATUS_COPY: Record<'APPROVED' | 'DECLINED' | 'ERROR', { title: string; message: string; color: string; glyph: string }> = {
  APPROVED: {
    title: '¡Pago aprobado!',
    message: 'Tu pedido fue confirmado y va en camino.',
    color: colors.success,
    glyph: '✓',
  },
  DECLINED: {
    title: 'Pago rechazado',
    message: 'Tu banco rechazó la transacción. Intenta con otra tarjeta.',
    color: colors.error,
    glyph: '✕',
  },
  ERROR: {
    title: 'Ocurrió un error',
    message: 'No pudimos confirmar el estado de tu pago. Contáctanos si el cobro aparece en tu banco.',
    color: colors.warning,
    glyph: '!',
  },
};

export function ResultScreen({ navigation }: Props): React.JSX.Element {
  const transaction = useAppSelector(selectLastTransaction);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (!transaction) {
    return (
      <Screen style={styles.container}>
        <AppText variant="title" style={styles.title}>
          Sin información de pago
        </AppText>
        <Button label="Ir a la tienda" onPress={goHome} style={styles.button} testID="result-home-button" />
      </Screen>
    );
  }

  const copy = STATUS_COPY[transaction.status];

  return (
    <Screen style={styles.container}>
      <View style={[styles.badge, { backgroundColor: copy.color }]}>
        <AppText variant="display" color={colors.textOnPrimary}>
          {copy.glyph}
        </AppText>
      </View>
      <AppText variant="title" style={styles.title}>
        {copy.title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.message}>
        {copy.message}
      </AppText>

      <Card style={styles.card}>
        <View style={styles.row}>
          <AppText color={colors.textSecondary}>Referencia</AppText>
          <AppText variant="bodyStrong">{transaction.reference}</AppText>
        </View>
        <View style={styles.row}>
          <AppText color={colors.textSecondary}>Monto</AppText>
          <AppText variant="bodyStrong">{formatCurrency(transaction.amountInCents, transaction.currency)}</AppText>
        </View>
        {transaction.cardBrand ? (
          <View style={styles.row}>
            <AppText color={colors.textSecondary}>Tarjeta</AppText>
            <AppText variant="bodyStrong">
              {transaction.cardBrand} •••• {transaction.lastFour}
            </AppText>
          </View>
        ) : null}
      </Card>

      <Button label="Volver a la tienda" onPress={goHome} style={styles.button} testID="result-home-button" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  card: {
    width: '100%',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    marginTop: spacing.md,
    minWidth: 220,
  },
});
