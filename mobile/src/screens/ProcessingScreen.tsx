import React from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

export function ProcessingScreen(_props: Props): React.JSX.Element {
  return (
    <Screen style={styles.container}>
      <AppText variant="title">Procesando...</AppText>
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
});
