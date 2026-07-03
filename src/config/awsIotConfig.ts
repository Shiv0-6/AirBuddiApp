import type { AwsIotConnectionConfig } from '../services/awsIot/awsIotTypes';

export function createAwsIotTopics(deviceId: string) {
  return {
    telemetry: `airbuddi/${deviceId}/telemetry`,
    status: `airbuddi/${deviceId}/status`,
    command: `airbuddi/${deviceId}/command`,
    connection: `airbuddi/${deviceId}/connection`,
  };
}

const defaultDeviceId = 'airbuddi-pure-x';

export const awsIotConfig: AwsIotConnectionConfig = {
  enabled: false,
  endpoint: '',
  region: 'us-east-1',
  clientId: `airbuddi-${defaultDeviceId}`,
  deviceId: defaultDeviceId,
  topics: createAwsIotTopics(defaultDeviceId),
  credentialsProvider: async () => {
    throw new Error('Configure AWS IoT credentials before enabling live mode.');
  },
};