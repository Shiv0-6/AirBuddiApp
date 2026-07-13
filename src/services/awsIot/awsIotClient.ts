import type {
  AwsIotConnectionConfig,
  DashboardTelemetryMessage,
} from './awsIotTypes';
import type {
  Esp32SensorKey,
  Esp32SensorReading,
} from './esp32TelemetryContract';
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
        handlers.onConnectionChange('connected');
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

export function normalizeTelemetryMessage(message: any, defaultDeviceId: string): DashboardTelemetryMessage {
  if (message.esp32) {
    return message;
  }

  const maybeEsp32 = message as FlatEsp32Telemetry;

  return {
    ...message,
    esp32: {
      deviceId: maybeEsp32.deviceId ?? maybeEsp32.device_id ?? defaultDeviceId,
      deviceName: maybeEsp32.deviceName,
      ts: maybeEsp32.ts ?? maybeEsp32.timestamp,
      connection: maybeEsp32.connection ?? 'connected',
      power: maybeEsp32.power,
      mode: maybeEsp32.mode,
      fanSpeed: maybeEsp32.fanSpeed,
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
          unit: sensor.unit ?? defaultSensorUnit(key),
          status: sensor.status,
        };
      })
      .filter((s: any) => typeof s.value === 'number');
  }

  // The ESP32 legacy publisher sends title-cased keys. Newer firmware uses
  // lower-case keys. `typeof value === 'number'` deliberately preserves 0.
  const readings: Array<[Esp32SensorKey, unknown]> = [
    ['temperature', telemetry.Temperature ?? telemetry.temperature ?? telemetry.temp ?? telemetry.temperature_c],
    ['humidity', telemetry.Humidity ?? telemetry.humidity ?? telemetry.humidity_percent],
    ['pm2_5', telemetry['PM 2.5'] ?? telemetry.pm2_5 ?? telemetry.pm25],
    ['pm10', telemetry['PM 10'] ?? telemetry.pm10],
    ['co2', telemetry['C02 Equivalent'] ?? telemetry['CO2 Equivalent'] ?? telemetry.CO2 ?? telemetry.Co2 ?? telemetry.co2],
    ['voc', telemetry["VOC's"] ?? telemetry.VOC ?? telemetry.VOCs ?? telemetry.voc],
  ];

  return readings
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({
      key,
      value: value as number,
      unit: defaultSensorUnit(key),
      status: 'good' as const,
    }));
}

function defaultSensorUnit(key: Esp32SensorKey) {
  switch (key) {
    case 'temperature': return 'C';
    case 'humidity': return '%';
    case 'pm2_5':
    case 'pm10': return 'ug/m3';
    case 'co2':
    case 'voc': return 'ppm';
    default: return '';
  }
}
