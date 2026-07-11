import { useEffect, useRef } from 'react';

import { awsIotConfig, validateAwsIotConfig } from '../../config/awsIotConfig';
import { useAppDispatch } from '../../store/hooks';
import { AwsIotClient } from '../../services/awsIot/awsIotClient';
import type { DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
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

/**
 * Hook that bridges the React Native Redux state with the AWS IoT Core MQTT client.
 * Now exclusively uses mTLS (port 8883) and the legacy topic structure to match old_app.
 */
export function useDashboardRealtimeBridge() {
  const dispatch = useAppDispatch();
  const clientRef = useRef<AwsIotClient | null>(null);

  useEffect(() => {
    console.log('[AirBuddi] bridge init (mTLS mode)', {
      endpoint: awsIotConfig.endpoint,
      deviceId: awsIotConfig.deviceId,
    });

    const client = new AwsIotClient();
    clientRef.current = client;

    if (!awsIotConfig.enabled) {
      return () => {
        client.disconnect();
      };
    }

    const configCheck = validateAwsIotConfig();
    if (!configCheck.valid) {
      dispatch(setConnectionState('offline'));
      dispatch(setErrorMessage(configCheck.reason));
      return () => {
        client.disconnect();
      };
    }

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
            console.log('[AirBuddi] telemetry received', { topic, payload });
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

  // Helper to publish commands to the legacy 'esp32/control' topic
  const sendLegacyCommand = async (commandName: string, value: any) => {
    try {
      await clientRef.current?.publishCommand('esp32/control', {
        deviceId: awsIotConfig.deviceId,
        command: commandName,
        value: value,
        ts: new Date().toISOString(),
      });
    } catch (error) {
      dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
    }
  };

  return {
    setPowerState: async (nextPower: boolean) => {
      const power: PowerState = nextPower ? 'on' : 'off';
      dispatch(setDevicePower(power));
      await sendLegacyCommand('power', power);
    },

    setAutoMode: async (nextAutoMode: boolean) => {
      const mode: DeviceMode = nextAutoMode ? 'auto' : 'manual';
      dispatch(setDeviceMode(mode));
      await sendLegacyCommand('autoMode', mode);
    },

    setSleepModeState: async (nextSleepMode: boolean) => {
      dispatch(setSleepMode(nextSleepMode));
      await sendLegacyCommand('autoMode', nextSleepMode ? 'sleep' : 'off');
    },

    setUvcModeState: async (nextUvc: boolean) => {
      dispatch(setUvcState(nextUvc));
      await sendLegacyCommand('autoMode', nextUvc ? 'uvc_on' : 'uvc_off');
    },

    setFanSpeedState: async (speed: '1' | '2' | '3' | 'turbo') => {
      dispatch(setFanSpeed(speed));
      await sendLegacyCommand('fanSpeed', speed);
    },

    cycleFanSpeed: async () => {
      dispatch(cycleLocalFanSpeed(undefined));
      await sendLegacyCommand('fanSpeed', 'cycle');
    },
  };
}
