import { telemetryApiConfig } from '../../config/awsIotConfig';
import type { DashboardTelemetryMessage } from './awsIotTypes';
import { normalizeTelemetryMessage } from './awsIotClient';
import { esp32SensorDisplay, type Esp32SensorKey } from './esp32TelemetryContract';

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

  if (normalizedFallback) {
    const exactMatch = candidates.find((entry: unknown) => {
      if (!isRecord(entry)) return false;

      const candidateIds = [entry.id, entry.deviceId, entry.device_id, entry.deviceID].map(asString);
      const name = asString(entry.NAME ?? entry.name ?? entry.deviceName);

      return candidateIds.some(id => id.toLowerCase() === normalizedFallback) || name.toLowerCase() === normalizedFallback;
    }) as Record<string, unknown> | undefined;

    if (exactMatch) {
      return exactMatch;
    }

    return null;
  }

  const onlineCandidates = candidates.filter((entry: unknown) => {
    if (!isRecord(entry)) return false;
    return entry.online === true || entry.online === 'true';
  }) as Record<string, unknown>[];

  if (onlineCandidates.length) {
    const latestOnline = onlineCandidates.reduce<Record<string, unknown> | null>((best, current) => {
      if (!best) return current;

      const currentTs = typeof current.timestamp === 'number' ? current.timestamp : 0;
      const bestTs = typeof (best as Record<string, unknown>).timestamp === 'number' ? (best as Record<string, unknown>).timestamp as number : 0;
      return currentTs > bestTs ? current : best;
    }, null);

    if (latestOnline) {
      return latestOnline;
    }
  }

  return (candidates[0] as Record<string, unknown> | undefined) ?? null;
}

function buildSensorReadings(entry: Record<string, unknown>) {
  const gasResistanceRaw = entry['Gas Resistance'] ?? entry.gasResistance ?? entry.gas_resistance;
  const gasResistanceValue = typeof gasResistanceRaw === 'number'
    ? gasResistanceRaw / 1000
    : undefined;

  const upperChamberValue = entry.upperBedChamber
    ?? entry.upper_bed_chamber
    ?? entry['Upper Chamber']
    ?? entry.upperChamber;
  const lowerChamberValue = entry.lowerBedChamber
    ?? entry.lower_bed_chamber
    ?? entry['Lower Chamber']
    ?? entry.lowerChamber;

  const readings: Array<[string, unknown]> = [
    ['temperature', entry.Temperature ?? entry.temperature ?? entry.temp ?? entry.temperature_c],
    ['humidity', entry.Humidity ?? entry.humidity ?? entry.humidity_percent],
    ['pm2_5', entry['PM 2.5'] ?? entry.pm2_5 ?? entry.pm25],
    ['pm10', entry['PM 10'] ?? entry.pm10],
    ['co2', entry['C02 Equivalent'] ?? entry['CO2 Equivalent'] ?? entry.CO2 ?? entry.co2],
    ['voc', entry["VOC's"] ?? entry.VOC ?? entry.VOCs ?? entry.voc],
    ['pressure', entry.Pressure ?? entry.pressure],
    ['gas_resistance', gasResistanceValue],
    ['upper_bed_chamber', upperChamberValue],
    ['lower_bed_chamber', lowerChamberValue],
  ];

  return readings
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => {
      if (key === 'upper_bed_chamber' || key === 'lower_bed_chamber') {
        return {
          id: key,
          name: key === 'upper_bed_chamber' ? 'Upper Chamber' : 'Lower Chamber',
          value: value as number,
          unit: '',
          icon: 'sprout',
          status: 'good' as const,
          source: 'cloud' as const,
        };
      }

      const display = esp32SensorDisplay(key as Esp32SensorKey);

      return {
        id: key,
        name: display.name,
        value: value as number,
        unit: display.unit,
        icon: display.icon,
        status: 'good' as const,
        source: 'cloud' as const,
      };
    });
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

  return normalizeTelemetryMessage({ deviceId: fallbackDeviceId, connection: 'offline' }, fallbackDeviceId);
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
  const normalizedDeviceId = deviceId.trim();
  if (!normalizedDeviceId) {
    throw new Error('A device ID is required to fetch telemetry.');
  }

  // The API identifies a device by its MAC address at /devices/{deviceId}.
  // encodeURIComponent keeps colons and any other valid path characters safe.
  const directUrl = endpoint(`/devices/${encodeURIComponent(normalizedDeviceId)}`);
  console.debug('[AirBuddi] Fetching latest telemetry for', normalizedDeviceId, 'from', directUrl);

  const response = await fetch(directUrl, {
    headers: { Accept: 'application/json' },
  });
  const body = await responseBody(response);
  console.debug('[AirBuddi] Telemetry API response for', normalizedDeviceId, body);

  const deviceEntry = findMatchingDeviceEntry(body, normalizedDeviceId);
  if (!deviceEntry) {
    throw new Error(`Device with MAC address "${normalizedDeviceId}" was not found on AWS. Please check the MAC address.`);
  }

  return toDashboardTelemetryMessage(body, normalizedDeviceId);
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

/**
 * Sends a generic ESP command to the backend via API Gateway.
 * The payload is intentionally minimal so each control can reuse the same path
 * by changing only the message string passed in.
 */
export async function postEspCommand(command: string) {
  const response = await fetch(endpoint('/devices'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`ESP command failed (${response.status}): ${text}`);
  }
}

/**
 * Sends one or more ESP command messages to the backend.
 * Use this when a single button should trigger multiple messages.
 */
export async function postEspCommands(commands: string[]) {
  for (const command of commands) {
    await postEspCommand(command);
  }
}

/**
 * Sends a light control command to the ESP32 via API Gateway.
 * Matches the tested Postman format:
 *   POST /devices  →  { "command": "start" | "stop" }
 */
export async function postLightCommand(command: 'start' | 'stop') {
  await postEspCommand(command);
}
