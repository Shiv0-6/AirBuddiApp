import { createSlice, type PayloadAction } from '../../vendor/reduxToolkit';

import { awsIotConfig } from '../../config/awsIotConfig';
import type { DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
import type { Esp32DeviceTelemetry } from '../../services/awsIot/esp32TelemetryContract';
import type {
  ConnectionState,
  DashboardDevice,
  DashboardSensor,
  DeviceMode,
  PowerState,
} from './dashboardTypes';

export interface DashboardRuntimeState {
  appTitle: string;
  device: DashboardDevice | null;
  aqi: number | null;
  connection: ConnectionState;
  filterHealth: number | null;
  remainingLifeDays: number | null;
  sensors: DashboardSensor[] | null;
  liveMode: boolean;
  errorMessage: string | null;
  connectedDeviceCount: number;
}

const initialState: DashboardRuntimeState = {
  appTitle: 'AirBuddi',
  device: {
    name: 'AirBuddi ESP32',
    status: 'Offline',
    mode: 'manual',
    power: 'off',
    lastUpdated: 'Waiting for telemetry',
    deviceId: awsIotConfig.deviceId,
  },
  aqi: null,
  connection: awsIotConfig.enabled ? 'connecting' : 'offline',
  filterHealth: null,
  remainingLifeDays: null,
  sensors: null,
  liveMode: awsIotConfig.enabled,
  errorMessage: null,
  connectedDeviceCount: 0,
};

function mergeSensors(current: DashboardSensor[] | null, next: DashboardTelemetryMessage['sensors']) {
  if (!next?.length) {
    return current;
  }

  const currentSensors = current ?? [];

  return currentSensors.map(sensor => {
    const update = next.find(item => item.id === sensor.id);

    if (!update) {
      return sensor;
    }

    return {
      ...sensor,
      ...update,
      status: update.status ?? sensor.status,
    };
  });
}

function mergeEsp32Telemetry(
  current: DashboardRuntimeState,
  telemetry: Esp32DeviceTelemetry,
) {
  const currentDevice = current.device;
  const deviceStatus: DashboardDevice['status'] = telemetry.connection === 'offline' ? 'Offline' : 'Online';

  const nextSensors = telemetry.sensors.map(sensor => ({
    id: sensor.key,
    name:
      sensor.key === 'pm2_5'
        ? 'PM2.5'
        : sensor.key === 'co2'
        ? 'CO₂'
        : sensor.key === 'voc'
        ? 'VOC'
        : sensor.key === 'pm10'
        ? 'PM10'
        : sensor.key === 'temperature'
        ? 'Temperature'
        : 'Humidity',
    value: sensor.value,
    unit: sensor.unit,
    icon:
      sensor.key === 'temperature'
        ? 'thermometer'
        : sensor.key === 'humidity'
        ? 'water-percent'
        : sensor.key === 'pm2_5'
        ? 'blur'
        : sensor.key === 'pm10'
        ? 'grain'
        : sensor.key === 'co2'
        ? 'molecule-co2'
        : 'air-filter',
    status: sensor.status ?? 'good',
    source: 'esp32' as const,
  }));

  return {
    ...current,
    device: {
      name: telemetry.deviceName ?? currentDevice?.name ?? 'ESP32 Device',
      status: deviceStatus,
      mode: telemetry.mode ?? currentDevice?.mode ?? 'manual',
      power: telemetry.power ?? currentDevice?.power ?? 'off',
      lastUpdated: telemetry.ts ?? currentDevice?.lastUpdated ?? 'Just now',
      fanSpeed: telemetry.fanSpeed ?? currentDevice?.fanSpeed,
      deviceId: telemetry.deviceId,
      lastSeenAt: telemetry.ts ?? currentDevice?.lastSeenAt ?? currentDevice?.lastUpdated,
    },
    connection: telemetry.connection ?? current.connection,
    aqi: telemetry.aqi ?? current.aqi,
    filterHealth: telemetry.filterHealth ?? current.filterHealth,
    remainingLifeDays: telemetry.remainingLifeDays ?? current.remainingLifeDays,
    connectedDeviceCount: 1,
    sensors: nextSensors,
  };
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setConnectionState(state, action: PayloadAction<ConnectionState>) {
      state.connection = action.payload;
      state.liveMode = action.payload === 'connected';
      state.connectedDeviceCount = action.payload === 'connected' ? Math.max(state.connectedDeviceCount, 1) : state.connectedDeviceCount;
    },
    setErrorMessage(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
    },
    setDevicePower(state, action: PayloadAction<PowerState>) {
      if (state.device) {
        state.device.power = action.payload;
        state.device.lastUpdated = 'Just now';
      }
    },
    setDeviceMode(state, action: PayloadAction<DeviceMode>) {
      if (state.device) {
        state.device.mode = action.payload;
        state.device.lastUpdated = 'Just now';
      }
    },
    cycleLocalFanSpeed(state) {
      const speeds: ('1' | '2' | '3' | 'turbo')[] = ['1', '2', '3', 'turbo'];
      if (!state.device) {
        return;
      }

      const currentSpeed = state.device.fanSpeed ?? '2';
      const currentIndex = speeds.indexOf(currentSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      state.device.fanSpeed = speeds[nextIndex];
      state.device.lastUpdated = 'Just now';
    },
    applyTelemetry(state, action: PayloadAction<DashboardTelemetryMessage>) {
      const telemetry = action.payload;

      if (telemetry.esp32) {
        const merged = mergeEsp32Telemetry(state, telemetry.esp32);

        state.device = merged.device;
        state.connection = merged.connection;
        state.aqi = merged.aqi;
        state.filterHealth = merged.filterHealth;
        state.remainingLifeDays = merged.remainingLifeDays;
        state.connectedDeviceCount = merged.connectedDeviceCount;
        state.sensors = merged.sensors;
      }

      if (typeof telemetry.aqi === 'number') {
        state.aqi = telemetry.aqi;
      }

      if (typeof telemetry.filterHealth === 'number') {
        state.filterHealth = telemetry.filterHealth;
      }

      if (typeof telemetry.remainingLifeDays === 'number') {
        state.remainingLifeDays = telemetry.remainingLifeDays;
      }

      if (telemetry.connection) {
        state.connection = telemetry.connection;
        state.liveMode = telemetry.connection === 'connected';
      }

      if (telemetry.device) {
        state.device = {
          ...(state.device ?? {
            name: telemetry.device.name ?? 'ESP32 Device',
            status: 'Online' as const,
            mode: 'manual',
            power: 'off',
            lastUpdated: telemetry.timestamp ?? 'Just now',
          }),
          ...telemetry.device,
          lastUpdated: telemetry.timestamp ?? telemetry.device.lastUpdated ?? 'Just now',
        };
      }

      if (telemetry.sensors) {
        state.sensors = mergeSensors(state.sensors, telemetry.sensors);
      }
    },
    resetDashboard(state) {
      state.appTitle = initialState.appTitle;
      state.device = initialState.device;
      state.aqi = null;
      state.connection = initialState.connection;
      state.filterHealth = null;
      state.remainingLifeDays = null;
      state.sensors = null;
      state.liveMode = awsIotConfig.enabled;
      state.errorMessage = null;
      state.connectedDeviceCount = 0;
    },
  },
});

export const {
  setConnectionState,
  setErrorMessage,
  setDevicePower,
  setDeviceMode,
  cycleLocalFanSpeed,
  applyTelemetry,
  resetDashboard,
} = dashboardSlice.actions;

export const dashboardReducer = dashboardSlice.reducer;
