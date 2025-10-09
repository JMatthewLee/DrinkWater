export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number;
}

export type BLEConnectionState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected';

export interface BLEData {
  timestamp: Date;
  value: string;
  parsed?: import('../utils/dataParser').ParsedData;
}

export interface BLEError {
  code: string;
  message: string;
  details?: unknown;
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

// Event types for better type safety
export type BLEEventMap = {
  devicesUpdated: BLEDevice[];
  stateChanged: BLEConnectionState;
  dataReceived: BLEData;
  error: BLEError | Error;
  deviceConnected: { id: string; name?: string | null; rssi?: number | null };
  deviceDisconnected: { id?: string; name?: string | null } | null;
  batteryLevelReceived: number;
  initialized: boolean;
};
