/**
 * Calculation utilities for water tracking statistics and streaks
 */

import { WaterLog, StreakData, ProgressData } from '../types/water.types';

/**
 * Calculate current and longest streak based on daily goal completion
 */
export const calculateStreak = (logs: WaterLog[], goalMl: number): StreakData => {
  if (logs.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Group logs by date
  const logsByDate = new Map<string, WaterLog[]>();
  logs.forEach(log => {
    const dateKey = log.timestamp.toISOString().split('T')[0];
    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }
    logsByDate.get(dateKey)!.push(log);
  });

  // Calculate daily totals
  const dailyTotals = new Map<string, number>();
  logsByDate.forEach((dayLogs, date) => {
    const total = dayLogs.reduce((sum, log) => sum + log.amountMl, 0);
    dailyTotals.set(date, total);
  });

  // Get all dates and sort them
  const dates = Array.from(dailyTotals.keys()).sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate streaks (going backwards from today)
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = dates.indexOf(today);
  
  if (todayIndex === -1) {
    // No data for today, check if yesterday met goal
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const yesterdayTotal = dailyTotals.get(yesterdayKey) || 0;
    
    if (yesterdayTotal >= goalMl) {
      currentStreak = 1;
    }
  } else {
    // Calculate current streak from today backwards
    for (let i = todayIndex; i >= 0; i--) {
      const date = dates[i];
      const total = dailyTotals.get(date) || 0;
      
      if (total >= goalMl) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  for (const date of dates) {
    const total = dailyTotals.get(date) || 0;
    
    if (total >= goalMl) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { current: currentStreak, longest: longestStreak };
};

/**
 * Get today's progress towards daily goal
 */
export const getTodayProgress = (logs: WaterLog[], goalMl: number): ProgressData => {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => 
    log.timestamp.toISOString().split('T')[0] === today
  );
  
  const current = todayLogs.reduce((sum, log) => sum + log.amountMl, 0);
  const percentage = goalMl > 0 ? Math.round((current / goalMl) * 100) : 0;
  
  return { current, goal: goalMl, percentage };
};

/**
 * Get logs for a specific date
 */
export const getLogsForDate = (logs: WaterLog[], date: Date): WaterLog[] => {
  const dateKey = date.toISOString().split('T')[0];
  return logs.filter(log => 
    log.timestamp.toISOString().split('T')[0] === dateKey
  );
};

/**
 * Get logs for a date range
 */
export const getLogsForDateRange = (logs: WaterLog[], startDate: Date, endDate: Date): WaterLog[] => {
  const startKey = startDate.toISOString().split('T')[0];
  const endKey = endDate.toISOString().split('T')[0];
  
  return logs.filter(log => {
    const logKey = log.timestamp.toISOString().split('T')[0];
    return logKey >= startKey && logKey <= endKey;
  });
};

/**
 * Calculate average consumption over a period
 */
export const getAverageConsumption = (logs: WaterLog[], days: number): number => {
  if (logs.length === 0 || days === 0) return 0;
  
  // Group logs by date
  const logsByDate = new Map<string, WaterLog[]>();
  logs.forEach(log => {
    const dateKey = log.timestamp.toISOString().split('T')[0];
    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }
    logsByDate.get(dateKey)!.push(log);
  });
  
  // Calculate daily totals
  const dailyTotals: number[] = [];
  logsByDate.forEach((dayLogs) => {
    const total = dayLogs.reduce((sum, log) => sum + log.amountMl, 0);
    dailyTotals.push(total);
  });
  
  // Calculate average
  const totalConsumption = dailyTotals.reduce((sum, total) => sum + total, 0);
  return Math.round(totalConsumption / days);
};

/**
 * Convert milliliters to ounces
 */
export const mlToOz = (ml: number): number => {
  return Math.round(ml * 0.033814 * 100) / 100;
};

/**
 * Convert milliliters to cups
 */
export const mlToCups = (ml: number): number => {
  return Math.round(ml * 0.004227 * 100) / 100;
};

/**
 * Format amount based on unit preference
 */
export const formatAmount = (ml: number, unit: 'ml' | 'oz' | 'cups'): string => {
  switch (unit) {
    case 'oz':
      return `${mlToOz(ml)} oz`;
    case 'cups':
      return `${mlToCups(ml)} cups`;
    default:
      return `${ml} ml`;
  }
};

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#10b981'; // green
  if (percentage >= 50) return '#f59e0b'; // amber
  return '#3b82f6'; // blue
};
