import AsyncStorage from '@react-native-async-storage/async-storage';

import { cognitoAuthConfig, isCognitoAuthConfigured } from '../../config/authConfig';

const AUTH_SESSION_STORAGE_KEY = '@airbuddi_auth_session';

export type AuthSession = {
  username: string;
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
  isTestAdmin?: boolean;
};

type CognitoErrorResponse = {
  message?: string;
  __type?: string;
};

function getCognitoEndpoint() {
  return `https://cognito-idp.${cognitoAuthConfig.region}.amazonaws.com/`;
}

async function cognitoRequest<T>(action: string, body: Record<string, unknown>): Promise<T> {
  if (!isCognitoAuthConfigured()) {
    throw new Error('Cloud sign-in is not configured yet. Add the Cognito app client ID to src/config/authConfig.ts.');
  }

  const response = await fetch(getCognitoEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json() as T & CognitoErrorResponse;
  if (!response.ok) {
    throw new Error(payload.message || 'Cloud authentication failed. Please try again.');
  }

  return payload;
}

function toSession(username: string, result: {
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
}): AuthSession {
  if (!result.AccessToken || !result.IdToken) {
    throw new Error('Cloud sign-in did not return a valid session.');
  }

  return {
    username,
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresAt: Date.now() + (result.ExpiresIn ?? 3600) * 1000,
  };
}

export async function registerCloudAccount(username: string, password: string) {
  await cognitoRequest('SignUp', {
    ClientId: cognitoAuthConfig.userPoolClientId,
    Username: username,
    Password: password,
  });
}

export async function signInWithCloud(username: string, password: string): Promise<AuthSession> {
  const response = await cognitoRequest<{ AuthenticationResult?: Parameters<typeof toSession>[1] }>(
    'InitiateAuth',
    {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: cognitoAuthConfig.userPoolClientId,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    },
  );

  return toSession(username, response.AuthenticationResult ?? {});
}

export function createTestAdminSession(): AuthSession {
  return {
    username: 'admin',
    accessToken: 'local-test-admin',
    idToken: 'local-test-admin',
    expiresAt: Number.MAX_SAFE_INTEGER,
    isTestAdmin: true,
  };
}

export async function saveAuthSession(session: AuthSession) {
  await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function getStoredAuthSession(): Promise<AuthSession | null> {
  const stored = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const session = JSON.parse(stored) as AuthSession;
    if (!session.accessToken || !session.idToken || session.expiresAt <= Date.now()) {
      await clearAuthSession();
      return null;
    }
    return session;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
