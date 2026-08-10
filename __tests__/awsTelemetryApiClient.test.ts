import { postEspCommand, postEspCommands, toDashboardTelemetryMessage } from '../src/services/awsIot/awsTelemetryApiClient';

describe('postEspCommand', () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    }) as unknown as typeof fetch;
  });

  it('posts an arbitrary command message to the devices endpoint', async () => {
    await postEspCommand('fan_high');

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/devices'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ command: 'fan_high' }),
      }),
    );
  });

  it('posts multiple command messages to the devices endpoint', async () => {
    await postEspCommands(['power_on', 'fan_high']);

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
});
