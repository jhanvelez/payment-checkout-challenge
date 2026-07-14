import * as Keychain from 'react-native-keychain';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { Storage } from 'redux-persist';

const KEYCHAIN_SERVICE = 'checkout-app.mmkv-encryption-key';
const MMKV_INSTANCE_ID = 'checkout-secure-store';

// AES-256 requires the key to be exactly 32 bytes; 16 random bytes hex-encoded
// produce exactly that (2 hex chars per byte = 32 characters = 32 bytes).
const KEY_RANDOM_BYTES = 16;

function generateEncryptionKey(): string {
  const randomBytes = new Uint8Array(KEY_RANDOM_BYTES);
  // Hermes (RN >= 0.74) implements the Web Crypto `getRandomValues` API.
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  if (existing) {
    return existing.password;
  }

  const key = generateEncryptionKey();
  await Keychain.setGenericPassword('mmkv-encryption-key', key, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

let mmkvInstance: MMKV | undefined;

/**
 * Lazily creates the encrypted MMKV instance. The encryption key itself
 * lives in the Android Keystore / iOS Keychain (via react-native-keychain),
 * never in plain storage - MMKV's own AES encryption only protects the file
 * on disk, so the key has to be kept somewhere the OS actually secures.
 */
async function getSecureMMKV(): Promise<MMKV> {
  if (mmkvInstance) {
    return mmkvInstance;
  }
  const encryptionKey = await getOrCreateEncryptionKey();
  mmkvInstance = createMMKV({
    id: MMKV_INSTANCE_ID,
    encryptionKey,
    encryptionType: 'AES-256',
  });
  return mmkvInstance;
}

/**
 * redux-persist storage engine backed by the encrypted MMKV instance above.
 * MMKV itself is synchronous, but the engine is initialized asynchronously
 * (Keychain access is async), so every method awaits `getSecureMMKV()` first.
 */
export const secureStorage: Storage = {
  setItem: async (key: string, value: string) => {
    const mmkv = await getSecureMMKV();
    mmkv.set(key, value);
    return value;
  },
  getItem: async (key: string) => {
    const mmkv = await getSecureMMKV();
    const value = mmkv.getString(key);
    return value ?? null;
  },
  removeItem: async (key: string) => {
    const mmkv = await getSecureMMKV();
    mmkv.remove(key);
  },
};
