import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert, NativeModules } from 'react-native';

type BLEConnectionState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected';

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number;
}

interface UseBLEOptions {
  onWaterMl?: (milliliters: number) => void;
  serviceUUID: string;
  waterCharacteristicUUID: string;
}

interface UseBLEReturn {
  devices: BLEDevice[];
  connectionState: BLEConnectionState;
  connectedDevice: BLEDevice | null;
  error: string | null;
  scanForDevices: () => Promise<void>;
  connectToDevice: (id: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

function base64DecodeUtf8(b64: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Buf: any = (global as unknown as { Buffer?: any }).Buffer;
    if (Buf) {
      return Buf.from(b64, 'base64').toString('utf8');
    }
  } catch {}

  try {
    // @ts-ignore - atob may exist at runtime
    const binary = globalThis.atob ? globalThis.atob(b64) : '';
    return decodeURIComponent(
      binary
        .split('')
        .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return '';
  }
}

function tryParseMlFromMessage(message: string): number | null {
  if (!message) return null;
  const mlMatch = message.match(/ML:(\d+)/);
  if (mlMatch && mlMatch[1]) {
    const ml = parseInt(mlMatch[1], 10);
    if (!Number.isNaN(ml) && ml > 0) return ml;
  }
  return null;
}

export function useBLE(options: UseBLEOptions): UseBLEReturn {
  const { onWaterMl, serviceUUID, waterCharacteristicUUID } = options;

  const managerRef = useRef<BleManager | null>(null);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectionState, setConnectionState] = useState<BLEConnectionState>('idle');
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    // Guard: react-native-ble-plx requires a native module that is NOT present in Expo Go.
    // On unsupported environments, surface a helpful error and do not instantiate BleManager.
    const hasNativeBLE = Boolean((NativeModules as unknown as { BleClientManager?: unknown }).BleClientManager);
    if (!hasNativeBLE) {
      setError('Bluetooth not available in this build. Install a Development Build (expo-dev-client) to use BLE.');
      return () => {
        isMountedRef.current = false;
      };
    }

    managerRef.current = new BleManager();
    const sub = managerRef.current.onStateChange((state: State) => {
      if (!isMountedRef.current) return;
      if (state === 'PoweredOn') setConnectionState('idle');
      else setConnectionState('disconnected');
    }, true);

    return () => {
      isMountedRef.current = false;
      sub.remove();
      try {
        managerRef.current?.stopDeviceScan();
      } catch {}
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
      await PermissionsAndroid.requestMultiple(permissions);
    } catch (e) {
      setError('Failed to request Bluetooth permissions');
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    if (!managerRef.current) return;
    setError(null);
    setDevices([]);
    setConnectionState('scanning');
    await requestPermissions();

    try {
      managerRef.current.startDeviceScan([serviceUUID], { allowDuplicates: false }, (err, device) => {
        if (!isMountedRef.current) return;
        if (err) {
          setError(err.message);
          setConnectionState('idle');
          return;
        }
        if (device) {
          setDevices(prev => {
            const simple: BLEDevice = {
              id: device.id,
              name: device.name ?? 'Unknown Device',
              rssi: device.rssi ?? 0,
            };
            const next = [...prev];
            const idx = next.findIndex(d => d.id === simple.id);
            if (idx >= 0) next[idx] = simple; else next.push(simple);
            next.sort((a, b) => (b.rssi || 0) - (a.rssi || 0));
            return next;
          });
        }
      });
      setTimeout(() => {
        try { managerRef.current?.stopDeviceScan(); } catch {}
        if (isMountedRef.current) setConnectionState('idle');
      }, 10000);
    } catch (e: any) {
      setError(e?.message || 'Failed to start scanning');
      setConnectionState('idle');
    }
  }, [requestPermissions]);

  const connectToDevice = useCallback(async (id: string) => {
    if (!managerRef.current) return;
    setError(null);
    setConnectionState('connecting');
    try {
      const device = await managerRef.current.connectToDevice(id, { autoConnect: false, timeout: 15000 });
      await device.discoverAllServicesAndCharacteristics();

      if (!isMountedRef.current) return;
      setConnectedDevice({ id: device.id, name: device.name ?? 'Device', rssi: device.rssi ?? 0 });
      setConnectionState('connected');

      // Find the matching service and characteristic
      const services = await device.services();
      const targetService = services.find(s => (s.uuid || '').toLowerCase() === serviceUUID.toLowerCase());
      if (!targetService) {
        throw new Error('Required BLE service not found');
      }
      const characteristics = await targetService.characteristics();
      const targetChar = characteristics.find(c => (c.uuid || '').toLowerCase() === waterCharacteristicUUID.toLowerCase());
      if (!targetChar) {
        throw new Error('Required BLE characteristic not found');
      }

      targetChar.monitor((err: Error | null, characteristic: Characteristic | null) => {
        if (!isMountedRef.current) return;
        if (err) {
          setError(err.message);
          return;
        }
        const value = characteristic?.value;
        if (!value) return;
        const text = base64DecodeUtf8(value);
        const ml = tryParseMlFromMessage(text);
        if (ml && onWaterMl) {
          onWaterMl(ml);
        }
      });

      device.onDisconnected(() => {
        if (!isMountedRef.current) return;
        setConnectionState('disconnected');
        setConnectedDevice(null);
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to connect');
      setConnectionState('disconnected');
    }
  }, [onWaterMl, serviceUUID, waterCharacteristicUUID]);

  const disconnect = useCallback(async () => {
    if (!managerRef.current) return;
    try {
      const id = connectedDevice?.id;
      if (id) {
        const device = await managerRef.current.devices([id]);
        if (device && device[0]) {
          await device[0].cancelConnection();
        }
      }
    } catch (e) {
      // ignore
    } finally {
      if (isMountedRef.current) {
        setConnectedDevice(null);
        setConnectionState('disconnected');
      }
    }
  }, [connectedDevice]);

  return {
    devices,
    connectionState,
    connectedDevice,
    error,
    scanForDevices,
    connectToDevice,
    disconnect,
  };
}


