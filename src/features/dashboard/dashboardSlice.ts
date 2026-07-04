import { createSlice, type PayloadAction } from '../../vendor/reduxToolkit';

import { awsIotConfig } from '../../config/awsIotConfig';
import type { DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
import type { Esp32DeviceTelemetry } from '../../services/awsIot/esp32TelemetryContract';
import { dashboardMockState } from './dashboardMockData';
import type {
  ConnectionState,
  DashboardDevice,
  DashboardSensor,
  DeviceMode,
  PowerState,
} from './dashboardTypes';

export interface DashboardRuntimeState {
  greeting: string;
  userName: string;
  notificationCount: number;
  device: DashboardDevice;
  aqi: number;
  connection: ConnectionState;
  filterHealth: number;
  remainingLifeDays: number;
  sensors: DashboardSensor[];
  liveMode: boolean;
  errorMessage: string | null;
  connectedDeviceCount: number;
}

const initialConnectionState: ConnectionState = awsIotConfig.enabled
  ? 'connecting'
  : dashboardMockState.connection;

const initialDeviceStatus: DashboardDevice['status'] = awsIotConfig.enabled
  ? 'Offline'
  : dashboardMockState.device.status;

const initialState: DashboardRuntimeState = {
  ...dashboardMockState,
  device: {
    ...dashboardMockState.device,
    status: initialDeviceStatus,
  },
  connection: initialConnectionState,
  liveMode: awsIotConfig.enabled,
  errorMessage: null,
  connectedDeviceCount: dashboardMockState.connectedDeviceCount ?? 1,
};

function mergeSensors(current: DashboardSensor[], next: DashboardTelemetryMessage['sensors']) {
  if (!next?.length) {
    return current;
  }

  return current.map(sensor => {
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
      ...current.device,
      name: telemetry.deviceName ?? current.device.name,
      power: telemetry.power ?? current.device.power,
      mode: telemetry.mode ?? current.device.mode,
      fanSpeed: telemetry.fanSpeed ?? current.device.fanSpeed,
      deviceId: telemetry.deviceId,
      lastSeenAt: telemetry.ts ?? current.device.lastSeenAt ?? current.device.lastUpdated,
      lastUpdated: telemetry.ts ?? 'Just now',
      status: telemetry.connection === 'offline' ? 'Offline' : 'Online',
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
    },
    setErrorMessage(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
    },
    setDevicePower(state, action: PayloadAction<PowerState>) {
      state.device.power = action.payload;
      state.device.lastUpdated = 'Just now';
    },
    setDeviceMode(state, action: PayloadAction<DeviceMode>) {
      state.device.mode = action.payload;
      state.device.lastUpdated = 'Just now';
    },
    cycleLocalFanSpeed(state) {
      const speeds: ('1' | '2' | '3' | 'turbo')[] = ['1', '2', '3', 'turbo'];
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
          ...state.device,
          ...telemetry.device,
          lastUpdated: telemetry.timestamp ?? telemetry.device.lastUpdated ?? 'Just now',
        };
      }

      if (telemetry.sensors) {
        state.sensors = mergeSensors(state.sensors, telemetry.sensors);
      }
    },
    resetDashboard(state) {
      state.greeting = dashboardMockState.greeting;
      state.userName = dashboardMockState.userName;
      state.notificationCount = dashboardMockState.notificationCount;
      state.device = {
        ...dashboardMockState.device,
        status: initialDeviceStatus,
      };
      state.aqi = dashboardMockState.aqi;
      state.connection = initialConnectionState;
      state.filterHealth = dashboardMockState.filterHealth;
      state.remainingLifeDays = dashboardMockState.remainingLifeDays;
      state.sensors = dashboardMockState.sensors;
      state.liveMode = awsIotConfig.enabled;
      state.errorMessage = null;
      state.connectedDeviceCount = dashboardMockState.connectedDeviceCount ?? 1;
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
