import { fetchAvailableFirmware, fetchLatestTelemetry, postEspCommand, postEspCommands, postFirmwareUpdate, toDashboardTelemetryMessage } from '../src/services/awsIot/awsTelemetryApiClient';

describe('fetchAvailableFirmware', () => {
  it('loads firmware versions and normalizes compact MAC addresses', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        devices: [
          { mac: 'D4E9F4BCEE24', model: 'AIRBUDDI_MAX', versions: ['1.0.1'] },
        ],
      }),
    });

    await expect(fetchAvailableFirmware()).resolves.toEqual([
      { mac: 'D4:E9:F4:BC:EE:24', model: 'AIRBUDDI_MAX', versions: ['1.0.1'] },
    ]);
    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/firmware\/available$/),
      expect.objectContaining({ headers: { Accept: 'application\/json' } }),
    );
  });

  it('loads firmware grouped by model and extracts versions from S3 keys', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        status: 'success',
        models: {
          AIRBUDDI_MINI: [
            { device_id: '441D642AD50C', versions: [] },
          ],
          AIRBUDDI_MAX: [
            {
              device_id: '441D642AD778',
              versions: [{
                file_name: 'firmware.bin',
                s3_key: 'AIRBUDDI_MAX/441D642AD778/1.0.0/firmware.bin',
                size_bytes: 1147760,
              }],
            },
            {
              device_id: 'B0A732B1CF70',
              versions: [{
                file_name: 'firmware.bin',
                s3_key: 'AIRBUDDI_MAX/B0A732B1CF70/1.0.5/firmware.bin',
              }],
            },
          ],
          Monitor: [
            {
              device_id: 'B0A732B1CF70',
              versions: [{
                file_name: 'firmware.bin',
                s3_key: 'Monitor/B0A732B1CF70/1.0.0/firmware.bin',
              }],
            },
          ],
        },
      }),
    });

    await expect(fetchAvailableFirmware()).resolves.toEqual([
      { mac: '44:1D:64:2A:D5:0C', model: 'AIRBUDDI_MINI', versions: [] },
      { mac: '44:1D:64:2A:D7:78', model: 'AIRBUDDI_MAX', versions: ['1.0.0'] },
      { mac: 'B0:A7:32:B1:CF:70', model: 'AIRBUDDI_MAX', versions: ['1.0.5'] },
      { mac: 'B0:A7:32:B1:CF:70', model: 'Monitor', versions: ['1.0.0'] },
    ]);
  });
});

describe('postFirmwareUpdate', () => {
  it('preserves the bucket model key for Monitor firmware', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    await postFirmwareUpdate('B0A732B1CF70', {
      command: 'firmware_update',
      model: 'Monitor',
      version: '1.0.0',
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/devices\/B0A732B1CF70$/),
      expect.objectContaining({
        body: JSON.stringify({
          command: 'firmware_update',
          model: 'Monitor',
          version: '1.0.0',
        }),
      }),
    );
  });
});

describe('postEspCommand', () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    }) as unknown as typeof fetch;
  });

  it('posts an arbitrary command message to the devices endpoint', async () => {
    await postEspCommand('d4:e9:f4:bc:ee:24', 'fan_high');

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/devices\/D4%3AE9%3AF4%3ABC%3AEE%3A24$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ command: 'fan_high' }),
      }),
    );
  });

  it('posts multiple command messages to the devices endpoint', async () => {
    await postEspCommands('dummy-id', ['power_on', 'fan_high']);

    expect((globalThis as any).fetch).toHaveBeenCalledTimes(2);
    expect((globalThis as any).fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/devices'),
      expect.objectContaining({
        body: JSON.stringify({ command: 'power_on' }),
      }),
    );
    expect((globalThis as any).fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/devices'),
      expect.objectContaining({
        body: JSON.stringify({ command: 'fan_high' }),
      }),
    );
  });

  it('fetches telemetry from the MAC-address device route', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'F4:65:0B:49:12:60', online: true, Temperature: 22 }),
    });

    await fetchLatestTelemetry('F4:65:0B:49:12:60');

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/devices\/F4%3A65%3A0B%3A49%3A12%3A60$/),
      expect.any(Object),
    );
  });

  it('uses the entered MAC address for both command and telemetry routes', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'D4:E9:F4:BC:EE:24', online: true }),
    });

    await fetchLatestTelemetry(' d4:e9:f4:bc:ee:24 ');

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/devices\/D4%3AE9%3AF4%3ABC%3AEE%3A24$/),
      expect.any(Object),
    );
  });

  it('includes numeric upper and lower chamber readings in telemetry sensors', () => {
    const message = toDashboardTelemetryMessage({
      devices: [
        {
          id: 'airbuddi-1',
          NAME: 'AirBuddi 1',
          online: true,
          Temperature: 24.5,
          upperBedChamber: 12,
          lowerBedChamber: 18.4,
        },
      ],
    }, 'airbuddi-1');

    expect(message.sensors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'upper_bed_chamber',
        name: 'Upper Chamber',
        value: 12,
      }),
      expect.objectContaining({
        id: 'lower_bed_chamber',
        name: 'Lower Chamber',
        value: 18.4,
      }),
    ]));
  });

  it('throws an error if the requested MAC address is not found on AWS', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ devices: [{ id: '11:22:33:44:55:66', online: true }] }),
    });

    await expect(fetchLatestTelemetry('AA:BB:CC:DD:EE:FF')).rejects.toThrow(
      'Device with MAC address "AA:BB:CC:DD:EE:FF" was not found on AWS.',
    );
  });
});
