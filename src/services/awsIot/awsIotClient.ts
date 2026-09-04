import type {
  AwsIotConnectionConfig,
  DashboardTelemetryMessage,
} from './awsIotTypes';
import type {
  Esp32SensorKey,
  Esp32SensorReading,
} from './esp32TelemetryContract';
import { esp32SensorDisplay } from './esp32TelemetryContract';
import { fetchLatestTelemetry, postDeviceCommand, toDashboardTelemetryMessage } from './awsTelemetryApiClient';
import { telemetryApiConfig } from '../../config/awsIotConfig';

type FlatEsp32Telemetry = DashboardTelemetryMessage & {
  device_id?: string;
  sensors?: any[];
  temperature?: number;
  temp?: number;
  temperature_c?: number;
  humidity?: number;
  humidity_percent?: number;
  pm2_5?: number;
  pm25?: number;
  pm10?: number;
  co2?: number;
  voc?: number;
  pressure?: number;
  gas_resistance?: number;
  deviceId?: string;
  deviceName?: string;
  ts?: string;
  connection?: any;
  power?: any;
  mode?: any;
  fanSpeed?: any;
  aqi?: any;
  filterHealth?: any;
  remainingLifeDays?: any;
  timestamp?: string;
  seconds_since_last_seen?: number | null;
};

type RawMqttClient = {
  on: (event: string, handler: (...args: Array<unknown>) => void) => void;
  subscribe: (
    topic: string | string[],
    options: { qos: 0 | 1 | 2 },
    callback?: (error?: Error | null) => void,
  ) => void;
  publish: (
    topic: string,
    payload: string,
    options?: { qos?: 0 | 1 | 2; retain?: boolean },
    callback?: (error?: Error | null) => void,
  ) => void;
  end: (force?: boolean) => void;
};

export interface AwsIotClientHandlers {
  onConnectionChange: (status: 'connected' | 'connecting' | 'offline') => void;
  onTelemetry: (topic: string, payload: DashboardTelemetryMessage) => void;
  onError: (error: Error) => void;
}

export class AwsIotClient {
  private client: RawMqttClient | null = null;
  private pollTimer: number | null = null;

  /**
   * Fetches initial state from the API Gateway if configured.
   */
  async fetchInitialState(config: AwsIotConnectionConfig): Promise<DashboardTelemetryMessage | null> {
    if (!config.deviceApiUrl) return null;

    try {
      console.log('[AirBuddi] Fetching initial state from API Gateway...');
      const response = await fetch(config.deviceApiUrl);
      if (!response.ok) {
        throw new Error(`API Gateway returned ${response.status}`);
      }

      const data = await response.json();
      const parsed = toDashboardTelemetryMessage(data, config.deviceId);

      if (parsed) {
        console.log('[AirBuddi] Initial state found for device:', config.deviceId);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('[AirBuddi] Failed to fetch initial state:', error);
      return null;
    }
  }

  async connect(config: AwsIotConnectionConfig, handlers: AwsIotClientHandlers) {
    if (!config.enabled || !config.endpoint) {
      return;
    }

    const mqtt = require('mqtt/dist/mqtt');

    // Simplified backend integration: poll the telemetry API for updates
    // instead of using certificate-based MQTT mTLS from the mobile app.
    if (telemetryApiConfig.baseUrl && telemetryApiConfig.baseUrl.includes('http')) {
      handlers.onConnectionChange('connecting');

      // One-off immediate fetch
      try {
        const initial = await fetchLatestTelemetry(config.deviceId);
        if (initial) {
          handlers.onTelemetry(config.topics.telemetry, initial);
        }
      } catch (e) {
        handlers.onConnectionChange('offline');
        handlers.onError(e instanceof Error ? e : new Error(String(e)));
      }

      // Start polling loop
      const intervalMs = (telemetryApiConfig.pollIntervalMs || 5000) as number;
      this.pollTimer = setInterval(async () => {
        try {
          const latest = await fetchLatestTelemetry(config.deviceId);
          if (latest) {
            handlers.onTelemetry(config.topics.telemetry, latest);
          }
        } catch (e) {
          handlers.onError(e instanceof Error ? e : new Error(String(e)));
        }
      }, intervalMs) as unknown as number;

      return;
    }

    handlers.onConnectionChange('offline');
  }

  publishCommand(topic: string, payload: unknown) {
    if (!this.client) {
      // Fallback: send command through telemetry API so backend can publish to IoT Core
      try {
        // Attempt to extract deviceId from payload or rely on config-level knowledge
        const maybe = payload as any;
        const deviceId = maybe?.deviceId || maybe?.device_id;
        if (!deviceId) {
          return Promise.reject(new Error('No MQTT client and payload lacks deviceId'));
        }

        // Legacy app publishes to topic 'esp32/control' with body { deviceId, command, value }
        if (topic === 'esp32/control' || topic.endsWith('/command') || topic.endsWith('/commands')) {
          const commandName = maybe?.command || 'command';
          const value = maybe?.value ?? maybe;
          return postDeviceCommand(deviceId, commandName, value);
        }

        return postDeviceCommand(deviceId, topic, payload);
      } catch (e) {
        return Promise.reject(e instanceof Error ? e : new Error(String(e)));
      }
    }

    return new Promise<void>((resolve, reject) => {
      this.client?.publish(topic, JSON.stringify(payload), { qos: 1 }, error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer as unknown as number);
      this.pollTimer = null;
    }

    this.client?.end(true);
    this.client = null;
  }
}

function payloadToString(payload: unknown) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof (payload as { toString?: () => string }).toString === 'function') {
    return (payload as { toString: () => string }).toString();
  }

  return String(payload);
}

export function parseJsonPayload(payload: string, defaultDeviceId: string): DashboardTelemetryMessage | null {
  try {
    const parsed = JSON.parse(payload);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const message = parsed.telemetry ?? parsed.payload ?? parsed.data ?? parsed;
    return normalizeTelemetryMessage(message, defaultDeviceId);
  } catch {
    return null;
  }
}

function normalizeBooleanState(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'on', 'active', 'enabled', 'yes'].includes(normalized)) return true;
    if (['false', 'off', 'inactive', 'disabled', 'no', 'standby'].includes(normalized)) return false;
  }

  if (typeof value === 'number') {
    return value === 1 ? true : value === 0 ? false : undefined;
  }

  return undefined;
}

function normalizePowerState(value: unknown): 'on' | 'off' | undefined {
  const asBool = normalizeBooleanState(value);
  if (typeof asBool === 'boolean') {
    return asBool ? 'on' : 'off';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'on' || normalized === 'true') return 'on';
    if (normalized === 'off' || normalized === 'false') return 'off';
  }

  return undefined;
}

function normalizeModeState(value: unknown): 'auto' | 'manual' | undefined {
  const asBool = normalizeBooleanState(value);
  if (typeof asBool === 'boolean') {
    return asBool ? 'auto' : 'manual';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'auto' || normalized === 'automatic') return 'auto';
    if (normalized === 'manual' || normalized === 'local') return 'manual';
  }

  return undefined;
}

function normalizeFanState(value: unknown): 'off' | '1' | '2' | '3' | 'turbo' | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'number') {
    if (value === 0) return 'off';
    if (value === 1) return '1';
    if (value === 2) return '2';
    if (value === 3) return '3';
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'off' || normalized === '0' || normalized === 'stop') return 'off';
    if (normalized === '1' || normalized === 'one' || normalized === 'low') return '1';
    if (normalized === '2' || normalized === 'two' || normalized === 'medium') return '2';
    if (normalized === '3' || normalized === 'three' || normalized === 'high' || normalized === 'turbo') return normalized === 'turbo' ? 'turbo' : '3';
    if (normalized.includes('fan_')) {
      const speed = normalized.split('fan_')[1];
      if (speed === 'off') return 'off';
      if (speed === '1') return '1';
      if (speed === '2') return '2';
      if (speed === '3') return '3';
      if (speed === 'turbo') return 'turbo';
    }
  }

  return undefined;
}

function normalizeChamberState(value: unknown): 'Active' | 'Standby' | undefined {
  const asBool = normalizeBooleanState(value);
  if (typeof asBool === 'boolean') {
    return asBool ? 'Active' : 'Standby';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['active', 'on', 'open', 'enabled', 'true'].includes(normalized)) return 'Active';
    if (['standby', 'off', 'closed', 'disabled', 'false'].includes(normalized)) return 'Standby';
  }

  return undefined;
}

function resolveConnectionStateFromMessage(message: any): 'connected' | 'offline' {
  if (typeof message?.online === 'boolean') {
    const statusText = typeof message?.status === 'string' ? message.status.trim().toLowerCase() : '';
    const hasLastSeenValue = message?.seconds_since_last_seen !== null && message?.seconds_since_last_seen !== undefined;
    if (message.online === false && statusText === 'online' && !hasLastSeenValue) {
      return 'connected';
    }
    return message.online ? 'connected' : 'offline';
  }

  if (typeof message?.online === 'string') {
    const normalized = message.online.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'online' || normalized === 'connected') {
      return 'connected';
    }
    if (normalized === 'false' || normalized === 'offline' || normalized === 'disconnected') {
      return 'offline';
    }
  }

  const statusValue = message?.status ?? message?.connection ?? message?.state ?? message?.deviceStatus;
  const statusText = typeof statusValue === 'string' ? statusValue.trim().toLowerCase() : '';

  if (statusText === 'online' || statusText === 'connected' || statusText === 'active') {
    return 'connected';
  }
  if (statusText === 'offline' || statusText === 'disconnected' || statusText === 'inactive') {
    return 'offline';
  }

  return 'connected';
}

export function normalizeTelemetryMessage(message: any, defaultDeviceId: string): DashboardTelemetryMessage {
  if (message.esp32) {
    return message;
  }

  const maybeEsp32 = message as FlatEsp32Telemetry;
  const hasOnlineValue = typeof maybeEsp32.online === 'boolean' || typeof maybeEsp32.online === 'string';
  const flatConnection = hasOnlineValue
    ? resolveConnectionStateFromMessage(maybeEsp32)
    : maybeEsp32.connection ?? resolveConnectionStateFromMessage(maybeEsp32);

  return {
    ...message,
    connection: flatConnection,
    esp32: {
      deviceId: maybeEsp32.deviceId ?? maybeEsp32.device_id ?? defaultDeviceId,
      deviceName: maybeEsp32.deviceName ?? maybeEsp32.NAME ?? maybeEsp32.name,
      ts: maybeEsp32.ts ?? maybeEsp32.timestamp,
      connection: flatConnection,
      power: normalizePowerState(maybeEsp32.power ?? maybeEsp32.device?.power ?? maybeEsp32.powerState) ?? maybeEsp32.power,
      mode: normalizeModeState(maybeEsp32.mode ?? maybeEsp32.autoMode ?? maybeEsp32.device?.mode) ?? maybeEsp32.mode,
      fanSpeed: normalizeFanState(maybeEsp32.fanSpeed ?? maybeEsp32.fan_speed ?? maybeEsp32.device?.fanSpeed) ?? maybeEsp32.fanSpeed,
      sleepMode: normalizeBooleanState(maybeEsp32.sleepMode ?? maybeEsp32.device?.sleepMode),
      uvc: normalizeBooleanState(maybeEsp32.uvc ?? maybeEsp32.device?.uvc),
      upperBedChamber: normalizeChamberState(maybeEsp32.upperBedChamber ?? maybeEsp32.upperChamber ?? maybeEsp32.upper_bed_chamber),
      lowerBedChamber: normalizeChamberState(maybeEsp32.lowerBedChamber ?? maybeEsp32.lowerChamber ?? maybeEsp32.lower_bed_chamber),
      aqi: maybeEsp32.aqi,
      filterHealth: maybeEsp32.filterHealth,
      remainingLifeDays: maybeEsp32.remainingLifeDays,
      sensors: normalizeEsp32Sensors(maybeEsp32),
    },
  };
}

function normalizeEsp32Sensors(telemetry: any): Esp32SensorReading[] {
  if (Array.isArray(telemetry.sensors) && telemetry.sensors.length) {
    return telemetry.sensors
      .map((sensor: any) => {
        const key = (sensor.key || sensor.id) as Esp32SensorKey;
        return {
          key,
          value: sensor.value,
          unit: sensor.unit ?? esp32SensorDisplay(key).unit,
          status: sensor.status,
        };
      })
      .filter((s: any) => typeof s.value === 'number');
  }

  // The ESP32 legacy publisher sends title-cased keys. Newer firmware uses
  // lower-case keys. `typeof value === 'number'` deliberately preserves 0.
  const gasResistanceRaw = telemetry['Gas Resistance'] ?? telemetry.gasResistance ?? telemetry.gas_resistance;
  const gasResistanceValue = typeof gasResistanceRaw === 'number'
    ? gasResistanceRaw / 1000
    : undefined;

  const readings: Array<[Esp32SensorKey, unknown]> = [
    ['temperature', telemetry.Temperature ?? telemetry.temperature ?? telemetry.temp ?? telemetry.temperature_c],
    ['humidity', telemetry.Humidity ?? telemetry.humidity ?? telemetry.humidity_percent],
    ['pm2_5', telemetry['PM 2.5'] ?? telemetry.pm2_5 ?? telemetry.pm25],
    ['pm10', telemetry['PM 10'] ?? telemetry.pm10],
    ['co2', telemetry['C02 Equivalent'] ?? telemetry['CO2 Equivalent'] ?? telemetry.CO2 ?? telemetry.Co2 ?? telemetry.co2],
    ['voc', telemetry["VOC's"] ?? telemetry.VOC ?? telemetry.VOCs ?? telemetry.voc],
    ['pressure', telemetry.Pressure ?? telemetry.pressure],
    ['gas_resistance', gasResistanceValue],
  ];

  return readings
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({
      key,
      value: value as number,
      unit: esp32SensorDisplay(key).unit,
      status: 'good' as const,
    }));
}
