import { postEspCommand, postEspCommands } from '../src/services/awsIot/awsTelemetryApiClient';

describe('postEspCommand', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    }) as unknown as typeof fetch;
  });

  it('posts an arbitrary command message to the devices endpoint', async () => {
    await postEspCommand('fan_high');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/devices'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ command: 'fan_high' }),
      }),
    );
  });

  it('posts multiple command messages to the devices endpoint', async () => {
    await postEspCommands(['power_on', 'fan_high']);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/devices'),
      expect.objectContaining({
        body: JSON.stringify({ command: 'power_on' }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/devices'),
      expect.objectContaining({
        body: JSON.stringify({ command: 'fan_high' }),
      }),
    );
  });
});
