import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createTestAdminSession,
  getStoredAuthSession,
  type AuthSession,
} from '../src/services/auth/cognitoAuth';

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function createExpiredSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    username: 'customer',
    accessToken: 'expired-access-token',
    idToken: 'expired-id-token',
    refreshToken: 'refresh-token',
    expiresAt: 0,
    ...overrides,
  };
}

describe('Cognito auth session restoration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  it('refreshes an expired Cognito session and preserves its refresh token', async () => {
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(createExpiredSession()));
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
        },
      }),
    });

    const session = await getStoredAuthSession();

    expect(session).toMatchObject({
      username: 'customer',
      accessToken: 'new-access-token',
      idToken: 'new-id-token',
      refreshToken: 'refresh-token',
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://cognito-idp.eu-north-1.amazonaws.com/',
      expect.objectContaining({
        body: expect.stringContaining('"AuthFlow":"REFRESH_TOKEN_AUTH"'),
      }),
    );
    expect(mockedStorage.setItem).toHaveBeenCalled();
  });

  it('clears an expired session when it cannot be refreshed', async () => {
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(
      createExpiredSession({ refreshToken: undefined }),
    ));

    await expect(getStoredAuthSession()).resolves.toBeNull();
    expect(mockedStorage.removeItem).toHaveBeenCalled();
  });

  it('keeps the temporary admin session without contacting Cognito', async () => {
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(createTestAdminSession()));

    await expect(getStoredAuthSession()).resolves.toMatchObject({
      username: 'admin',
      isTestAdmin: true,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
