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

  // Switch between the current implementation (WSS + SigV4) and the legacy
  // behavior from old_app/ (MQTT over TLS 8883 with certs + old topics).
  //
  // - legacyMode=false (default): connect via WSS signed URL
  // - legacyMode=true: connect via direct TLS MQTT and subscribe to `AQMG_5`
  //
  // Keep the current code working; legacy mode is opt-in.
  legacyMode: true,

  endpoint: MY_DEVICE_CONFIG.endpoint,
  region: MY_DEVICE_CONFIG.region,
  clientId: `airbuddi-mobile-${MY_DEVICE_CONFIG.deviceId}`,
  deviceId: MY_DEVICE_CONFIG.deviceId,

  // Current topic scheme (WSS mode). In legacy mode this is overridden.
  topics: createAwsIotTopics(MY_DEVICE_CONFIG.deviceId),

  credentialsProvider: async () => {
    if (awsIotConfig.legacyMode) {
      // In legacy mode we won't call this provider; legacy TLS uses
      // MY_IOT_MTLS_CREDENTIALS from awsIotCredentials.ts.
      return {
        accessKeyId: '',
        secretAccessKey: '',
        sessionToken: undefined,
      };
    }

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
