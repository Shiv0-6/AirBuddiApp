import { useEffect, useRef } from 'react';

import { awsIotConfig } from '../../config/awsIotConfig';
import { useAppDispatch } from '../../store/hooks';
import { AwsIotClient } from '../../services/awsIot/awsIotClient';
import type { DashboardCommandMessage, DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
import type { Esp32CommandEnvelope } from '../../services/awsIot/esp32TelemetryContract';
import type { ConnectionState, DeviceMode, PowerState } from './dashboardTypes';
import {
  applyTelemetry,
  cycleLocalFanSpeed,
  setConnectionState,
  setDeviceMode,
  setDevicePower,
  setErrorMessage,
  setFanSpeed,
  setSleepMode,
  setUvcState,
} from './dashboardSlice';

export function useDashboardRealtimeBridge() {
  const dispatch = useAppDispatch();
  const clientRef = useRef<AwsIotClient | null>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[AirBuddi] realtime bridge effect init', {
      awsIotConfigEnabled: awsIotConfig.enabled,
      legacyMode: awsIotConfig.legacyMode,
      endpoint: awsIotConfig.endpoint,
      deviceId: awsIotConfig.deviceId,
    });

    const client = new AwsIotClient();
    clientRef.current = client;

    if (!awsIotConfig.enabled) {
      // eslint-disable-next-line no-console
      console.log('[AirBuddi] realtime bridge disabled, skipping connect');
      return () => {
        client.disconnect();
      };
    }

    // eslint-disable-next-line no-console
    console.log('[AirBuddi] realtime bridge calling client.connect()');

    dispatch(setConnectionState('connecting'));

    let active = true;

    client
      .connect(awsIotConfig, {
        onConnectionChange: (status: ConnectionState) => {
          if (active) {
            dispatch(setConnectionState(status));
          }
        },
        onTelemetry: (topic: string, payload: DashboardTelemetryMessage) => {
          if (active) {
            // Helpful during AWS IoT wiring/debug
            // eslint-disable-next-line no-console
            console.log('[AirBuddi] telemetry', { topic, payload });
            dispatch(applyTelemetry(payload));
          }
        },
        onError: error => {
          if (active) {
            dispatch(setConnectionState('offline'));
            dispatch(setErrorMessage(error.message));
          }
        },
      })
      .catch(error => {
        if (active) {
          dispatch(setConnectionState('offline'));
          dispatch(setErrorMessage(error.message));
        }
      });

    return () => {
      active = false;
      client.disconnect();
    };
  }, [dispatch]);

  return {
    setPowerState: async (nextPower: boolean) => {
      const power: PowerState = nextPower ? 'on' : 'off';
      dispatch(setDevicePower(power));

      const command: DashboardCommandMessage = {
        type: 'power',
        value: power,
        timestamp: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(
          awsIotConfig.legacyMode ? 'esp32/control' : awsIotConfig.topics.command,
          awsIotConfig.legacyMode
            ? { deviceId: awsIotConfig.deviceId, command: 'power', value: power, ts: new Date().toISOString() }
            : command,
        );
      } catch (error) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },

    setAutoMode: async (nextAutoMode: boolean) => {
      const mode: DeviceMode = nextAutoMode ? 'auto' : 'manual';
      dispatch(setDeviceMode(mode));

      const command: DashboardCommandMessage = {
        type: 'autoMode',
        value: mode,
        timestamp: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(
          awsIotConfig.legacyMode ? 'esp32/control' : awsIotConfig.topics.command,
          awsIotConfig.legacyMode
            ? { deviceId: awsIotConfig.deviceId, command: 'autoMode', value: mode, ts: new Date().toISOString() }
            : command,
        );
      } catch (error) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }

    },
    setSleepModeState: async (nextSleepMode: boolean) => {
      dispatch(setSleepMode(nextSleepMode));

      const esp32Command: Esp32CommandEnvelope = {
        deviceId: awsIotConfig.deviceId,
        command: 'autoMode',
        value: nextSleepMode ? 'sleep' : 'off',
        ts: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(
          awsIotConfig.legacyMode ? 'esp32/control' : awsIotConfig.topics.command,
          awsIotConfig.legacyMode
            ? {
                deviceId: awsIotConfig.deviceId,
                command: 'autoMode',
                value: nextSleepMode ? 'sleep' : 'off',
                ts: new Date().toISOString(),
              }
            : esp32Command,
        );
      } catch (error: unknown) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }

    },
    setUvcModeState: async (nextUvc: boolean) => {

      dispatch(setUvcState(nextUvc));

      const esp32Command: Esp32CommandEnvelope = {
        deviceId: awsIotConfig.deviceId,
        command: 'autoMode',
        value: nextUvc ? 'uvc_on' : 'uvc_off',
        ts: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(
          awsIotConfig.legacyMode ? 'esp32/control' : awsIotConfig.topics.command,
          awsIotConfig.legacyMode
            ? { deviceId: awsIotConfig.deviceId, command: 'autoMode', value: nextUvc ? 'uvc_on' : 'uvc_off', ts: new Date().toISOString() }
            : esp32Command,
        );
      } catch (error: unknown) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
    setFanSpeedState: async (speed: '1' | '2' | '3' | 'turbo') => {

      dispatch(setFanSpeed(speed));

      const esp32Command: Esp32CommandEnvelope = {
        deviceId: awsIotConfig.deviceId,
        command: 'fanSpeed',
        value: speed,
        ts: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(
          awsIotConfig.legacyMode ? 'esp32/control' : awsIotConfig.topics.command,
          awsIotConfig.legacyMode
            ? { deviceId: awsIotConfig.deviceId, command: 'fanSpeed', value: speed, ts: new Date().toISOString() }
            : esp32Command,
        );
      } catch (error: unknown) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
    cycleFanSpeed: async () => {
      dispatch(cycleLocalFanSpeed(undefined));
      const esp32Command: Esp32CommandEnvelope = {
        deviceId: awsIotConfig.deviceId,
        command: 'fanSpeed',
        value: 'cycle',
        ts: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(
          awsIotConfig.legacyMode ? 'esp32/control' : awsIotConfig.topics.command,
          awsIotConfig.legacyMode
            ? { deviceId: awsIotConfig.deviceId, command: 'fanSpeed', value: 'cycle', ts: new Date().toISOString() }
            : esp32Command,
        );
      } catch (error: unknown) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
  };
}
