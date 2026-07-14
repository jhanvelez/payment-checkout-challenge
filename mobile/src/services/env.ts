import { Platform } from 'react-native';

/**
 * The Android emulator can't resolve the host machine as `localhost` - it
 * has to use the special alias `10.0.2.2`. A physical device on the same
 * network would need the machine's LAN IP instead; override via this
 * constant when testing on hardware.
 */
const ANDROID_EMULATOR_HOST = '10.0.2.2';

const DEV_API_HOST = Platform.OS === 'android' ? ANDROID_EMULATOR_HOST : 'localhost';

export const API_BASE_URL = `http://${DEV_API_HOST}:3000/v1`;

export const WOMPI_SANDBOX_URL = 'https://api-sandbox.co.uat.wompi.dev/v1';
export const WOMPI_PUBLIC_KEY = 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7';
