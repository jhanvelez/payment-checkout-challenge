import React from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen(_props: Props): React.JSX.Element {
  return (
    <Screen style={styles.container}>
      <AppText variant="title">Productos</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Próximamente: catálogo de productos.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
