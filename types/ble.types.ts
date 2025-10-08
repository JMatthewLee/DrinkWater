export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number;
}

export type BLEConnectionState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected';

export interface BLEData {
  timestamp: Date;
  value: string;
}

export interface BLEError {
  code: string;
  message: string;
}

export interface BLEService {
  uuid: string;
  characteristics: BLECharacteristic[];
}

export interface BLECharacteristic {
  uuid: string;
  properties: string[];
  value?: string;
}
