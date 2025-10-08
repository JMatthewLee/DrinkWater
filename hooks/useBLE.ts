import { useState, useEffect, useCallback } from 'react';
import { BLEDevice, BLEConnectionState, BLEData } from '../types/ble.types';
import BLEManagerService from '../services/BLEManager';

export const useBLE = () => {
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectionState, setConnectionState] = useState<BLEConnectionState>('idle');
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [dataStream, setDataStream] = useState<BLEData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDevicesUpdated = useCallback((updatedDevices: BLEDevice[]) => {
    setDevices(updatedDevices);
  }, []);

  const handleStateChanged = useCallback((state: BLEConnectionState) => {
    setConnectionState(state);
    if (state === 'connected') {
      setConnectedDevice(BLEManagerService.getConnectedDevice());
    } else if (state === 'disconnected' || state === 'idle') {
      setConnectedDevice(null);
    }
  }, []);

  const handleDataReceived = useCallback((data: BLEData) => {
    setDataStream(prev => {
      const newStream = [data, ...prev];
      return newStream.slice(0, 20); // Keep only last 20 messages
    });
  }, []);

  const handleError = useCallback((error: any) => {
    setError(error.message || 'BLE Error occurred');
    console.error('BLE Error:', error);
  }, []);

  const handleDeviceConnected = useCallback((device: any) => {
    setConnectedDevice({
      id: device.id,
      name: device.name || 'Connected Device',
      rssi: device.rssi || 0,
    });
  }, []);

  const handleDeviceDisconnected = useCallback(() => {
    setConnectedDevice(null);
    setDataStream([]);
  }, []);

  useEffect(() => {
    // Set up event listeners
    BLEManagerService.on('devicesUpdated', handleDevicesUpdated);
    BLEManagerService.on('stateChanged', handleStateChanged);
    BLEManagerService.on('dataReceived', handleDataReceived);
    BLEManagerService.on('error', handleError);
    BLEManagerService.on('deviceConnected', handleDeviceConnected);
    BLEManagerService.on('deviceDisconnected', handleDeviceDisconnected);

    // Initialize BLE
    BLEManagerService.initializeBLE().catch((err) => {
      setError(err.message || 'Failed to initialize BLE');
    });

    return () => {
      // Cleanup event listeners
      BLEManagerService.off('devicesUpdated', handleDevicesUpdated);
      BLEManagerService.off('stateChanged', handleStateChanged);
      BLEManagerService.off('dataReceived', handleDataReceived);
      BLEManagerService.off('error', handleError);
      BLEManagerService.off('deviceConnected', handleDeviceConnected);
      BLEManagerService.off('deviceDisconnected', handleDeviceDisconnected);
    };
  }, [
    handleDevicesUpdated,
    handleStateChanged,
    handleDataReceived,
    handleError,
    handleDeviceConnected,
    handleDeviceDisconnected,
  ]);

  const scanForDevices = useCallback(async () => {
    try {
      setError(null);
      setDevices([]);
      await BLEManagerService.startScan();
    } catch (err) {
      setError(err.message || 'Failed to start scanning');
    }
  }, []);

  const connectToDevice = useCallback(async (id: string) => {
    try {
      setError(null);
      await BLEManagerService.connectToDevice(id);
      await BLEManagerService.subscribeToNotifications((data: string) => {
        console.log('Received data:', data);
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to device');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await BLEManagerService.disconnectDevice();
      setDataStream([]);
    } catch (err) {
      setError(err.message || 'Failed to disconnect');
    }
  }, []);

  const sendCommand = useCallback(async (cmd: string) => {
    try {
      setError(null);
      await BLEManagerService.sendCommand(cmd);
    } catch (err) {
      setError(err.message || 'Failed to send command');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearDataStream = useCallback(() => {
    setDataStream([]);
  }, []);

  return {
    devices,
    connectionState,
    connectedDevice,
    dataStream,
    error,
    scanForDevices,
    connectToDevice,
    disconnect,
    sendCommand,
    clearError,
    clearDataStream,
  };
};
