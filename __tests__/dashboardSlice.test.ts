import { applyTelemetry, dashboardReducer } from '../src/features/dashboard/dashboardSlice';
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

  it('prefers the online device entry when the configured device id is not present', () => {
    const message = toDashboardTelemetryMessage({
      devices: [
        {
          id: 'F4:65:0B:49:12:60',
          NAME: 'MONITOR 3',
          online: false,
          'Temperature': 0,
          'Humidity': 0,
          'PM 2.5': 0,
          'IAQ': 0,
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
    }, 'AA:BB:CC:DD:EE:FF');

    expect(message.sensors?.[0]).toMatchObject({
      id: 'temperature',
      value: 30.06182,
      unit: 'C',
    });
  });

  it('prefers a live online device entry over an exact offline match with empty telemetry', () => {
    const message = toDashboardTelemetryMessage({
      devices: [
        {
          id: 'F4:65:0B:49:12:60',
          NAME: 'MONITOR 3',
          online: false,
          'Temperature': 0,
          'Humidity': 0,
          'PM 2.5': 0,
          'IAQ': 0,
        },
        {
          id: '44:1D:64:2A:D7:78',
          NAME: 'MONITOR 3',
          online: true,
          'Temperature': 28.4,
          'Humidity': 60,
          'PM 2.5': 8,
          'IAQ': 62,
        },
      ],
    }, 'F4:65:0B:49:12:60');

    expect(message.aqi).toBe(62);
    expect(message.sensors?.find(sensor => sensor.id === 'temperature')).toMatchObject({
      value: 28.4,
      unit: 'C',
    });
  });
});
