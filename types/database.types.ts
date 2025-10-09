/**
 * Supabase database types
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          daily_goal_ml: number;
          current_streak: number;
          longest_streak: number;
          quick_add_amounts: number[];
          unit_preference: string;
          notifications_enabled: boolean;
          reminder_times: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          daily_goal_ml?: number;
          current_streak?: number;
          longest_streak?: number;
          quick_add_amounts?: number[];
          unit_preference?: string;
          notifications_enabled?: boolean;
          reminder_times?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          daily_goal_ml?: number;
          current_streak?: number;
          longest_streak?: number;
          quick_add_amounts?: number[];
          unit_preference?: string;
          notifications_enabled?: boolean;
          reminder_times?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      water_logs: {
        Row: {
          id: string;
          user_id: string;
          amount_ml: number;
          logged_at: string;
          note: string | null;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_ml: number;
          logged_at: string;
          note?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_ml?: number;
          logged_at?: string;
          note?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
