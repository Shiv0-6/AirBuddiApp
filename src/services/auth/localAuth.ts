import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthSession } from './cognitoAuth';

// Kept only as a development fallback until Cognito is configured. Do not use
// this for production accounts: AsyncStorage is not a password vault.
const LOCAL_ACCOUNT_STORAGE_KEY = '@airbuddi_registered_account';

type LocalAccount = {
  username: string;
  password: string;
};

function toLocalSession(username: string): AuthSession {
  return {
    username,
    accessToken: 'local-development-account',
    idToken: 'local-development-account',
    expiresAt: Number.MAX_SAFE_INTEGER,
  };
}

export async function registerLocalAccount(username: string, password: string): Promise<AuthSession> {
  await AsyncStorage.setItem(
    LOCAL_ACCOUNT_STORAGE_KEY,
    JSON.stringify({ username, password } satisfies LocalAccount),
  );

  return toLocalSession(username);
}

export async function signInWithLocalAccount(username: string, password: string): Promise<AuthSession> {
  const stored = await AsyncStorage.getItem(LOCAL_ACCOUNT_STORAGE_KEY);
  if (!stored) {
    throw new Error('No local account found. Create an account first.');
  }

  try {
    const account = JSON.parse(stored) as LocalAccount;
    if (account.username !== username || account.password !== password) {
      throw new Error('Invalid username or password.');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid username or password.') {
      throw error;
    }
    throw new Error('The local account could not be read. Create it again.');
  }

  return toLocalSession(username);
}
