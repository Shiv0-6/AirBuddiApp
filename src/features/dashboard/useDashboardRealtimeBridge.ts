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
  const pendingControlsRef = useRef(new Map<string, unknown>());
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

    const applyRealtimePayload = (payload: DashboardTelemetryMessage) => {
      if (!payload.esp32 || pendingControlsRef.current.size === 0) {
        dispatch(applyTelemetry(payload));
        return;
      }

      const nextEsp32 = { ...payload.esp32 } as Record<string, unknown>;
      const controlFields = ['power', 'mode', 'fanSpeed', 'sleepMode', 'uvc', 'upperBedChamber', 'lowerBedChamber'];

      for (const field of controlFields) {
        const pendingValue = pendingControlsRef.current.get(field);
        if (pendingValue === undefined) continue;

        if (nextEsp32[field] === pendingValue) {
          pendingControlsRef.current.delete(field);
        } else {
          // Ignore stale control state, but keep applying sensors and telemetry.
          delete nextEsp32[field];
        }
      }

      dispatch(applyTelemetry({ ...payload, esp32: nextEsp32 as DashboardTelemetryMessage['esp32'] }));
    };

    // 1. Fetch initial state from API Gateway (Fast initial load)
    client.fetchInitialState(deviceConfig).then(initialData => {
      if (active && initialData) {
        console.log('[AirBuddi] Applied initial state from API Gateway');
        applyRealtimePayload(initialData);
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
            applyRealtimePayload(payload);
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
      pendingControlsRef.current.clear();
    };
  }, [deviceConfig, deviceId, dispatch]);

  const sendControlCommand = async (field: string, expectedValue: unknown, command: string) => {
    pendingControlsRef.current.set(field, expectedValue);

    try {
      await postEspCommand(deviceId, command);
    } catch (error) {
      pendingControlsRef.current.delete(field);
      dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      throw error;
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
      await sendControlCommand('power', power, nextPower ? 'power_on' : 'power_off');
    },

    setAutoMode: async (nextAutoMode: boolean) => {
      const mode: DeviceMode = nextAutoMode ? 'auto' : 'manual';
      dispatch(setDeviceMode(mode));
      await sendControlCommand('mode', mode, nextAutoMode ? 'auto_on' : 'auto_off');
    },

    setSleepModeState: async (nextSleepMode: boolean) => {
      dispatch(setSleepMode(nextSleepMode));
      await sendControlCommand('sleepMode', nextSleepMode, nextSleepMode ? 'sleep_on' : 'sleep_off');
    },

    setUvcModeState: async (nextUvc: boolean) => {
      dispatch(setUvcState(nextUvc));
      await sendControlCommand('uvc', nextUvc, nextUvc ? 'uvc_on' : 'uvc_off');
    },

    setFanSpeedState: async (speed: 'off' | '1' | '2' | '3') => {
      dispatch(setFanSpeed(speed));
      await sendControlCommand('fanSpeed', speed, `fan_${speed}`);
    },
    
    setUpperBedChamberStateState: async (nextVal: 'Active' | 'Standby') => {
      const currentVal = nextVal === 'Active' ? 'Standby' : 'Active';
      dispatch(setUpperBedChamberState(nextVal));
      try {
        await sendControlCommand('upperBedChamber', nextVal, nextVal === 'Active' ? 'upper_on' : 'upper_off');
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
        await sendControlCommand('lowerBedChamber', nextVal, nextVal === 'Active' ? 'lower_on' : 'lower_off');
      } catch (error) {
        console.error('[AirBuddi] Lower bed chamber command failed:', error);
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
        // Revert UI if command failed
        dispatch(setLowerBedChamberState(currentVal));
      }
    },

    cycleFanSpeed: async () => {
      dispatch(cycleLocalFanSpeed(undefined));
      await sendControlCommand('fanSpeed', 'cycle', 'fan_cycle');
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
