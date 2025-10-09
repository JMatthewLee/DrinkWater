/**
 * Offline queue for pending operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog } from '../types/water.types';

export interface OfflineOperation {
  id: string;
  type: 'ADD_LOG' | 'UPDATE_LOG' | 'DELETE_LOG' | 'UPDATE_SETTINGS';
  data: any;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'offline_queue';

/**
 * Add operation to offline queue
 */
export const addToOfflineQueue = async (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    const newOperation: OfflineOperation = {
      ...operation,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(newOperation);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
};

/**
 * Get offline queue
 */
export const getOfflineQueue = async (): Promise<OfflineOperation[]> => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

/**
 * Remove operation from offline queue
 */
export const removeFromOfflineQueue = async (operationId: string): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
};

/**
 * Clear offline queue
 */
export const clearOfflineQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
};

/**
 * Update operation retry count
 */
export const updateOperationRetryCount = async (operationId: string, retryCount: number): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    const updatedQueue = queue.map(op => 
      op.id === operationId ? { ...op, retryCount } : op
    );
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error updating operation retry count:', error);
  }
};

/**
 * Get operations that need to be retried
 */
export const getRetryableOperations = async (): Promise<OfflineOperation[]> => {
  try {
    const queue = await getOfflineQueue();
    return queue.filter(op => op.retryCount < 3); // Max 3 retries
  } catch (error) {
    console.error('Error getting retryable operations:', error);
    return [];
  }
};

/**
 * Merge water logs from server and local
 */
export const mergeWaterLogs = (serverLogs: WaterLog[], localLogs: WaterLog[]): WaterLog[] => {
  const merged = new Map<string, WaterLog>();
  
  // Add server logs first (server wins for conflicts)
  serverLogs.forEach(log => {
    merged.set(log.id, log);
  });
  
  // Add local logs that don't exist on server
  localLogs.forEach(log => {
    if (!merged.has(log.id)) {
      merged.set(log.id, log);
    }
  });
  
  return Array.from(merged.values()).sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
};

/**
 * Resolve conflicts between server and local settings
 */
export const resolveSettingsConflict = (serverSettings: any, localSettings: any): any => {
  // Server wins for most settings, but preserve local changes for certain fields
  return {
    ...serverSettings,
    // Preserve local changes for these fields if they're more recent
    ...(localSettings.lastModified > serverSettings.lastModified ? {
      quickAddAmounts: localSettings.quickAddAmounts,
      unitPreference: localSettings.unitPreference,
    } : {}),
  };
};
