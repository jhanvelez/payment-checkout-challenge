import { Platform } from 'react-native';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
    },
    android: { elevation: 16 },
    default: {},
  }),
} as const;
