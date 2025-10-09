/**
 * Database service for Supabase operations
 */

import { supabase } from './supabase';
import { WaterLog, UserSettings } from '../types/water.types';
import { Database } from '../types/database.types';

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WaterLogsResult {
  success: boolean;
  logs?: WaterLog[];
  error?: string;
}

export interface ProfileResult {
  success: boolean;
  profile?: UserSettings;
  error?: string;
}

/**
 * Fetch water logs for a date range
 */
export const fetchWaterLogs = async (
  startDate: Date,
  endDate: Date
): Promise<WaterLogsResult> => {
  try {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const logs: WaterLog[] = data.map(log => ({
      id: log.id,
      amountMl: log.amount_ml,
      timestamp: new Date(log.logged_at),
      note: log.note || undefined,
      source: log.source as 'manual' | 'ble',
    }));

    return {
      success: true,
      logs,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch water logs',
    };
  }
};

/**
 * Add a new water log
 */
export const addWaterLog = async (log: Omit<WaterLog, 'id'>): Promise<DatabaseResult<WaterLog>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: user.id,
        amount_ml: log.amountMl,
        logged_at: log.timestamp.toISOString(),
        note: log.note || null,
        source: log.source,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const waterLog: WaterLog = {
      id: data.id,
      amountMl: data.amount_ml,
      timestamp: new Date(data.logged_at),
      note: data.note || undefined,
      source: data.source as 'manual' | 'ble',
    };

    return {
      success: true,
      data: waterLog,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to add water log',
    };
  }
};

/**
 * Update an existing water log
 */
export const updateWaterLog = async (
  id: string,
  updates: Partial<Pick<WaterLog, 'amountMl' | 'note'>>
): Promise<DatabaseResult<WaterLog>> => {
  try {
    const updateData: any = {};
    
    if (updates.amountMl !== undefined) {
      updateData.amount_ml = updates.amountMl;
    }
    
    if (updates.note !== undefined) {
      updateData.note = updates.note || null;
    }

    const { data, error } = await supabase
      .from('water_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const waterLog: WaterLog = {
      id: data.id,
      amountMl: data.amount_ml,
      timestamp: new Date(data.logged_at),
      note: data.note || undefined,
      source: data.source as 'manual' | 'ble',
    };

    return {
      success: true,
      data: waterLog,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update water log',
    };
  }
};

/**
 * Delete a water log
 */
export const deleteWaterLog = async (id: string): Promise<DatabaseResult<void>> => {
  try {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete water log',
    };
  }
};

/**
 * Fetch user profile
 */
export const fetchUserProfile = async (): Promise<ProfileResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const profile: UserSettings = {
      dailyGoalMl: data.daily_goal_ml,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      quickAddAmounts: data.quick_add_amounts,
      unitPreference: data.unit_preference as 'ml' | 'oz' | 'cups',
      notificationsEnabled: data.notifications_enabled,
      reminderTimes: data.reminder_times,
    };

    return {
      success: true,
      profile,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch user profile',
    };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: Partial<UserSettings>): Promise<ProfileResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const updateData: any = {};
    
    if (updates.dailyGoalMl !== undefined) {
      updateData.daily_goal_ml = updates.dailyGoalMl;
    }
    
    if (updates.currentStreak !== undefined) {
      updateData.current_streak = updates.currentStreak;
    }
    
    if (updates.longestStreak !== undefined) {
      updateData.longest_streak = updates.longestStreak;
    }
    
    if (updates.quickAddAmounts !== undefined) {
      updateData.quick_add_amounts = updates.quickAddAmounts;
    }
    
    if (updates.unitPreference !== undefined) {
      updateData.unit_preference = updates.unitPreference;
    }
    
    if (updates.notificationsEnabled !== undefined) {
      updateData.notifications_enabled = updates.notificationsEnabled;
    }
    
    if (updates.reminderTimes !== undefined) {
      updateData.reminder_times = updates.reminderTimes;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const profile: UserSettings = {
      dailyGoalMl: data.daily_goal_ml,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      quickAddAmounts: data.quick_add_amounts,
      unitPreference: data.unit_preference as 'ml' | 'oz' | 'cups',
      notificationsEnabled: data.notifications_enabled,
      reminderTimes: data.reminder_times,
    };

    return {
      success: true,
      profile,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update user profile',
    };
  }
};

/**
 * Subscribe to real-time water logs changes
 */
export const subscribeToWaterLogs = (
  callback: (payload: any) => void
) => {
  return supabase
    .channel('water_logs_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'water_logs',
      },
      callback
    )
    .subscribe();
};

/**
 * Subscribe to real-time profile changes
 */
export const subscribeToProfile = (
  callback: (payload: any) => void
) => {
  return supabase
    .channel('profile_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
      },
      callback
    )
    .subscribe();
};
