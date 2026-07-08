import type { AwsIotConnectionConfig } from '../services/awsIot/awsIotTypes';
// ─── Real credentials ─────────────────────────────────────────────────────────
// Edit  src/config/awsIotCredentials.ts  to provide your AWS IoT keys & device ID.
// See AWS_IOT_SETUP.md in the project root for a full step-by-step guide.
import { MY_AWS_CREDENTIALS, MY_DEVICE_CONFIG } from './awsIotCredentials';

export function isAwsIotMqttEndpoint(endpoint: string) {
  return endpoint.includes('.iot.') && !endpoint.includes('execute-api');
}

export function createAwsIotTopics(deviceId: string) {
  return {
    telemetry: `airbuddi/${deviceId}/telemetry`,
    status: `airbuddi/${deviceId}/status`,
    command: `airbuddi/${deviceId}/command`,
    connection: `airbuddi/${deviceId}/connection`,
  };
}

export const awsIotConfig: AwsIotConnectionConfig = {
  enabled: true,
  endpoint: MY_DEVICE_CONFIG.endpoint,
  region: MY_DEVICE_CONFIG.region,
  clientId: `airbuddi-mobile-${MY_DEVICE_CONFIG.deviceId}`,
  deviceId: MY_DEVICE_CONFIG.deviceId,
  topics: createAwsIotTopics(MY_DEVICE_CONFIG.deviceId),
  credentialsProvider: async () => {
    if (!MY_AWS_CREDENTIALS.accessKeyId || MY_AWS_CREDENTIALS.accessKeyId.startsWith('PASTE_')) {
      throw new Error(
        'AWS credentials not set. Open src/config/awsIotCredentials.ts and fill in your ' +
        'accessKeyId and secretAccessKey. See AWS_IOT_SETUP.md for step-by-step instructions.',
      );
    }

    return {
      accessKeyId: MY_AWS_CREDENTIALS.accessKeyId,
      secretAccessKey: MY_AWS_CREDENTIALS.secretAccessKey,
      sessionToken: MY_AWS_CREDENTIALS.sessionToken || undefined,
    };
  },
};

export function validateAwsIotConfig() {
  if (!awsIotConfig.enabled) {
    return {
      valid: false,
      reason: 'Live mode is disabled. Configure the IoT Core ATS endpoint and credentials provider first.',
    };
  }

  if (!isAwsIotMqttEndpoint(awsIotConfig.endpoint)) {
    return {
      valid: false,
      reason:
        'Invalid AWS IoT endpoint. Use the ATS MQTT hostname in the form <prefix>-ats.iot.<region>.amazonaws.com.',
    };
  }

  if (!awsIotConfig.region || !awsIotConfig.endpoint.includes(`.${awsIotConfig.region}.`)) {
    return {
      valid: false,
      reason: 'AWS IoT endpoint and region do not look like they belong together.',
    };
  }

  return { valid: true, reason: '' };
}
