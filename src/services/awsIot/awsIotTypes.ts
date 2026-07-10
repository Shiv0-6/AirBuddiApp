import type { ConnectionState, DashboardDevice, DashboardSensor } from '../../features/dashboard/dashboardTypes';
import type { Esp32DeviceTelemetry } from './esp32TelemetryContract';

export interface AwsIotMtlsCredentials {
  rootCA: string;
  deviceCert: string;
  privateKey: string;
}

export interface AwsIotTopics {
  telemetry: string;
  status: string;
  command: string;
  connection: string;
}

export interface AwsIotConnectionConfig {
  enabled: boolean;
  endpoint: string;
  region: string;
  clientId: string;
  deviceId: string;
  topics: AwsIotTopics;
}


export interface DashboardTelemetryMessage {
  aqi?: number;
  connection?: ConnectionState;
  device?: Partial<DashboardDevice>;
  filterHealth?: number;
  remainingLifeDays?: number;
  sensors?: Array<Partial<DashboardSensor> & Pick<DashboardSensor, 'id'>>;
  timestamp?: string;
  esp32?: Esp32DeviceTelemetry;
}

export interface DashboardCommandMessage {
  type: 'power' | 'fanSpeed' | 'autoMode';
  value: string | number | boolean;
  timestamp: string;
}