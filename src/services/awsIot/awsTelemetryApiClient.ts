import { telemetryApiConfig } from '../../config/awsIotConfig';
import type { DashboardTelemetryMessage } from './awsIotTypes';
import { normalizeTelemetryMessage } from './awsIotClient';

function endpoint(path: string) {
  const url = `${telemetryApiConfig.baseUrl.replace(/\/$/, '')}${path}`;
  console.debug('[AirBuddi] Telemetry API request URL:', url);
  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function findMatchingDeviceEntry(payload: unknown, fallbackDeviceId: string) {
  const candidates = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.devices)
      ? payload.devices
      : isRecord(payload)
        ? [payload]
        : [];

  const normalizedFallback = fallbackDeviceId?.trim().toLowerCase() ?? '';

  const match = candidates.find((entry: unknown) => {
    if (!isRecord(entry)) return false;

    const candidateIds = [entry.id, entry.deviceId, entry.device_id, entry.deviceID].map(asString);
    const name = asString(entry.NAME ?? entry.name ?? entry.deviceName);

    return candidateIds.some(id => id.toLowerCase() === normalizedFallback) || name.toLowerCase() === normalizedFallback;
  });

  return (match as Record<string, unknown> | undefined) ?? (candidates[0] as Record<string, unknown> | undefined) ?? null;
}

function buildSensorReadings(entry: Record<string, unknown>) {
  const readings: Array<[string, unknown]> = [
    ['temperature', entry.Temperature ?? entry.temperature ?? entry.temp ?? entry.temperature_c],
    ['humidity', entry.Humidity ?? entry.humidity ?? entry.humidity_percent],
    ['pm2_5', entry['PM 2.5'] ?? entry.pm2_5 ?? entry.pm25],
    ['pm10', entry['PM 10'] ?? entry.pm10],
    ['co2', entry['C02 Equivalent'] ?? entry['CO2 Equivalent'] ?? entry.CO2 ?? entry.co2],
    ['voc', entry["VOC's"] ?? entry.VOC ?? entry.VOCs ?? entry.voc],
  ];

  return readings
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({
      key,
      value: value as number,
      unit: key === 'temperature' ? 'C' : key === 'humidity' ? '%' : key === 'pm2_5' || key === 'pm10' ? 'ug/m3' : 'ppm',
      status: 'good' as const,
    }));
}

export function toDashboardTelemetryMessage(payload: unknown, fallbackDeviceId: string): DashboardTelemetryMessage {
  const deviceEntry = findMatchingDeviceEntry(payload, fallbackDeviceId);

  if (deviceEntry) {
    const deviceId = asString(deviceEntry.id ?? deviceEntry.deviceId ?? deviceEntry.device_id ?? deviceEntry.deviceID) || fallbackDeviceId;

    const ts = deviceEntry.timestamp;
    const tsText = typeof ts === 'number'
      ? new Date(ts).toISOString()
      : typeof ts === 'string'
        ? ts
        : undefined;

    return normalizeTelemetryMessage({
      deviceId,
      deviceName: asString(deviceEntry.NAME ?? deviceEntry.name ?? deviceEntry.deviceName),
      ts: tsText,
      connection: deviceEntry.online === false ? 'offline' : 'connected',
      aqi: typeof deviceEntry.IAQ === 'number' ? deviceEntry.IAQ : typeof deviceEntry.aqi === 'number' ? deviceEntry.aqi : undefined,
      filterHealth: typeof deviceEntry.filterHealth === 'number' ? deviceEntry.filterHealth : undefined,
      remainingLifeDays: typeof deviceEntry.remainingLifeDays === 'number' ? deviceEntry.remainingLifeDays : undefined,
      sensors: buildSensorReadings(deviceEntry),
    }, fallbackDeviceId);
  }

  return normalizeTelemetryMessage(payload as Record<string, unknown>, fallbackDeviceId);
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
  const directUrl = endpoint(`/devices/${encodeURIComponent(deviceId)}/telemetry`);
  console.debug('[AirBuddi] Fetching latest telemetry for', deviceId, 'from', directUrl);

  try {
    const response = await fetch(directUrl, {
      headers: { Accept: 'application/json' },
    });
    const body = await responseBody(response);
    console.debug('[AirBuddi] Telemetry API response for', deviceId, body);
    return toDashboardTelemetryMessage(body, deviceId);
  } catch (error) {
    console.warn('[AirBuddi] Direct telemetry endpoint failed, falling back to /devices list.', error);
  }

  const listUrl = endpoint('/devices');
  const response = await fetch(listUrl, {
    headers: { Accept: 'application/json' },
  });
  const body = await responseBody(response);
  console.debug('[AirBuddi] Device list response for', deviceId, body);
  return toDashboardTelemetryMessage(body, deviceId);
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
