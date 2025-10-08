import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { BLEDevice, BLEConnectionState, BLEData, BLEService, BLECharacteristic } from '../types/ble.types';
import { config } from '../config';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

class BLEManagerService {
  private static instance: BLEManagerService;
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private connectionState: BLEConnectionState = 'idle';
  private devices: BLEDevice[] = [];
  private dataStream: BLEData[] = [];
  private listeners: { [key: string]: Function[] } = {};

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

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  public off(event: string, listener: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  public async initializeBLE(): Promise<void> {
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
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'This app needs Bluetooth and Location permissions to scan for devices.',
          [{ text: 'OK' }]
        );
        throw new Error('Required permissions not granted');
      }
    }
  }

  public async startScan(): Promise<BLEDevice[]> {
    try {
      this.connectionState = 'scanning';
      this.devices = [];
      this.emit('stateChanged', 'scanning');

      this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          this.emit('error', error);
          return;
        }

        if (device) {
          const bleDevice: BLEDevice = {
            id: device.id,
            name: device.name || 'Unknown Device',
            rssi: device.rssi || 0,
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

      return this.devices;
    } catch (error) {
      console.error('Start scan error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async stopScan(): Promise<void> {
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
    try {
      this.connectionState = 'connecting';
      this.emit('stateChanged', 'connecting');

      const device = await this.bleManager.connectToDevice(deviceId);
      this.connectedDevice = device;

      device.onDisconnected((error, device) => {
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
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.service(config.ble.serviceUUID);
      const characteristic = await service.characteristic(config.ble.characteristicUUID);

      characteristic.monitor((error, characteristic) => {
        if (error) {
          console.error('Monitor error:', error);
          this.emit('error', error);
          return;
        }

        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64').toString('utf8');
          const bleData: BLEData = {
            timestamp: new Date(),
            value: data,
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
    } catch (error) {
      console.error('Subscribe error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public async sendCommand(command: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.service(config.ble.serviceUUID);
      const characteristic = await service.characteristic(config.ble.characteristicUUID);

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
    this.bleManager.destroy();
    this.connectedDevice = null;
    this.connectionState = 'idle';
    this.devices = [];
    this.dataStream = [];
    this.listeners = {};
  }

  // Getters
  public getDevices(): BLEDevice[] {
    return [...this.devices];
  }

  public getConnectionState(): BLEConnectionState {
    return this.connectionState;
  }

  public getConnectedDevice(): BLEDevice | null {
    if (this.connectedDevice) {
      return {
        id: this.connectedDevice.id,
        name: this.connectedDevice.name || 'Connected Device',
        rssi: this.connectedDevice.rssi || 0,
      };
    }
    return null;
  }

  public getDataStream(): BLEData[] {
    return [...this.dataStream];
  }
}

export default BLEManagerService.getInstance();
