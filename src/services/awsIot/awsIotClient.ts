import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { formatUrl } from '@aws-sdk/util-format-url';

import type {
  AwsIotConnectionConfig,
  AwsIotCredentials,
  DashboardCommandMessage,
  DashboardTelemetryMessage,
} from './awsIotTypes';

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

    this.client.on('message', (topic: string, payload: unknown) => {
      const rawMessage = typeof payload === 'string' ? payload : String(payload);
      const parsed = parseJsonPayload(rawMessage);

      if (parsed) {
        handlers.onTelemetry(topic, parsed);
      }
    });
  }

  publishCommand(topic: string, payload: DashboardCommandMessage) {
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

    return parsed.telemetry ?? parsed.payload ?? parsed.data ?? parsed;
  } catch {
    return null;
  }
}