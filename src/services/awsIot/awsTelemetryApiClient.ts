import { telemetryApiConfig } from '../../config/awsIotConfig';
import type { DashboardTelemetryMessage } from './awsIotTypes';
import { normalizeTelemetryMessage } from './awsIotClient';

function endpoint(path: string) {
  const url = `${telemetryApiConfig.baseUrl.replace(/\/$/, '')}${path}`;
  console.debug('[AirBuddi] Telemetry API request URL:', url);
  return url;
}

async function responseBody(response: Response) {
  const text = await response.text();
  let body: unknown = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep the plain-text response so the error below stays useful.
  }

  if (!response.ok) {
    const detail = typeof body === 'object' && body && 'message' in body
      ? String((body as { message: unknown }).message)
      : typeof body === 'string' && body
        ? body
        : response.statusText;
    throw new Error(`Telemetry API request failed (${response.status}): ${detail}`);
  }

  if (!body || typeof body !== 'object') {
    throw new Error('Telemetry API returned an empty or non-JSON response.');
  }

  return body;
}

/** Reads the newest persisted device telemetry from API Gateway. */
export async function fetchLatestTelemetry(deviceId: string): Promise<DashboardTelemetryMessage> {
  const url = endpoint(`/devices/${encodeURIComponent(deviceId)}/telemetry`);
  console.debug('[AirBuddi] Fetching latest telemetry for', deviceId, 'from', url);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  const body = await responseBody(response);
  console.debug('[AirBuddi] Telemetry API response for', deviceId, body);
  return normalizeTelemetryMessage(body, deviceId);
}

/** Sends a dashboard command to the backend; the backend publishes it to IoT Core. */
export async function postDeviceCommand(
  deviceId: string,
  command: string,
  value: unknown,
) {
  const response = await fetch(endpoint(`/devices/${encodeURIComponent(deviceId)}/commands`), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, value, ts: new Date().toISOString() }),
  });
  await responseBody(response);
}
