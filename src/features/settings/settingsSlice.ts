import { createSlice, PayloadAction } from '../../vendor/reduxToolkit';

export type HomeDevice = {
  id: string;
  name: string;
  room: string;
  status: 'Online' | 'Offline';
  aqi: number | null;
  icon: string;
};

export interface SettingsState {
  profile: {
    name: string;
    email: string;
    avatarUri: string | null;
  };
  notifications: {
    push: boolean;
    aqiAlerts: boolean;
    deviceOffline: boolean;
    filterReminder: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    tempUnit: 'celsius' | 'fahrenheit';
    aqiStandard: 'us' | 'india';
    language: 'en' | 'hi';
    aqiWarningThreshold: string;
    aqiDangerThreshold: string;
  };
  devices: HomeDevice[];
  selectedDeviceId: string | null;
  activeSheet: 'account' | 'devices' | 'notification-settings' | 'preferences' | 'support' | 'Explore other Products' | 'Sign Out' | 'profile' | 'add-device' | 'edit-device' | 'menu' | 'about' | 'linked-accounts' | 'notifications' | 'alert-thresholds' | 'appearance' | 'units' | 'data-privacy' | 'help' | 'contact-support' | 'legal' | null;
}

const initialState: SettingsState = {
  profile: {
    name: 'AirBuddi Member',
    email: 'member@airbuddi.app',
    phone: '',
    location: '',
    avatarUri: null,
  },
  notifications: {
    push: true,
    aqiAlerts: true,
    deviceOffline: true,
    filterReminder: true,
  },
  preferences: {
    theme: 'system',
    tempUnit: 'celsius',
    aqiStandard: 'us',
    language: 'en',
    aqiWarningThreshold: '100',
    aqiDangerThreshold: '200',
  },
  devices: [],
  selectedDeviceId: null,
  activeSheet: null,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Partial<SettingsState['profile']>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setNotifications: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setPreferences: (state, action: PayloadAction<Partial<SettingsState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setDevices: (state, action: PayloadAction<HomeDevice[]>) => {
      state.devices = action.payload;
      if (state.selectedDeviceId && !action.payload.find(d => d.id === state.selectedDeviceId)) {
        state.selectedDeviceId = action.payload.length > 0 ? action.payload[0].id : null;
      } else if (!state.selectedDeviceId && action.payload.length > 0) {
        state.selectedDeviceId = action.payload[0].id;
      }
    },
    addDevice: (state, action: PayloadAction<HomeDevice>) => {
      state.devices.push(action.payload);
      if (!state.selectedDeviceId) {
        state.selectedDeviceId = action.payload.id;
      }
    },
    updateDevice: (state, action: PayloadAction<HomeDevice>) => {
      const index = state.devices.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.devices[index] = action.payload;
      }
    },
    removeDevice: (state, action: PayloadAction<string>) => {
      state.devices = state.devices.filter(d => d.id !== action.payload);
      if (state.selectedDeviceId === action.payload) {
        state.selectedDeviceId = state.devices.length > 0 ? state.devices[0].id : null;
      }
    },
    setSelectedDeviceId: (state, action: PayloadAction<string | null>) => {
      state.selectedDeviceId = action.payload;
    },
    setActiveSheet: (state, action: PayloadAction<SettingsState['activeSheet']>) => {
      state.activeSheet = action.payload;
    },
    resetSettings: () => {
      return initialState;
    },
  },
});

export const {
  setProfile,
  setNotifications,
  setPreferences,
  setDevices,
  addDevice,
  updateDevice,
  removeDevice,
  setSelectedDeviceId,
  setActiveSheet,
  resetSettings,
} = settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;
