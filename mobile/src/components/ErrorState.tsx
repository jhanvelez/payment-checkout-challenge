import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle" style={styles.title}>
        Algo salió mal
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.message}>
        {message}
      </AppText>
      <Button label="Reintentar" onPress={onRetry} variant="secondary" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});
