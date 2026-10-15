/**
 * AWS Cognito configuration for customer accounts.
 *
 * After deploying infra/template.yaml, copy the CognitoUserPoolClientId output
 * here. The client ID is public configuration; never put AWS access keys or a
 * Cognito client secret in the mobile app.
 */
export const cognitoAuthConfig = {
  region: 'eu-north-1',
  userPoolClientId: 'nk8bud2h2qu451m0505ihise5',
};

export function isCognitoAuthConfigured() {
  return Boolean(cognitoAuthConfig.userPoolClientId)
    && !cognitoAuthConfig.userPoolClientId.startsWith('REPLACE_');
}
