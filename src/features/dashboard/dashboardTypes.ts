export type ConnectionState = 'connected' | 'connecting' | 'offline';
export type DeviceMode = 'auto' | 'manual';
export type PowerState = 'on' | 'off';

export interface DashboardDevice {
  name: string;
  status: 'Online' | 'Offline';
  mode: DeviceMode;
  power: PowerState;
  lastUpdated: string;
  fanSpeed?: '1' | '2' | '3' | 'turbo';
}

export interface DashboardSensor {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: string;
  status: 'good' | 'warning' | 'critical';
}

export interface DashboardState {
  greeting: string;
  userName: string;
  notificationCount: number;
  device: DashboardDevice;
  aqi: number;
  connection: ConnectionState;
  filterHealth: number;
  remainingLifeDays: number;
  sensors: DashboardSensor[];
}