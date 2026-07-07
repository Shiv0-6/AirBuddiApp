import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { formatUrl } from '@aws-sdk/util-format-url';

import type {
  AwsIotConnectionConfig,
  AwsIotCredentials,
  DashboardTelemetryMessage,
} from './awsIotTypes';
import type {
  Esp32DeviceTelemetry,
  Esp32SensorKey,
  Esp32SensorReading,
} from './esp32TelemetryContract';

type FlatEsp32Telemetry = DashboardTelemetryMessage &
  Partial<Omit<Esp32DeviceTelemetry, 'sensors'>> & {
    device_id?: string;
    sensors?: DashboardTelemetryMessage['sensors'] | Esp32DeviceTelemetry['sensors'];
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
  };

function isValidAwsIotMqttEndpoint(endpoint: string) {
  return endpoint.includes('.iot.') && !endpoint.includes('execute-api');
}

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

    if (!isValidAwsIotMqttEndpoint(config.endpoint)) {
      handlers.onConnectionChange('offline');
      handlers.onError(
        new Error(
          'Invalid AWS IoT endpoint. Use the ATS MQTT endpoint in the form <prefix>-ats.iot.<region>.amazonaws.com, not an execute-api hostname.',
        ),
      );
      return;
    }

    const credentials = await config.credentialsProvider();
    const signedUrl = await buildSignedMqttUrl(config.region, config.endpoint, credentials);

    const mqtt = require('mqtt/dist/mqtt');

    this.client = mqtt.connect(signedUrl, {
      clientId: config.clientId,
      clean: true,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      resubscribe: true,
      rejectUnauthorized: true,
    }) as RawMqttClient;

    this.client.on('connect', () => {
      handlers.onConnectionChange('connected');
      this.client?.subscribe(
        [config.topics.telemetry, config.topics.status, config.topics.connection],
        { qos: 0 },
        error => {
          if (error) {
            handlers.onError(error);
          }
        },
      );
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

    this.client.on('error', error => {
      handlers.onError(error instanceof Error ? error : new Error(String(error)));
    });

    this.client.on('message', (...args: unknown[]) => {
      const [topic, payload] = args;
      const rawMessage = payloadToString(payload);
      const parsed = parseJsonPayload(rawMessage);

      if (parsed && typeof topic === 'string') {
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

function payloadToString(payload: unknown) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof (payload as { toString?: () => string }).toString === 'function') {
    return (payload as { toString: () => string }).toString();
  }

  return String(payload);
}

async function buildSignedMqttUrl(
  region: string,
  endpoint: string,
  credentials: AwsIotCredentials,
) {
  const signer = new SignatureV4({
    credentials,
    region,
    service: 'iotdevicegateway',
    sha256: Sha256,
  });

  const request = new HttpRequest({
    method: 'GET',
    protocol: 'wss:',
    hostname: endpoint,
    path: '/mqtt',
  });

  const signedRequest = await signer.presign(request, { expiresIn: 900 });

  return formatUrl(signedRequest);
}

function parseJsonPayload(payload: string): DashboardTelemetryMessage | null {
  try {
    const parsed = JSON.parse(payload) as DashboardTelemetryMessage & {
      data?: DashboardTelemetryMessage;
      payload?: DashboardTelemetryMessage;
      telemetry?: DashboardTelemetryMessage;
    };

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const message = parsed.telemetry ?? parsed.payload ?? parsed.data ?? parsed;

    return normalizeTelemetryMessage(message);
  } catch {
    return null;
  }
}

function normalizeTelemetryMessage(message: DashboardTelemetryMessage): DashboardTelemetryMessage {
  if (message.esp32) {
    return message;
  }

  const maybeEsp32 = message as FlatEsp32Telemetry;

  const hasEsp32Identity = typeof maybeEsp32.deviceId === 'string' || typeof maybeEsp32.device_id === 'string';
  const hasEsp32SensorArray =
    Array.isArray(maybeEsp32.sensors) &&
    maybeEsp32.sensors.some(sensor => 'key' in sensor || 'id' in sensor);
  const hasFlatSensorReadings =
    typeof maybeEsp32.temperature === 'number' ||
    typeof maybeEsp32.temp === 'number' ||
    typeof maybeEsp32.temperature_c === 'number' ||
    typeof maybeEsp32.humidity === 'number' ||
    typeof maybeEsp32.humidity_percent === 'number' ||
    typeof maybeEsp32.pm2_5 === 'number' ||
    typeof maybeEsp32.pm25 === 'number' ||
    typeof maybeEsp32.pm10 === 'number' ||
    typeof maybeEsp32.co2 === 'number' ||
    typeof maybeEsp32.voc === 'number';

  if (!hasEsp32Identity && !hasEsp32SensorArray && !hasFlatSensorReadings) {
    return message;
  }

  return {
    ...message,
    esp32: {
      deviceId: maybeEsp32.deviceId ?? maybeEsp32.device_id ?? 'airbuddi-pure-x',
      deviceName: maybeEsp32.deviceName,
      ts: maybeEsp32.ts ?? message.timestamp,
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

function normalizeEsp32Sensors(
  telemetry: FlatEsp32Telemetry,
): Esp32SensorReading[] {
  if (Array.isArray(telemetry.sensors) && telemetry.sensors.length) {
    const sensors: Esp32SensorReading[] = [];

    telemetry.sensors.forEach(sensor => {
      const key = ('key' in sensor ? sensor.key : sensor.id) as Esp32SensorKey;
      const value = sensor.value;

      if (typeof value === 'number') {
        sensors.push({
          key,
          value,
          unit: sensor.unit ?? defaultSensorUnit(key),
          status: sensor.status,
        });
      }
    });

    return sensors;
  }

  return ([
    ['temperature', telemetry.temperature ?? telemetry.temp ?? telemetry.temperature_c],
    ['humidity', telemetry.humidity ?? telemetry.humidity_percent],
    ['pm2_5', telemetry.pm2_5 ?? telemetry.pm25],
    ['pm10', telemetry.pm10],
    ['co2', telemetry.co2],
    ['voc', telemetry.voc],
  ] as Array<[Esp32SensorKey, number | undefined]>)
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
    case 'temperature':
      return 'C';
    case 'humidity':
      return '%';
    case 'pm2_5':
    case 'pm10':
      return 'ug/m3';
    case 'co2':
      return 'ppm';
    case 'voc':
      return 'ppm';
  }
}
