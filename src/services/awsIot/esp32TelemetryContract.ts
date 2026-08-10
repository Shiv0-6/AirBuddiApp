import type { ConnectionState, DeviceMode, PowerState } from '../../features/dashboard/dashboardTypes';

export type Esp32SensorKey =
  | 'temperature'
  | 'humidity'
  | 'pm2_5'
  | 'pm10'
  | 'co2'
  | 'voc'
  | 'pressure'
  | 'gas_resistance';

export function esp32SensorDisplay(key: Esp32SensorKey): { name: string; unit: string; icon: string } {
  switch (key) {
    case 'temperature':
      return { name: 'Temperature', unit: 'C', icon: 'thermometer' };
    case 'humidity':
      return { name: 'Humidity', unit: '%', icon: 'water-percent' };
    case 'pm2_5':
      return { name: 'PM2.5', unit: 'ug/m3', icon: 'blur' };
    case 'pm10':
      return { name: 'PM10', unit: 'ug/m3', icon: 'grain' };
    case 'co2':
      return { name: 'CO₂', unit: 'ppm', icon: 'molecule-co2' };
    case 'voc':
      return { name: 'VOC', unit: 'ppm', icon: 'air-filter' };
    case 'pressure':
      return { name: 'Pressure', unit: 'hPa', icon: 'gauge' };
    case 'gas_resistance':
      return { name: 'Gas Resistance', unit: 'kΩ', icon: 'gas-cylinder' };
  }
}

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
