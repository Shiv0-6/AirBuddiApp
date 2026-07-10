import type { ConnectionState, DeviceMode, PowerState } from '../../features/dashboard/dashboardTypes';

export type Esp32SensorKey =
  | 'temperature'
  | 'humidity'
  | 'pm2_5'
  | 'pm10'
  | 'co2'
  | 'voc';

export interface Esp32SensorReading {
  key: Esp32SensorKey;
  value: number;
  unit: string;
  status?: 'good' | 'warning' | 'critical';
}

export interface Esp32DeviceTelemetry {
  deviceId: string;
  deviceName?: string;
  ts?: string;
  connection?: ConnectionState;
  power?: PowerState;
  mode?: DeviceMode;
  fanSpeed?: '1' | '2' | '3' | 'turbo';
  aqi?: number;
  filterHealth?: number;
  remainingLifeDays?: number;
  sensors: Esp32SensorReading[];
}

export interface Esp32CommandEnvelope {
  deviceId: string;
  command: 'power' | 'fanSpeed' | 'autoMode' | 'sync';
  value: string | number | boolean;
  ts: string;
}
