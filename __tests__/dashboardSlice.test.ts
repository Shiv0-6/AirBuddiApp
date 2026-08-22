import { applyTelemetry, dashboardReducer, setFanSpeed } from '../src/features/dashboard/dashboardSlice';
import { toDashboardTelemetryMessage } from '../src/services/awsIot/awsTelemetryApiClient';

describe('dashboard reducer telemetry updates', () => {
  it('keeps sensor readings when telemetry arrives', () => {
    const initialState = dashboardReducer(undefined, { type: '@@INIT', payload: undefined });

    const nextState = dashboardReducer(initialState, applyTelemetry({
      aqi: 50,
      connection: 'connected',
      sensors: [
        {
          id: 'temperature',
          name: 'Temperature',
          value: 30.06,
          unit: 'C',
          icon: 'thermometer',
          status: 'good' as const,
          source: 'cloud' as const,
        },
      ],
    }));

    expect(nextState.sensors).toHaveLength(1);
    expect(nextState.sensors?.[0]).toMatchObject({
      id: 'temperature',
      value: 30.06,
      unit: 'C',
    });
  });

  it('strictly matches the configured device ID when present', () => {
    const message = toDashboardTelemetryMessage({
      devices: [
        {
          id: 'F4:65:0B:49:12:60',
          NAME: 'MONITOR 3',
          online: false,
          'Temperature': 22.5,
          'Humidity': 45,
          'PM 2.5': 12,
          'IAQ': 40,
        },
        {
          id: '44:1D:64:2A:D7:78',
          NAME: 'MONITOR 3',
          online: true,
          'Temperature': 30.06182,
          'Humidity': 85.51967,
          'PM 2.5': 0,
          'IAQ': 50,
        },
      ],
    }, 'F4:65:0B:49:12:60');

    expect(message.deviceId).toBe('F4:65:0B:49:12:60');
    expect(message.aqi).toBe(40);
    expect(message.sensors?.find(sensor => sensor.id === 'temperature')).toMatchObject({
      value: 22.5,
    });
  });

  it('falls back to default telemetry format when the requested device ID is not present', () => {
    const message = toDashboardTelemetryMessage({
      devices: [
        {
          id: 'F4:65:0B:49:12:60',
          NAME: 'MONITOR 3',
          online: true,
          'Temperature': 28.4,
          'Humidity': 60,
          'PM 2.5': 8,
          'IAQ': 62,
        },
      ],
    }, 'AA:BB:CC:DD:EE:FF');

    expect(message.deviceId).toBe('AA:BB:CC:DD:EE:FF');
    expect(message.connection).toBe('offline');
  });

  it('clears monitor data when telemetry switches offline', () => {
    const initialState = dashboardReducer(undefined, { type: '@@INIT', payload: undefined });

    const connectedState = dashboardReducer(initialState, applyTelemetry({
      aqi: 42,
      connection: 'connected',
      sensors: [
        {
          id: 'pm2_5',
          name: 'PM2.5',
          value: 12,
          unit: 'ug/m3',
          icon: 'blur',
          status: 'good' as const,
          source: 'cloud' as const,
        },
      ],
    }));

    const offlineState = dashboardReducer(connectedState, applyTelemetry({
      connection: 'offline',
      sensors: [
        {
          id: 'pm2_5',
          value: 99,
        },
      ],
      aqi: 99,
    }));

    expect(offlineState.connection).toBe('offline');
    expect(offlineState.aqi).toBeNull();
    expect(offlineState.sensors).toBeNull();
  });

  it('turns the fan off without enabling sleep mode', () => {
    const initialState = dashboardReducer(undefined, { type: '@@INIT', payload: undefined });
    const connectedState = dashboardReducer(initialState, applyTelemetry({
      connection: 'connected',
      esp32: {
        deviceId: 'test-device',
        power: 'on',
        mode: 'manual',
        fanSpeed: '2',
        sleepMode: false,
        sensors: [],
      },
    }));

    const nextState = dashboardReducer(connectedState, setFanSpeed('off'));

    expect(nextState.device?.fanSpeed).toBe('off');
    expect(nextState.device?.sleepMode).toBe(false);
  });
});
