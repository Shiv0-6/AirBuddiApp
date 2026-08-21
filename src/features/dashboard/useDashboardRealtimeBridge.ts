import { useEffect, useMemo, useRef } from 'react';

import { awsIotConfig, createAwsIotTopics } from '../../config/awsIotConfig';
import { useAppDispatch } from '../../store/hooks';
import { AwsIotClient } from '../../services/awsIot/awsIotClient';
import type { DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
import { fetchLatestTelemetry, postEspCommand, postEspCommands } from '../../services/awsIot/awsTelemetryApiClient';
import type { ConnectionState, DeviceMode, PowerState } from './dashboardTypes';
import {
  applyTelemetry,
  cycleLocalFanSpeed,
  resetDashboard,
  setConnectionState,
  setDeviceMode,
  setDevicePower,
  setErrorMessage,
  setFanSpeed,
  setLightZoneState,
  setUpperBedChamberState,
  setLowerBedChamberState,
  setSleepMode,
  setUvcState,
} from './dashboardSlice';

/**
 * Hook that bridges the React Native Redux state with AWS IoT Core.
 * It combines immediate state fetching via API Gateway and real-time updates via MQTT mTLS.
 */
export function useDashboardRealtimeBridge(selectedDeviceId?: string | null) {
  const dispatch = useAppDispatch();
  const clientRef = useRef<AwsIotClient | null>(null);
  const deviceId = selectedDeviceId?.trim() ?? '';

  const deviceConfig = useMemo(() => ({
    ...awsIotConfig,
    deviceId,
    clientId: `airbuddi-mobile-${deviceId}`,
    deviceApiUrl: `${awsIotConfig.deviceApiUrl?.replace(/\/$/, '')}/${encodeURIComponent(deviceId)}`,
    topics: createAwsIotTopics(deviceId),
  }), [deviceId]);

  useEffect(() => {
    console.log('[AirBuddi] bridge init (mTLS + API Gateway)', {
      endpoint: awsIotConfig.endpoint,
      deviceId,
      apiUrl: deviceConfig.deviceApiUrl,
    });

    const client = new AwsIotClient();
    clientRef.current = client;
    dispatch(resetDashboard(undefined));

    if (!awsIotConfig.enabled || !deviceId) {
      dispatch(setConnectionState('offline'));
      return () => {
        client.disconnect();
      };
    }

    dispatch(setConnectionState('connecting'));

    let active = true;

    // 1. Fetch initial state from API Gateway (Fast initial load)
    client.fetchInitialState(deviceConfig).then(initialData => {
      if (active && initialData) {
        console.log('[AirBuddi] Applied initial state from API Gateway');
        dispatch(applyTelemetry(initialData));
      }
    });

    // 2. Connect via MQTT for real-time updates
    client
      .connect(deviceConfig, {
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
  }, [deviceConfig, deviceId, dispatch]);

  // Helper to publish commands to the legacy 'esp32/control' topic
  const sendLegacyCommand = async (commandName: string, value: any) => {
    try {
      await clientRef.current?.publishCommand('esp32/control', {
        deviceId,
        command: commandName,
        value: value,
        ts: new Date().toISOString(),
      });
    } catch (error) {
      dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
    }
  };

  const sendEspCommand = async (message: string) => {
    try {
      // Single-message helper for a button that should send one ESP command.
      await postEspCommand(deviceId,message);
      console.log('[AirBuddi] ESP command sent:', message);
    } catch (error) {
      console.error('[AirBuddi] ESP command failed:', error);
      dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      throw error;
    }
  };

  const sendEspCommands = async (messages: string[]) => {
    try {
      // Use this when one button should send multiple commands to the ESP endpoint.
      await postEspCommands(deviceId,messages);
      console.log('[AirBuddi] ESP commands sent:', messages);
    } catch (error) {
      console.error('[AirBuddi] ESP commands failed:', error);
      dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      throw error;
    }
  };

  return {
    sendEspCommand,
    sendEspCommands,

    setPowerState: async (nextPower: boolean) => {
      const power: PowerState = nextPower ? 'on' : 'off';
      dispatch(setDevicePower(power));
      await sendLegacyCommand('power', power);
      // EDIT THIS ARRAY for the power button.
      // Each string becomes a separate POST to /devices with { "command": "..." }.
      await sendEspCommands([nextPower ? 'power_on' : 'power_off']);
    },

    setAutoMode: async (nextAutoMode: boolean) => {
      const mode: DeviceMode = nextAutoMode ? 'auto' : 'manual';
      dispatch(setDeviceMode(mode));
      await sendLegacyCommand('autoMode', mode);
      // EDIT THIS ARRAY for the auto/manual button.
      await sendEspCommands([nextAutoMode ? 'auto_on' : 'auto_off']);
    },

    setSleepModeState: async (nextSleepMode: boolean) => {
      dispatch(setSleepMode(nextSleepMode));
      await sendLegacyCommand('autoMode', nextSleepMode ? 'sleep' : 'off');
      // Sends speed_on / speed_off for fan power control
      await sendEspCommands([nextSleepMode ? 'speed_on' : 'speed_off']);
    },

    setUvcModeState: async (nextUvc: boolean) => {
      dispatch(setUvcState(nextUvc));
      await sendLegacyCommand('autoMode', nextUvc ? 'uvc_on' : 'uvc_off');
      // EDIT THIS ARRAY for the UV/C button.
      await sendEspCommands([nextUvc ? 'uvc_on' : 'uvc_off']);
    },

    setFanSpeedState: async (speed: 'off' | '1' | '2' | '3' | 'turbo') => {
      dispatch(setFanSpeed(speed));
      await sendLegacyCommand('fanSpeed', speed);
      // EDIT THIS ARRAY for the fan speed button.
      // Example: ['fan_off'], ['fan_1'], ['fan_2'], ['fan_3'], ['fan_turbo'], or multiple messages.
      await sendEspCommands([`fan_${speed}`]);
    },

    setLightStateState: async (zoneId: string, nextLightOn: boolean) => {
      // Optimistic UI update immediately
      dispatch(setLightZoneState({ zoneId, isOn: nextLightOn }));
      try {
        // Map zone-1 (Ambient) -> L1, zone-2 (Task) -> L2, zone-3 (Accent) -> L3
        let commandPrefix = 'L1';
        if (zoneId === 'zone-2') {
          commandPrefix = 'L2';
        } else if (zoneId === 'zone-3') {
          commandPrefix = 'L3';
        }
        await sendEspCommands([nextLightOn ? `${commandPrefix}_on` : `${commandPrefix}_off`]);
      } catch (error) {
        console.error('[AirBuddi] Light command failed:', error);
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
        // Revert UI if command failed
        dispatch(setLightZoneState({ zoneId, isOn: !nextLightOn }));
      }
    },

    setUpperBedChamberStateState: async (nextVal: 'Active' | 'Standby') => {
      const currentVal = nextVal === 'Active' ? 'Standby' : 'Active';
      dispatch(setUpperBedChamberState(nextVal));
      try {
        await sendEspCommands([nextVal === 'Active' ? 'upper_on' : 'upper_off']);
      } catch (error) {
        console.error('[AirBuddi] Upper bed chamber command failed:', error);
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
        // Revert UI if command failed
        dispatch(setUpperBedChamberState(currentVal));
      }
    },

    setLowerBedChamberStateState: async (nextVal: 'Active' | 'Standby') => {
      const currentVal = nextVal === 'Active' ? 'Standby' : 'Active';
      dispatch(setLowerBedChamberState(nextVal));
      try {
        await sendEspCommands([nextVal === 'Active' ? 'lower_on' : 'lower_off']);
      } catch (error) {
        console.error('[AirBuddi] Lower bed chamber command failed:', error);
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
        // Revert UI if command failed
        dispatch(setLowerBedChamberState(currentVal));
      }
    },

    cycleFanSpeed: async () => {
      dispatch(cycleLocalFanSpeed(undefined));
      await sendLegacyCommand('fanSpeed', 'cycle');
    },

    refreshData: async () => {
      if (!deviceId) {
        dispatch(setErrorMessage('Add a device before refreshing telemetry.'));
        return;
      }
      dispatch(setConnectionState('connecting'));
      try {
        const latest = await fetchLatestTelemetry(deviceId);
        if (latest) {
          dispatch(applyTelemetry(latest));
          const nextConnection = latest.esp32?.connection ?? latest.connection ?? 'offline';
          dispatch(setConnectionState(nextConnection));
        } else {
          dispatch(setConnectionState('offline'));
        }
      } catch (error) {
        dispatch(setConnectionState('offline'));
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
  };
}
