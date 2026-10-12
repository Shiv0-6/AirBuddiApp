import type { ConnectionState, DeviceMode, PowerState } from '../../features/dashboard/dashboardTypes';

export type Esp32SensorKey =
  | 'temperature'
  | 'humidity'
  | 'pm1_0'
  | 'pm2_5'
  | 'pm4_0'
  | 'pm10'
  | 'co2'
  | 'voc'
  | 'pressure'
  | 'gas_resistance';

export function normalizeEsp32SensorKey(value: unknown): Esp32SensorKey | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'pm1_0') {
    return 'pm1_0';
  }
  if (normalized === 'pm2_5') {
    return 'pm2_5';
  }
  if (normalized === 'pm4_0') {
    return 'pm4_0';
  }
  if (/^pm\s*1(?:\.0)?$/.test(normalized)) {
    return 'pm1_0';
  }
  if (/^pm\s*2(?:\.5|25)?$/.test(normalized)) {
    return 'pm2_5';
  }
  if (/^pm\s*4(?:\.0)?$/.test(normalized)) {
    return 'pm4_0';
  }
  if (/^pm\s*10$/.test(normalized)) {
    return 'pm10';
  }

  const key = normalized.replace(/[._\s-]+/g, '');
  const aliases: Record<string, Esp32SensorKey> = {
    temperature: 'temperature',
    humidity: 'humidity',
    pm1: 'pm1_0',
    pm10: 'pm10',
    pm25: 'pm2_5',
    pm40: 'pm4_0',
    co2: 'co2',
    c02equivalent: 'co2',
    voc: 'voc',
    vocs: 'voc',
    pressure: 'pressure',
    gasresistance: 'gas_resistance',
  };

  return aliases[key];
}

export function esp32SensorDisplay(key: Esp32SensorKey): { name: string; unit: string; icon: string } {
  switch (key) {
    case 'temperature':
      return { name: 'Temperature', unit: 'C', icon: 'thermometer' };
    case 'humidity':
      return { name: 'Humidity', unit: '%', icon: 'water-percent' };
    case 'pm2_5':
      return { name: 'PM2.5', unit: 'ug/m3', icon: 'blur' };
    case 'pm1_0':
      return { name: 'PM1.0', unit: 'ug/m3', icon: 'blur-outline' };
    case 'pm4_0':
      return { name: 'PM4.0', unit: 'ug/m3', icon: 'blur' };
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
  fanSpeed?: 'off' | '1' | '2' | '3' | 'turbo';
  sleepMode?: boolean;
  uvc?: boolean;
  upperBedChamber?: 'Active' | 'Standby';
  lowerBedChamber?: 'Active' | 'Standby';
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
