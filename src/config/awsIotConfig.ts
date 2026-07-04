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
const defaultEndpoint = '';

export const awsIotConfig: AwsIotConnectionConfig = {
  enabled: false,
  endpoint: defaultEndpoint,
  region: 'eu-north-1',
  clientId: `airbuddi-${defaultDeviceId}`,
  deviceId: defaultDeviceId,
  topics: createAwsIotTopics(defaultDeviceId),
  credentialsProvider: async () => {
    throw new Error('Configure AWS IoT credentials before enabling live mode.');
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

  return { valid: true, reason: '' };
}