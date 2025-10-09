/**
 * AsyncStorage utilities for water tracking data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog, UserSettings, STORAGE_KEYS, DEFAULT_SETTINGS } from '../types/water.types';

/**
 * Serialize WaterLog objects for storage (convert Date to string)
 */
const serializeWaterLogs = (logs: WaterLog[]): string => {
  return JSON.stringify(logs.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString(),
  })));
};

/**
 * Deserialize WaterLog objects from storage (convert string to Date)
 */
const deserializeWaterLogs = (data: string): WaterLog[] => {
  try {
    const parsed = JSON.parse(data);
    return parsed.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error('Error deserializing water logs:', error);
    return [];
  }
};

/**
 * Save water logs to AsyncStorage
 */
export const saveWaterLogs = async (logs: WaterLog[]): Promise<void> => {
  try {
    const serialized = serializeWaterLogs(logs);
    await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, serialized);
  } catch (error) {
    console.error('Error saving water logs:', error);
    throw new Error('Failed to save water logs');
  }
};

/**
 * Load water logs from AsyncStorage
 */
export const loadWaterLogs = async (): Promise<WaterLog[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
    if (!data) {
      return [];
    }
    return deserializeWaterLogs(data);
  } catch (error) {
    console.error('Error loading water logs:', error);
    return [];
  }
};

/**
 * Save user settings to AsyncStorage
 */
export const saveSettings = async (settings: UserSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
};

/**
 * Load user settings from AsyncStorage
 */
export const loadSettings = async (): Promise<UserSettings> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (!data) {
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};
