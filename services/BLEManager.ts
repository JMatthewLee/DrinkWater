import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { BLEDevice, BLEConnectionState, BLEData, BLEService, BLECharacteristic } from '../types/ble.types';
import { config } from '../config';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { parseESP32Data } from '../utils/dataParser';

type EventListener = (...args: unknown[]) => void;

class BLEManagerService {
  private static instance: BLEManagerService;
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private connectionState: BLEConnectionState = 'idle';
  private devices: BLEDevice[] = [];
  private dataStream: BLEData[] = [];
  private listeners: Record<string, EventListener[]> = {};
  private isDestroyed: boolean = false;

  private constructor() {
    this.bleManager = new BleManager();
    this.setupEventListeners();
  }

  public static getInstance(): BLEManagerService {
    if (!BLEManagerService.instance) {
      BLEManagerService.instance = new BLEManagerService();
    }
    return BLEManagerService.instance;
  }

  private setupEventListeners(): void {
    this.bleManager.onStateChange((state: State) => {
      console.log('BLE State changed:', state);
      if (state === 'PoweredOn') {
        this.emit('stateChanged', 'idle');
      } else {
        this.emit('stateChanged', 'disconnected');
      }
    }, true);
  }

  private emit(event: string, data: unknown): void {
    if (this.isDestroyed) return;
    
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public on(event: string, listener: EventListener): void {
    if (this.isDestroyed) return;
    
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  public off(event: string, listener: EventListener): void {
    if (this.isDestroyed) return;
    
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  public async initializeBLE(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('BLE Manager has been destroyed');
    }
    
    try {
      const state = await this.bleManager.state();
      console.log('BLE State:', state);
      
      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not powered on');
      }

      await this.requestPermissions();
      this.emit('initialized', true);
    } catch (error) {
      console.error('BLE Initialization error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'This app needs Bluetooth and Location permissions to scan for devices. Please enable them in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {
                // On Android, we can't directly open app settings, but we can show a helpful message
                Alert.alert(
                  'Enable Permissions',
                  'Please go to Settings > Apps > Expo Go > Permissions and enable Bluetooth and Location permissions.',
                  [{ text: 'OK' }]
                );
              }}
            ]
          );
          throw new Error('Required permissions not granted');
        }
      } catch (error) {
        console.error('Permission request error:', error);
        throw new Error('Failed to request permissions');
      }
    } else if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically by the system
      // We just need to ensure the user grants them when prompted
      console.log('iOS permissions will be requested by the system');
    }
  }

  public async startScan(): Promise<BLEDevice[]> {
    if (this.isDestroyed) {
      throw new Error('BLE Manager has been destroyed');
    }
    
    try {
      this.connectionState = 'scanning';
      this.devices = [];
      this.emit('stateChanged', 'scanning');

      // Platform-specific scan options
      const scanOptions = Platform.OS === 'ios' ? {
        allowDuplicates: false,
        scanMode: 0, // Low power mode for iOS
      } : {
        allowDuplicates: false,
        scanMode: 1, // Balanced mode for Android
      };

      this.bleManager.startDeviceScan(null, scanOptions, (error, device) => {
        if (this.isDestroyed) return;
        
        if (error) {
          console.error('Scan error:', error);
          this.emit('error', error);
          return;
        }

        if (device) {
          const bleDevice: BLEDevice = {
            id: device.id,
            name: device.name ?? 'Unknown Device',
            rssi: device.rssi ?? 0,
          };

          // Check if device already exists and update or add
          const existingIndex = this.devices.findIndex(d => d.id === device.id);
          if (existingIndex >= 0) {
            this.devices[existingIndex] = bleDevice;
          } else {
            this.devices.push(bleDevice);
          }

          // Sort by RSSI (strongest first)
          this.devices.sort((a, b) => b.rssi - a.rssi);
          this.emit('devicesUpdated', [...this.devices]);
        }
      });

      // Auto-stop scan after 30 seconds to prevent battery drain
      setTimeout(() => {
        if (this.connectionState === 'scanning') {
          this.stopScan().catch(console.error);
        }
      }, 30000);

      return this.devices;
    } catch (error) {
      console.error('Start scan error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async stopScan(): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      this.bleManager.stopDeviceScan();
      this.connectionState = 'idle';
      this.emit('stateChanged', 'idle');
    } catch (error) {
      console.error('Stop scan error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async connectToDevice(deviceId: string): Promise<Device> {
    if (this.isDestroyed) {
      throw new Error('BLE Manager has been destroyed');
    }
    
    try {
      this.connectionState = 'connecting';
      this.emit('stateChanged', 'connecting');

      // Platform-specific connection options
      const connectionOptions = Platform.OS === 'ios' ? {
        timeout: 10000, // 10 second timeout for iOS
        autoConnect: false,
      } : {
        timeout: 15000, // 15 second timeout for Android
        autoConnect: false,
      };

      const device = await this.bleManager.connectToDevice(deviceId, connectionOptions);
      this.connectedDevice = device;

      device.onDisconnected((error, device) => {
        if (this.isDestroyed) return;
        
        console.log('Device disconnected:', device?.id);
        this.connectedDevice = null;
        this.connectionState = 'disconnected';
        this.emit('stateChanged', 'disconnected');
        this.emit('deviceDisconnected', device);
      });

      await device.discoverAllServicesAndCharacteristics();
      this.connectionState = 'connected';
      this.emit('stateChanged', 'connected');
      this.emit('deviceConnected', device);

      return device;
    } catch (error) {
      console.error('Connect error:', error);
      this.connectionState = 'disconnected';
      this.emit('stateChanged', 'disconnected');
      this.emit('error', error);
      throw error;
    }
  }

  public async disconnectDevice(): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      if (this.connectedDevice) {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
        this.connectionState = 'disconnected';
        this.emit('stateChanged', 'disconnected');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async discoverServicesAndCharacteristics(device: Device): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      const services = await device.services();
      console.log('Discovered services:', services);
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log(`Service ${service.uuid} characteristics:`, characteristics);
      }
    } catch (error) {
      console.error('Discover services error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async subscribeToNotifications(callback: (data: string) => void): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('BLE Manager has been destroyed');
    }
    
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.service(config.ble.serviceUUID);
      
      // Subscribe to water data notifications
      const waterCharacteristic = await service.characteristic(config.ble.WATER_CHARACTERISTIC_UUID);
      waterCharacteristic.monitor((error, characteristic) => {
        if (this.isDestroyed) return;
        
        if (error) {
          console.error('Water data monitor error:', error);
          this.emit('error', error);
          return;
        }

        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64').toString('utf8');
          const parsed = parseESP32Data(data);
          
          const bleData: BLEData = {
            timestamp: new Date(),
            value: data,
            parsed: parsed ?? undefined,
          };
          
          this.dataStream.unshift(bleData);
          // Keep only last 20 messages
          if (this.dataStream.length > 20) {
            this.dataStream = this.dataStream.slice(0, 20);
          }
          
          this.emit('dataReceived', bleData);
          callback(data);
        }
      });

      // Subscribe to battery level notifications
      const batteryCharacteristic = await service.characteristic(config.ble.BATTERY_CHARACTERISTIC_UUID);
      batteryCharacteristic.monitor((error, characteristic) => {
        if (this.isDestroyed) return;
        
        if (error) {
          console.error('Battery monitor error:', error);
          this.emit('error', error);
          return;
        }

        if (characteristic?.value) {
          const batteryLevel = Buffer.from(characteristic.value, 'base64').toString('utf8');
          console.log('Battery level:', batteryLevel + '%');
          this.emit('batteryLevelReceived', parseInt(batteryLevel, 10));
        }
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async sendCommand(command: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('BLE Manager has been destroyed');
    }
    
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.service(config.ble.serviceUUID);
      const characteristic = await service.characteristic(config.ble.COMMAND_CHARACTERISTIC_UUID);

      const commandBuffer = Buffer.from(command, 'utf8');
      await characteristic.writeWithResponse(commandBuffer.toString('base64'));
      
      console.log('Command sent:', command);
    } catch (error) {
      console.error('Send command error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public cleanup(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    try {
      // Stop any ongoing scans
      this.bleManager.stopDeviceScan();
      
      // Disconnect any connected device
      if (this.connectedDevice) {
        this.connectedDevice.cancelConnection().catch(console.error);
        this.connectedDevice = null;
      }
      
      // Destroy the BLE manager
      this.bleManager.destroy();
      
      // Clear all data
      this.connectionState = 'idle';
      this.devices = [];
      this.dataStream = [];
      this.listeners = {};
      
      console.log('BLE Manager cleaned up successfully');
    } catch (error) {
      console.error('Error during BLE cleanup:', error);
    }
  }

  // Getters
  public getDevices(): BLEDevice[] {
    if (this.isDestroyed) return [];
    return [...this.devices];
  }

  public getConnectionState(): BLEConnectionState {
    if (this.isDestroyed) return 'idle';
    return this.connectionState;
  }

  public getConnectedDevice(): BLEDevice | null {
    if (this.isDestroyed || !this.connectedDevice) return null;
    
    return {
      id: this.connectedDevice.id,
      name: this.connectedDevice.name ?? 'Connected Device',
      rssi: this.connectedDevice.rssi ?? 0,
    };
  }

  public getDataStream(): BLEData[] {
    if (this.isDestroyed) return [];
    return [...this.dataStream];
  }
}

export default BLEManagerService.getInstance();
