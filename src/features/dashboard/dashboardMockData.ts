import type { DashboardSensor, DashboardState } from './dashboardTypes';

export const dashboardMockState: DashboardState = {
  greeting: 'Good Morning',
  userName: 'Buddi',
  notificationCount: 2,
  device: {
    name: 'AirBuddi Pure X',
    status: 'Online',
    mode: 'auto',
    power: 'on',
    lastUpdated: '2 min ago',
    fanSpeed: '2',
    deviceId: 'airbuddi-pure-x',
  },
  aqi: 46,
  connection: 'connected',
  filterHealth: 78,
  remainingLifeDays: 42,
  sensors: [
    { id: 'temp', name: 'Temperature', value: 24.6, unit: '°C', icon: 'thermometer', status: 'good', source: 'esp32' },
    { id: 'humidity', name: 'Humidity', value: 52, unit: '%', icon: 'water-percent', status: 'good', source: 'esp32' },
    { id: 'pm25', name: 'PM2.5', value: 18, unit: 'µg/m³', icon: 'blur', status: 'warning', source: 'esp32' },
    { id: 'pm10', name: 'PM10', value: 31, unit: 'µg/m³', icon: 'grain', status: 'good', source: 'esp32' },
    { id: 'co2', name: 'CO₂', value: 612, unit: 'ppm', icon: 'molecule-co2', status: 'good', source: 'esp32' },
    { id: 'voc', name: 'VOC', value: 0.21, unit: 'ppm', icon: 'air-filter', status: 'good', source: 'esp32' },
  ],
  connectedDeviceCount: 1,
};

export const aqiLegend = [
  { min: 0, max: 50, label: 'Excellent', color: '#1F9D55' },
  { min: 51, max: 100, label: 'Good', color: '#3B82F6' },
  { min: 101, max: 150, label: 'Moderate', color: '#F0A202' },
  { min: 151, max: 200, label: 'Poor', color: '#D64545' },
];

export const connectionLabels: Record<DashboardState['connection'], string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  offline: 'Offline',
};

export const sensorValueThresholds: Record<DashboardSensor['status'], string> = {
  good: 'Stable',
  warning: 'Monitor',
  critical: 'Attention',
};