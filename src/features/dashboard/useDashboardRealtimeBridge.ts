import { useEffect, useRef } from 'react';

import { awsIotConfig } from '../../config/awsIotConfig';
import { useAppDispatch } from '../../store/hooks';
import { AwsIotClient } from '../../services/awsIot/awsIotClient';
import type { DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
import { fetchLatestTelemetry, postLightCommand } from '../../services/awsIot/awsTelemetryApiClient';
import type { ConnectionState, DeviceMode, PowerState } from './dashboardTypes';
import {
  applyTelemetry,
  cycleLocalFanSpeed,
  setConnectionState,
  setDeviceMode,
  setDevicePower,
  setErrorMessage,
  setFanSpeed,
  setLightZoneState,
  setSleepMode,
  setUvcState,
} from './dashboardSlice';

/**
 * Hook that bridges the React Native Redux state with AWS IoT Core.
 * It combines immediate state fetching via API Gateway and real-time updates via MQTT mTLS.
 */
export function useDashboardRealtimeBridge() {
  const dispatch = useAppDispatch();
  const clientRef = useRef<AwsIotClient | null>(null);

  useEffect(() => {
    console.log('[AirBuddi] bridge init (mTLS + API Gateway)', {
      endpoint: awsIotConfig.endpoint,
      deviceId: awsIotConfig.deviceId,
      apiUrl: awsIotConfig.deviceApiUrl,
    });

    const client = new AwsIotClient();
    clientRef.current = client;

    if (!awsIotConfig.enabled) {
      return () => {
        client.disconnect();
      };
    }

    dispatch(setConnectionState('connecting'));

    let active = true;

    // 1. Fetch initial state from API Gateway (Fast initial load)
    client.fetchInitialState(awsIotConfig).then(initialData => {
      if (active && initialData) {
        console.log('[AirBuddi] Applied initial state from API Gateway');
        dispatch(applyTelemetry(initialData));
      }
    });

    // 2. Connect via MQTT for real-time updates
    client
      .connect(awsIotConfig, {
        onConnectionChange: (status: ConnectionState) => {
          if (active) {
            dispatch(setConnectionState(status));
          }
        },
        onTelemetry: (topic: string, payload: DashboardTelemetryMessage) => {
          if (active) {
            console.log('[AirBuddi] Real-time telemetry received', { topic, payload });
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

    setLightStateState: async (zoneId: string, nextLightOn: boolean) => {
      // Optimistic UI update immediately
      dispatch(setLightZoneState({ zoneId, isOn: nextLightOn }));
      try {
        // POST /devices  →  { "command": "start" } or { "command": "stop" }
        // This matches the exact format tested and confirmed working in Postman.
        await postLightCommand(nextLightOn ? 'start' : 'stop');
        console.log('[AirBuddi] Light command sent:', nextLightOn ? 'start' : 'stop');
      } catch (error) {
        console.error('[AirBuddi] Light command failed:', error);
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
        // Revert UI if command failed
        dispatch(setLightZoneState({ zoneId, isOn: !nextLightOn }));
      }
    },

    cycleFanSpeed: async () => {
      dispatch(cycleLocalFanSpeed(undefined));
      await sendLegacyCommand('fanSpeed', 'cycle');
    },

    refreshData: async () => {
      dispatch(setConnectionState('connecting'));
      try {
        const latest = await fetchLatestTelemetry(awsIotConfig.deviceId);
        if (latest) {
          dispatch(applyTelemetry(latest));
        }
        dispatch(setConnectionState('connected'));
      } catch (error) {
        dispatch(setConnectionState('offline'));
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
  };
}
