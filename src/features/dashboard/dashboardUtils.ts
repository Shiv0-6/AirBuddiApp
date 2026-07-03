import { aqiLegend } from './dashboardMockData';
import { dashboardTheme } from './dashboardTheme';

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getAqiDescriptor(aqi: number) {
  const fallback = aqiLegend[aqiLegend.length - 1];

  return (
    aqiLegend.find(entry => aqi >= entry.min && aqi <= entry.max) ?? fallback
  );
}

export function formatSensorValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(value < 1 ? 2 : 1);
}

export function getConnectionTone(connection: 'connected' | 'connecting' | 'offline') {
  switch (connection) {
    case 'connected':
      return dashboardTheme.colors.success;
    case 'connecting':
      return dashboardTheme.colors.warning;
    case 'offline':
    default:
      return dashboardTheme.colors.danger;
  }
}

export function getSensorTone(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good':
      return dashboardTheme.colors.success;
    case 'warning':
      return dashboardTheme.colors.warning;
    case 'critical':
    default:
      return dashboardTheme.colors.danger;
  }
}