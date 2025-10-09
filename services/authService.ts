/**
 * Authentication service for Supabase
 */

import { supabase } from './supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<AuthResult> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    // Check if user needs email confirmation
    if (authData.user && !authData.session) {
      return {
        success: true,
        user: authData.user,
        // No session means email confirmation required
        error: 'Please check your email and confirm your account',
      };
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign up',
    };
  }
};

/**
 * Sign in with GitHub OAuth
 */
export const signInWithGitHub = async (): Promise<AuthResult> => {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'exp',
      path: 'auth/callback',
    });

    console.log('Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    if (data.url) {
      console.log('Opening OAuth URL:', data.url);
      
      // Open the OAuth URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: true,
        }
      );

      console.log('OAuth result:', result);

      if (result.type === 'success' && result.url) {
        console.log('OAuth success, processing URL:', result.url);
        
        // Extract the session from the URL
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken) {
          console.log('Found access token, setting session...');
          
          // Set the session
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            return {
              success: false,
              error: 'Failed to establish session',
            };
          }

          console.log('Session established successfully');
          return {
            success: true,
            user: sessionData.user,
            session: sessionData.session,
          };
        }
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Authentication was cancelled',
        };
      } else if (result.type === 'dismiss') {
        return {
          success: false,
          error: 'Authentication was dismissed',
        };
      }

      return {
        success: false,
        error: 'Authentication failed. Please check your GitHub OAuth configuration.',
      };
    }

    return {
      success: false,
      error: 'No OAuth URL received',
    };
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during GitHub sign in',
    };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (data: SignInData): Promise<AuthResult> => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign in',
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign out',
    };
  }
};

/**
 * Reset password for a user
 */
export const resetPassword = async (data: ResetPasswordData): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL || 'exp://localhost:8081'}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while resetting password',
    };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (data: UpdatePasswordData): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while updating password',
    };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(
      (await getCurrentUser())?.id || ''
    );

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while deleting account',
    };
  }
};

/**
 * Convert Supabase auth errors to user-friendly messages
 */
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password';
    case 'Email not confirmed':
      return 'Please check your email and confirm your account before signing in';
    case 'User already registered':
      return 'An account with this email already exists';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long';
    case 'Unable to validate email address: invalid format':
      return 'Please enter a valid email address';
    case 'Signup is disabled':
      return 'Account creation is currently disabled';
    case 'Email rate limit exceeded':
      return 'Too many requests. Please try again later';
    case 'Password reset email rate limit exceeded':
      return 'Too many password reset requests. Please try again later';
    default:
      return error.message || 'An authentication error occurred';
  }
};
