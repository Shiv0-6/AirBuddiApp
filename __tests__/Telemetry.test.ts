import { toDashboardTelemetryMessage } from '../src/services/awsIot/awsTelemetryApiClient';

describe('Telemetry Parser', () => {
  it('correctly extracts and parses telemetry for the active device', () => {
    const mockApiResponse = {
      devices: [
        {
          "VOC's": 0,
          "PM 2.5": 0,
          "PM 4.0": 0,
          "PM 1.0": 0,
          "timestamp": 1783074070751,
          "Pressure": 0,
          "Gas Resistance": 0,
          "C02 Equivalent": 0,
          "IAQ": 0,
          "Temperature": 0,
          "id": "44:1D:64:2A:D7:2C",
          "Humidity": 0,
          "PM 10": 0,
          "NAME": "MONITOR 3",
          "online": false,
          "seconds_since_last_seen": 855722
        },
        {
          "VOC's": 0.12,
          "PM 2.5": 184,
          "PM 4.0": 189,
          "PM 1.0": 176,
          "timestamp": 1783928221735,
          "Pressure": 0,
          "Gas Resistance": 0,
          "C02 Equivalent": 450,
          "IAQ": 0,
          "Temperature": 22.5,
          "id": "F4:65:0B:49:82:BC",
          "Humidity": 45,
          "PM 10": 196,
          "NAME": "MONITOR 3",
          "online": false,
          "seconds_since_last_seen": 1572
        }
      ],
      fetched_at: 1783929793
    };

    const targetDeviceId = "F4:65:0B:49:82:BC";
    const telemetryMessage = toDashboardTelemetryMessage(mockApiResponse, targetDeviceId);

    expect(telemetryMessage.deviceId).toBe(targetDeviceId);
    expect(telemetryMessage.deviceName).toBe("MONITOR 3");
    expect(telemetryMessage.connection).toBe("offline"); // since online: false
    expect(telemetryMessage.esp32).toBeDefined();
    expect(telemetryMessage.esp32?.deviceId).toBe(targetDeviceId);

    const pm25Sensor = telemetryMessage.esp32?.sensors.find(s => s.key === 'pm2_5');
    const pm10Sensor = telemetryMessage.esp32?.sensors.find(s => s.key === 'pm10');
    const tempSensor = telemetryMessage.esp32?.sensors.find(s => s.key === 'temperature');

    expect(pm25Sensor).toBeDefined();
    expect(pm25Sensor?.value).toBe(184);
    expect(pm10Sensor?.value).toBe(196);
    expect(tempSensor?.value).toBe(22.5);
  });
});
