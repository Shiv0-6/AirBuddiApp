import { createSlice, type PayloadAction } from '../../vendor/reduxToolkit';

import { awsIotConfig } from '../../config/awsIotConfig';
import type { DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
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
    applyTelemetry(state, action: PayloadAction<DashboardTelemetryMessage>) {
      const telemetry = action.payload;

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
    },
  },
});

export const {
  setConnectionState,
  setErrorMessage,
  setDevicePower,
  setDeviceMode,
  applyTelemetry,
  resetDashboard,
} = dashboardSlice.actions;

export const dashboardReducer = dashboardSlice.reducer;
