import type { AwsIotConnectionConfig } from '../services/awsIot/awsIotTypes';
import { MY_DEVICE_CONFIG } from './awsIotCredentials';

export function isAwsIotMqttEndpoint(endpoint: string) {
  return endpoint.includes('.iot.') && !endpoint.includes('execute-api');
}

/**
 * Modern topic scheme (matching the React Native app's intended design).
 * Note: If the ESP32 still uses 'AQMG_5', the client code will override these.
 */
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

  // We have switched back to MQTT over TLS (8883) with device certificates
  // to match the old_app behavior. IAM/SigV4 has been removed.
  endpoint: MY_DEVICE_CONFIG.endpoint,
  region: MY_DEVICE_CONFIG.region,
  clientId: `airbuddi-mobile-${MY_DEVICE_CONFIG.deviceId}`,
  deviceId: MY_DEVICE_CONFIG.deviceId,

  // API Gateway URL from old app for fetching device list/initial state
  deviceApiUrl: 'https://9fsa0alosl.execute-api.eu-north-1.amazonaws.com/devices',

  topics: createAwsIotTopics(MY_DEVICE_CONFIG.deviceId),
};

/**
 * The mobile app reads telemetry through this HTTPS API.  It is deliberately
 * separate from `awsIotConfig.endpoint`: an AWS IoT MQTT endpoint accepts
 * MQTT traffic only and cannot be fetched by the app as an HTTP API.
 *
 * Set this to the API Gateway stage URL once the IoT Rule/Lambda endpoint has
 * been deployed, for example: https://abc123.execute-api.eu-north-1.amazonaws.com/prod
 */
export const telemetryApiConfig = {
  // API Gateway base URL (set to the deployed stage root). Do NOT include
  // the `/devices` path here — the client app appends resource paths.
  // Example root: https://9fsa0alosl.execute-api.eu-north-1.amazonaws.com
  baseUrl: 'https://9fsa0alosl.execute-api.eu-north-1.amazonaws.com',
  pollIntervalMs: 5_000,
};

export function validateTelemetryApiConfig() {
  const { baseUrl } = telemetryApiConfig;

  if (!baseUrl.trim()) {
    return {
      valid: false,
      reason:
        'Live telemetry API is not configured. Set telemetryApiConfig.baseUrl to your API Gateway stage URL.',
    };
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:') {
      return { valid: false, reason: 'Live telemetry API must use an HTTPS URL.' };
    }
  } catch {
    return { valid: false, reason: 'Live telemetry API URL is invalid.' };
  }

  return { valid: true, reason: '' };
}


export function validateAwsIotConfig() {
  if (!awsIotConfig.enabled) {
    return {
      valid: false,
      reason: 'Live mode is disabled. Configure the IoT Core ATS endpoint first.',
    };
  }

  if (!isAwsIotMqttEndpoint(awsIotConfig.endpoint)) {
    return {
      valid: false,
      reason:
        'Invalid AWS IoT endpoint. Use the ATS MQTT hostname in the form <prefix>-ats.iot.<region>.amazonaws.com.',
    };
  }

  if (!awsIotConfig.deviceId?.trim() || !awsIotConfig.clientId?.trim()) {
    return {
      valid: false,
      reason: 'AWS IoT deviceId and clientId must be configured before live mode can start.',
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
