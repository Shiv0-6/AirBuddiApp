import { useEffect, useRef } from 'react';

import { awsIotConfig } from '../../config/awsIotConfig';
import { useAppDispatch } from '../../store/hooks';
import { AwsIotClient } from '../../services/awsIot/awsIotClient';
import type { DashboardCommandMessage, DashboardTelemetryMessage } from '../../services/awsIot/awsIotTypes';
import type { ConnectionState, DeviceMode, PowerState } from './dashboardTypes';
import {
  applyTelemetry,
  setConnectionState,
  setDeviceMode,
  setDevicePower,
  setErrorMessage,
} from './dashboardSlice';

export function useDashboardRealtimeBridge() {
  const dispatch = useAppDispatch();
  const clientRef = useRef<AwsIotClient | null>(null);

  useEffect(() => {
    const client = new AwsIotClient();
    clientRef.current = client;

    if (!awsIotConfig.enabled) {
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
        onTelemetry: (_topic: string, payload: DashboardTelemetryMessage) => {
          if (active) {
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
        await clientRef.current?.publishCommand(awsIotConfig.topics.command, command);
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
        await clientRef.current?.publishCommand(awsIotConfig.topics.command, command);
      } catch (error) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
    cycleFanSpeed: async () => {
      const command: DashboardCommandMessage = {
        type: 'fanSpeed',
        value: 'cycle',
        timestamp: new Date().toISOString(),
      };

      try {
        await clientRef.current?.publishCommand(awsIotConfig.topics.command, command);
      } catch (error) {
        dispatch(setErrorMessage(error instanceof Error ? error.message : String(error)));
      }
    },
  };
}
