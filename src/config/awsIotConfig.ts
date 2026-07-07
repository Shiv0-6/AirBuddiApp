import type { AwsIotConnectionConfig } from '../services/awsIot/awsIotTypes';

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

const defaultDeviceId = 'airbuddi-pure-x';
const defaultEndpoint = 'a1qe87k6xy75k4-ats.iot.eu-north-1.amazonaws.com';

const temporaryAppCredentials = {
  accessKeyId: '',
  secretAccessKey: '',
  sessionToken: '',
};

export const awsIotConfig: AwsIotConnectionConfig = {
  enabled: true,
  endpoint: defaultEndpoint,
  region: 'eu-north-1',
  clientId: `airbuddi-mobile-${defaultDeviceId}`,
  deviceId: defaultDeviceId,
  topics: createAwsIotTopics(defaultDeviceId),
  credentialsProvider: async () => {
    if (!temporaryAppCredentials.accessKeyId || !temporaryAppCredentials.secretAccessKey) {
      throw new Error(
        'AWS IoT endpoint is set, but the app still needs temporary AWS credentials. ESP32 certificates connect the device only; the mobile app needs Cognito or short-lived IAM credentials for MQTT over WebSockets.',
      );
    }

    return {
      accessKeyId: temporaryAppCredentials.accessKeyId,
      secretAccessKey: temporaryAppCredentials.secretAccessKey,
      sessionToken: temporaryAppCredentials.sessionToken || undefined,
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
