import { useState, useCallback } from 'react';

// Mock BLE hook for Expo Go testing
export const useBLE = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [connectionState, setConnectionState] = useState<'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [dataStream, setDataStream] = useState<string[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const scanForDevices = useCallback(async () => {
    setConnectionState('scanning');
    setError(null);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock devices
    const mockDevices = [
      { id: 'mock-device-1', name: 'ESP32 Water Tracker', rssi: -45 },
      { id: 'mock-device-2', name: 'Arduino Sensor', rssi: -67 },
    ];
    
    setDevices(mockDevices);
    setConnectionState('idle');
  }, []);

  const connectToDevice = useCallback(async (deviceId: string) => {
    setConnectionState('connecting');
    setError(null);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setConnectedDevice(device);
      setConnectionState('connected');
      setBatteryLevel(85);
      
      // Simulate data stream
      const interval = setInterval(() => {
        const timestamp = new Date();
        const waterLevel = Math.floor(Math.random() * 100);
        const newData = {
          timestamp,
          value: `Water Level: ${waterLevel}%`,
          parsed: {
            type: 'water_data' as const,
            milliliters: waterLevel * 10, // Convert percentage to milliliters (assuming 100% = 1000ml)
            timestamp: timestamp.getTime(), // Use timestamp as number
          }
        };
        setDataStream(prev => [...prev.slice(-9), newData]);
      }, 3000);
      
      // Store interval for cleanup
      (device as any).dataInterval = interval;
    } else {
      setError('Device not found');
      setConnectionState('idle');
    }
  }, [devices]);

  const disconnect = useCallback(async () => {
    if (connectedDevice && (connectedDevice as any).dataInterval) {
      clearInterval((connectedDevice as any).dataInterval);
    }
    
    setConnectedDevice(null);
    setConnectionState('disconnected');
    setDataStream([]);
    setBatteryLevel(0);
  }, [connectedDevice]);

  const sendCommand = useCallback(async (command: string) => {
    if (connectionState !== 'connected') return;
    
    const timestamp = new Date();
    const response = {
      timestamp,
      value: `Command "${command}" sent successfully`,
      parsed: {
        type: 'status' as const,
        status: 'OK',
        battery: 85,
        mode: 'SIM',
      }
    };
    setDataStream(prev => [...prev.slice(-9), response]);
  }, [connectionState]);

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
