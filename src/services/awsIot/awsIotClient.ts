import type {
  AwsIotConnectionConfig,
  DashboardTelemetryMessage,
} from './awsIotTypes';
import type {
  Esp32SensorKey,
  Esp32SensorReading,
} from './esp32TelemetryContract';

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

  async connect(config: AwsIotConnectionConfig, handlers: AwsIotClientHandlers) {
    if (!config.enabled || !config.endpoint) {
      return;
    }

    const mqtt = require('mqtt/dist/mqtt');

    // ─────────────────────────────────────────────────────────────
    // Certificate-based Mutual TLS (mTLS) Connection (Port 8883)
    // matches behavior from old_app/airbuddi
    // ─────────────────────────────────────────────────────────────
    const { MY_IOT_MTLS_CREDENTIALS } = require('../../config/awsIotCredentials');

    const { rootCA, deviceCert, privateKey } = MY_IOT_MTLS_CREDENTIALS as {
      rootCA?: string;
      deviceCert?: string;
      privateKey?: string;
    };

    if (!rootCA || !deviceCert || !privateKey) {
      handlers.onConnectionChange('offline');
      handlers.onError(
        new Error(
          'MQTT mTLS credentials are missing. Please fill in rootCA, deviceCert, and privateKey in src/config/awsIotCredentials.ts.',
        ),
      );
      return;
    }

    const connectionClientId = config.clientId;

    console.log('[AirBuddi] Connecting via MQTT mTLS', {
      host: config.endpoint,
      port: 8883,
      clientId: connectionClientId,
    });

    try {
      this.client = mqtt.connect({
        host: config.endpoint,
        port: 8883,
        protocol: 'mqtts',
        clientId: connectionClientId,
        clean: true,
        keepalive: 60,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        resubscribe: true,
        rejectUnauthorized: true,
        ca: rootCA,
        cert: deviceCert,
        key: privateKey,
      }) as RawMqttClient;
    } catch (e) {
      handlers.onError(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    const topicsToSubscribe = [
      config.topics.telemetry,
      config.topics.status,
      config.topics.connection,
      'AQMG_5', // Legacy sensor topic from old_app
    ];

    this.client.on('connect', () => {
      console.log('[AirBuddi] MQTT connected via mTLS');
      handlers.onConnectionChange('connected');

      this.client?.subscribe(topicsToSubscribe, { qos: 0 }, error => {
        if (error) {
          console.error('[AirBuddi] Subscribe error', error);
          handlers.onError(error);
          return;
        }
        console.log('[AirBuddi] Subscribed to:', topicsToSubscribe);
      });
    });

    this.client.on('reconnect', () => {
      handlers.onConnectionChange('connecting');
    });

    this.client.on('offline', () => {
      handlers.onConnectionChange('offline');
    });

    this.client.on('close', () => {
      handlers.onConnectionChange('offline');
    });

    this.client.on('error', (error: unknown) => {
      console.error('[AirBuddi] MQTT Error:', error);
      handlers.onError(error instanceof Error ? error : new Error(String(error)));
    });

    this.client.on('message', (topic: string, payload: any) => {
      const rawMessage = payload.toString();
      const parsed = parseJsonPayload(rawMessage);

      if (parsed) {
        handlers.onTelemetry(topic, parsed);
      }
    });
  }

  publishCommand(topic: string, payload: unknown) {
    if (!this.client) {
      return Promise.resolve();
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
    this.client?.end(true);
    this.client = null;
  }
}

function parseJsonPayload(payload: string): DashboardTelemetryMessage | null {
  try {
    const parsed = JSON.parse(payload);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const message = parsed.telemetry ?? parsed.payload ?? parsed.data ?? parsed;
    return normalizeTelemetryMessage(message);
  } catch {
    return null;
  }
}

function normalizeTelemetryMessage(message: any): DashboardTelemetryMessage {
  if (message.esp32) {
    return message;
  }

  const maybeEsp32 = message as FlatEsp32Telemetry;

  return {
    ...message,
    esp32: {
      deviceId: maybeEsp32.deviceId ?? maybeEsp32.device_id ?? 'airbuddi-pure-x',
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

  const legacyMap: Record<string, Esp32SensorKey> = {
    'Temperature': 'temperature',
    'Humidity': 'humidity',
    'PM 2.5': 'pm2_5',
    'PM 10': 'pm10',
    'C02 Equivalent': 'co2',
    'CO2 Equivalent': 'co2',
    'VOC\'s': 'voc',
  };

  const sensors: Esp32SensorReading[] = [];
  for (const [rawKey, sensorKey] of Object.entries(legacyMap)) {
    const value = telemetry[rawKey];
    if (typeof value === 'number') {
      sensors.push({
        key: sensorKey,
        value,
        unit: defaultSensorUnit(sensorKey),
        status: 'good',
      });
    }
  }

  return sensors;
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
