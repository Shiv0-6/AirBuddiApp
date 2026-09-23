/**
 * AWS Cognito configuration for customer accounts.
 *
 * After deploying infra/template.yaml, copy the CognitoUserPoolClientId output
 * here. The client ID is public configuration; never put AWS access keys or a
 * Cognito client secret in the mobile app.
 */
export const cognitoAuthConfig = {
  region: 'eu-north-1',
  userPoolClientId: 'REPLACE_WITH_COGNITO_APP_CLIENT_ID',
};

export function isCognitoAuthConfigured() {
  return Boolean(cognitoAuthConfig.userPoolClientId)
    && !cognitoAuthConfig.userPoolClientId.startsWith('REPLACE_');
}
