/**
 * Water tracking data models and interfaces
 */

export interface WaterLog {
  id: string;
  amountMl: number;
  timestamp: Date;
  note?: string;
  source: 'manual' | 'ble'; // Track if from ESP32 or manual entry
}

export interface UserSettings {
  dailyGoalMl: number;
  currentStreak: number;
  longestStreak: number;
  quickAddAmounts: number[]; // e.g., [250, 500, 1000]
  unitPreference: 'ml' | 'oz' | 'cups';
  notificationsEnabled: boolean;
  reminderTimes: string[]; // e.g., ['09:00', '12:00', '15:00']
}

export interface DayStats {
  date: string; // YYYY-MM-DD format
  totalMl: number;
  goalMl: number;
  percentComplete: number;
  logs: WaterLog[];
}

export interface StreakData {
  current: number;
  longest: number;
}

export interface ProgressData {
  current: number;
  goal: number;
  percentage: number;
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoalMl: 2000,
  currentStreak: 0,
  longestStreak: 0,
  quickAddAmounts: [250, 500, 1000],
  unitPreference: 'ml',
  notificationsEnabled: false,
  reminderTimes: ['09:00', '12:00', '15:00', '18:00'],
};

// Storage keys
export const STORAGE_KEYS = {
  WATER_LOGS: 'water_logs',
  USER_SETTINGS: 'user_settings',
} as const;
