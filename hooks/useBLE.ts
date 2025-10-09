import { useState, useEffect, useCallback, useRef } from 'react';
import { BLEDevice, BLEConnectionState, BLEData } from '../types/ble.types';
import BLEManagerService from '../services/BLEManager';

interface UseBLEReturn {
  devices: BLEDevice[];
  connectionState: BLEConnectionState;
  connectedDevice: BLEDevice | null;
  dataStream: BLEData[];
  batteryLevel: number | null;
  error: string | null;
  scanForDevices: () => Promise<void>;
  connectToDevice: (id: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<void>;
  clearError: () => void;
  clearDataStream: () => void;
}

export const useBLE = (): UseBLEReturn => {
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectionState, setConnectionState] = useState<BLEConnectionState>('idle');
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [dataStream, setDataStream] = useState<BLEData[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Safe state update function that checks if component is still mounted
  const safeSetState = useCallback(<T>(setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: React.SetStateAction<T>) => {
      if (isMountedRef.current) {
        setter(value);
      }
    };
  }, []);

  const handleDevicesUpdated = useCallback((updatedDevices: BLEDevice[]) => {
    if (isMountedRef.current) {
      setDevices(updatedDevices);
    }
  }, []);

  const handleStateChanged = useCallback((state: BLEConnectionState) => {
    if (!isMountedRef.current) return;
    
    setConnectionState(state);
    if (state === 'connected') {
      const device = BLEManagerService.getConnectedDevice();
      if (device) {
        setConnectedDevice(device);
      }
    } else if (state === 'disconnected' || state === 'idle') {
      setConnectedDevice(null);
    }
  }, []);

  const handleDataReceived = useCallback((data: BLEData) => {
    if (!isMountedRef.current) return;
    
    setDataStream(prev => {
      const newStream = [data, ...prev];
      return newStream.slice(0, 20); // Keep only last 20 messages
    });
  }, []);

  const handleError = useCallback((error: unknown) => {
    if (!isMountedRef.current) return;
    
    const errorMessage = error instanceof Error ? error.message : 'BLE Error occurred';
    setError(errorMessage);
    console.error('BLE Error:', error);
  }, []);

  const handleDeviceConnected = useCallback((device: { id: string; name?: string | null; rssi?: number | null }) => {
    if (!isMountedRef.current) return;
    
    setConnectedDevice({
      id: device.id,
      name: device.name ?? 'Connected Device',
      rssi: device.rssi ?? 0,
    });
  }, []);

  const handleDeviceDisconnected = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setConnectedDevice(null);
    setDataStream([]);
    setBatteryLevel(null);
  }, []);

  const handleBatteryLevelReceived = useCallback((level: number) => {
    if (!isMountedRef.current) return;
    
    setBatteryLevel(level);
  }, []);

  useEffect(() => {
    // Set up event listeners
    BLEManagerService.on('devicesUpdated', handleDevicesUpdated);
    BLEManagerService.on('stateChanged', handleStateChanged);
    BLEManagerService.on('dataReceived', handleDataReceived);
    BLEManagerService.on('error', handleError);
    BLEManagerService.on('deviceConnected', handleDeviceConnected);
    BLEManagerService.on('deviceDisconnected', handleDeviceDisconnected);
    BLEManagerService.on('batteryLevelReceived', handleBatteryLevelReceived);

    // Initialize BLE with proper error handling
    const initializeBLE = async (): Promise<void> => {
      try {
        await BLEManagerService.initializeBLE();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize BLE';
        if (isMountedRef.current) {
          setError(errorMessage);
        }
      }
    };

    initializeBLE();

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Cleanup event listeners
      BLEManagerService.off('devicesUpdated', handleDevicesUpdated);
      BLEManagerService.off('stateChanged', handleStateChanged);
      BLEManagerService.off('dataReceived', handleDataReceived);
      BLEManagerService.off('error', handleError);
      BLEManagerService.off('deviceConnected', handleDeviceConnected);
      BLEManagerService.off('deviceDisconnected', handleDeviceDisconnected);
      BLEManagerService.off('batteryLevelReceived', handleBatteryLevelReceived);
    };
  }, [
    handleDevicesUpdated,
    handleStateChanged,
    handleDataReceived,
    handleError,
    handleDeviceConnected,
    handleDeviceDisconnected,
    handleBatteryLevelReceived,
  ]);

  const scanForDevices = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      setDevices([]);
      await BLEManagerService.startScan();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start scanning';
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    }
  }, []);

  const connectToDevice = useCallback(async (id: string): Promise<void> => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      await BLEManagerService.connectToDevice(id);
      
      // Subscribe to notifications after successful connection
      await BLEManagerService.subscribeToNotifications((data: string) => {
        console.log('Received data:', data);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to device';
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      await BLEManagerService.disconnectDevice();
      if (isMountedRef.current) {
        setDataStream([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    }
  }, []);

  const sendCommand = useCallback(async (cmd: string): Promise<void> => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      await BLEManagerService.sendCommand(cmd);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send command';
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    }
  }, []);

  const clearError = useCallback((): void => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  const clearDataStream = useCallback((): void => {
    if (isMountedRef.current) {
      setDataStream([]);
    }
  }, []);

  return {
    devices,
    connectionState,
    connectedDevice,
    dataStream,
    batteryLevel,
    error,
    scanForDevices,
    connectToDevice,
    disconnect,
    sendCommand,
    clearError,
    clearDataStream,
  };
};
