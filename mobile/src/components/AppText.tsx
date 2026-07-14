import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '../theme';

type Variant = keyof typeof typography extends string ? keyof Omit<typeof typography, 'fontFamily'> : never;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  style,
  ...rest
}: AppTextProps): React.JSX.Element {
  const variantStyle = typography[variant] as TextStyle;
  return <Text style={[variantStyle, { color, fontFamily: typography.fontFamily }, style]} {...rest} />;
}
