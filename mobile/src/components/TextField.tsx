import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing, typography } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function TextField({
  label,
  error,
  style,
  containerStyle,
  testID,
  ...rest
}: TextFieldProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="captionStrong" color={colors.textSecondary} style={styles.label}>
        {label}
      </AppText>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textMuted}
        testID={testID}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.error} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.fontFamily,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    marginLeft: spacing.xs,
  },
});
