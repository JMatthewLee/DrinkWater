/**
 * Water Tracking Context Provider with Supabase Integration
 * Global state management for water tracking data with cloud sync
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { WaterLog, UserSettings, DEFAULT_SETTINGS } from '../types/water.types';
import { saveWaterLogs, loadWaterLogs, saveSettings, loadSettings } from '../utils/storage';
import { calculateStreak } from '../utils/calculations';
import * as databaseService from '../services/databaseService';
import { addToOfflineQueue, getOfflineQueue, clearOfflineQueue } from '../utils/offlineQueue';
import { useAuth } from './AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
// Removed useSupabaseSync import to avoid circular dependency

// Context state interface
interface WaterTrackingState {
  logs: WaterLog[];
  settings: UserSettings;
  selectedDate: Date;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

// Context actions interface
interface WaterTrackingContextType extends WaterTrackingState {
  // Log actions
  addWaterLog: (amount: number, note?: string, source?: 'manual' | 'ble') => void;
  updateWaterLog: (id: string, amount: number, note?: string) => void;
  deleteWaterLog: (id: string) => void;
  
  // Settings actions
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Date actions
  setSelectedDate: (date: Date) => void;
  
  // Utility actions
  clearError: () => void;
  refreshData: () => Promise<void>;
  syncData: () => Promise<void>;
}

// Action types
type WaterTrackingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOGS'; payload: WaterLog[] }
  | { type: 'ADD_LOG'; payload: WaterLog }
  | { type: 'UPDATE_LOG'; payload: { id: string; amount: number; note?: string } }
  | { type: 'DELETE_LOG'; payload: string }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_LAST_SYNC'; payload: Date | null }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: WaterTrackingState = {
  logs: [],
  settings: DEFAULT_SETTINGS,
  selectedDate: new Date(),
  isLoading: true,
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

// Reducer function
const waterTrackingReducer = (state: WaterTrackingState, action: WaterTrackingAction): WaterTrackingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_LOGS':
      return { ...state, logs: action.payload, isLoading: false };
    
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    
    case 'UPDATE_LOG':
      return {
        ...state,
        logs: state.logs.map(log =>
          log.id === action.payload.id
            ? { ...log, amountMl: action.payload.amount, ...(action.payload.note && { note: action.payload.note }) }
            : log
        ),
      };
    
    case 'DELETE_LOG':
      return {
        ...state,
        logs: state.logs.filter(log => log.id !== action.payload),
      };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Create context
const WaterTrackingContext = createContext<WaterTrackingContextType | undefined>(undefined);

// Provider component
interface WaterTrackingProviderProps {
  children: ReactNode;
}

export const WaterTrackingProvider: React.FC<WaterTrackingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(waterTrackingReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  // Initialize real-time sync (moved to separate effect to avoid circular dependency)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to water logs changes
    const waterLogsSubscription = databaseService.subscribeToWaterLogs((payload: any) => {
      console.log('Water log change received:', payload);
      
      if (!payload.new && !payload.old) return;
      
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
            const waterLog: WaterLog = {
              id: newRecord.id,
              amountMl: newRecord.amount_ml,
              timestamp: new Date(newRecord.logged_at),
              note: newRecord.note || undefined,
              source: newRecord.source as 'manual' | 'ble',
            };
            // Only add if not already in local state (avoid duplicates)
            const exists = state.logs.some(log => log.id === waterLog.id);
            if (!exists) {
              dispatch({ type: 'ADD_LOG', payload: waterLog });
            }
          }
          break;
          
        case 'UPDATE':
          if (newRecord) {
            dispatch({ 
              type: 'UPDATE_LOG', 
              payload: { 
                id: newRecord.id, 
                amount: newRecord.amount_ml, 
                note: newRecord.note 
              } 
            });
          }
          break;
          
        case 'DELETE':
          if (oldRecord) {
            dispatch({ type: 'DELETE_LOG', payload: oldRecord.id });
          }
          break;
      }
    });
    
    // Subscribe to profile changes
    const profileSubscription = databaseService.subscribeToProfile((payload: any) => {
      console.log('Profile change received:', payload);
      
      if (!payload.new) return;
      
      const { eventType, new: newRecord } = payload;
      
      if (eventType === 'UPDATE' && newRecord) {
        const updatedSettings: Partial<UserSettings> = {
          dailyGoalMl: newRecord.daily_goal_ml,
          currentStreak: newRecord.current_streak,
          longestStreak: newRecord.longest_streak,
          quickAddAmounts: newRecord.quick_add_amounts,
          unitPreference: newRecord.unit_preference as 'ml' | 'oz' | 'cups',
          notificationsEnabled: newRecord.notifications_enabled,
          reminderTimes: newRecord.reminder_times,
        };
        
        dispatch({ type: 'UPDATE_SETTINGS', payload: updatedSettings });
      }
    });

    return () => {
      waterLogsSubscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [isAuthenticated, state.logs]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [isAuthenticated]);

  // Update streaks when logs or settings change
  useEffect(() => {
    if (state.logs.length > 0) {
      const streakData = calculateStreak(state.logs, state.settings.dailyGoalMl);
      if (streakData.current !== state.settings.currentStreak || 
          streakData.longest !== state.settings.longestStreak) {
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            currentStreak: streakData.current,
            longestStreak: streakData.longest,
          },
        });
      }
    }
  }, [state.logs, state.settings.dailyGoalMl]);

  // Save logs to local storage whenever logs change
  useEffect(() => {
    if (!state.isLoading && state.logs.length >= 0) {
      saveWaterLogs(state.logs).catch(error => {
        console.error('Failed to save logs locally:', error);
      });
    }
  }, [state.logs, state.isLoading]);

  // Save settings to local storage whenever settings change
  useEffect(() => {
    if (!state.isLoading) {
      saveSettings(state.settings).catch(error => {
        console.error('Failed to save settings locally:', error);
      });
    }
  }, [state.settings, state.isLoading]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && isAuthenticated && state.lastSyncTime) {
      syncData();
    }
  }, [isOnline, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (isAuthenticated) {
        // Load from Supabase
        await loadFromSupabase();
      } else {
        // Load from local storage
        const [logs, settings] = await Promise.all([
          loadWaterLogs(),
          loadSettings(),
        ]);
        
        dispatch({ type: 'SET_LOGS', payload: logs });
        dispatch({ type: 'SET_SETTINGS', payload: settings });
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    }
  };

  const loadFromSupabase = async () => {
    try {
      // Load profile
      const profileResult = await databaseService.fetchUserProfile();
      if (profileResult.success && profileResult.profile) {
        dispatch({ type: 'SET_SETTINGS', payload: profileResult.profile });
      }

      // Load recent logs (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const logsResult = await databaseService.fetchWaterLogs(startDate, endDate);
      if (logsResult.success && logsResult.logs) {
        dispatch({ type: 'SET_LOGS', payload: logsResult.logs });
      }

      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Failed to load from Supabase:', error);
      // Fallback to local storage
      const [logs, settings] = await Promise.all([
        loadWaterLogs(),
        loadSettings(),
      ]);
      
      dispatch({ type: 'SET_LOGS', payload: logs });
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    }
  };

  const addWaterLog = async (amount: number, note?: string, source: 'manual' | 'ble' = 'manual') => {
    const newLog: WaterLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      amountMl: amount,
      timestamp: new Date(),
      ...(note && { note }),
      source,
    };
    
    // Add to local state immediately
    dispatch({ type: 'ADD_LOG', payload: newLog });
    
    if (isAuthenticated && isOnline) {
      // Try to sync to Supabase
      try {
        const result = await databaseService.addWaterLog(newLog);
        if (result.success && result.data) {
          // Update with server-generated ID
          dispatch({ type: 'UPDATE_LOG', payload: { 
            id: newLog.id, 
            amount: result.data.amountMl, 
            ...(result.data.note && { note: result.data.note })
          }});
        }
      } catch (error) {
        console.error('Failed to sync log to Supabase:', error);
        // Add to offline queue
        await addToOfflineQueue({
          type: 'ADD_LOG',
          data: newLog,
        });
      }
    } else if (isAuthenticated) {
      // Add to offline queue
      await addToOfflineQueue({
        type: 'ADD_LOG',
        data: newLog,
      });
    }
  };

  const updateWaterLog = async (id: string, amount: number, note?: string) => {
    // Update local state immediately
    dispatch({ type: 'UPDATE_LOG', payload: { id, amount, ...(note && { note }) } });
    
    if (isAuthenticated && isOnline) {
      // Try to sync to Supabase
      try {
        await databaseService.updateWaterLog(id, { amountMl: amount, ...(note && { note }) });
      } catch (error) {
        console.error('Failed to sync log update to Supabase:', error);
        // Add to offline queue
        await addToOfflineQueue({
          type: 'UPDATE_LOG',
          data: { id, amount, note },
        });
      }
    } else if (isAuthenticated) {
      // Add to offline queue
      await addToOfflineQueue({
        type: 'UPDATE_LOG',
        data: { id, amount, note },
      });
    }
  };

  const deleteWaterLog = async (id: string) => {
    // Update local state immediately
    dispatch({ type: 'DELETE_LOG', payload: id });
    
    if (isAuthenticated && isOnline) {
      // Try to sync to Supabase
      try {
        await databaseService.deleteWaterLog(id);
      } catch (error) {
        console.error('Failed to sync log deletion to Supabase:', error);
        // Add to offline queue
        await addToOfflineQueue({
          type: 'DELETE_LOG',
          data: { id },
        });
      }
    } else if (isAuthenticated) {
      // Add to offline queue
      await addToOfflineQueue({
        type: 'DELETE_LOG',
        data: { id },
      });
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    // Update local state immediately
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    
    if (isAuthenticated && isOnline) {
      // Try to sync to Supabase
      try {
        await databaseService.updateUserProfile(newSettings);
      } catch (error) {
        console.error('Failed to sync settings to Supabase:', error);
        // Add to offline queue
        await addToOfflineQueue({
          type: 'UPDATE_SETTINGS',
          data: newSettings,
        });
      }
    } else if (isAuthenticated) {
      // Add to offline queue
      await addToOfflineQueue({
        type: 'UPDATE_SETTINGS',
        data: newSettings,
      });
    }
  };

  const setSelectedDate = (date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const syncData = async () => {
    if (!isAuthenticated || !isOnline) return;

    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      // Process offline queue
      const offlineQueue = await getOfflineQueue();
      for (const operation of offlineQueue) {
        try {
          switch (operation.type) {
            case 'ADD_LOG':
              await databaseService.addWaterLog(operation.data);
              break;
            case 'UPDATE_LOG':
              await databaseService.updateWaterLog(operation.data.id, {
                amountMl: operation.data.amount,
                note: operation.data.note,
              });
              break;
            case 'DELETE_LOG':
              await databaseService.deleteWaterLog(operation.data.id);
              break;
            case 'UPDATE_SETTINGS':
              await databaseService.updateUserProfile(operation.data);
              break;
          }
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);
        }
      }
      
      // Clear offline queue
      await clearOfflineQueue();
      
      // Refresh data from server
      await loadFromSupabase();
      
    } catch (error) {
      console.error('Failed to sync data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync data' });
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const contextValue: WaterTrackingContextType = {
    ...state,
    addWaterLog,
    updateWaterLog,
    deleteWaterLog,
    updateSettings,
    setSelectedDate,
    clearError,
    refreshData,
    syncData,
  };

  return (
    <WaterTrackingContext.Provider value={contextValue}>
      {children}
    </WaterTrackingContext.Provider>
  );
};

// Custom hook to use the context
export const useWaterTracking = (): WaterTrackingContextType => {
  const context = useContext(WaterTrackingContext);
  if (context === undefined) {
    throw new Error('useWaterTracking must be used within a WaterTrackingProvider');
  }
  return context;
};
