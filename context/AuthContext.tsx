/**
 * Authentication Context Provider
 * Global state management for authentication using Supabase
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Auth state interface
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    
    case 'SET_SESSION':
      return { 
        ...state, 
        session: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload,
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email);
        
        dispatch({ type: 'SET_SESSION', payload: session });
        dispatch({ type: 'SET_USER', payload: session?.user || null });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        console.log('AuthContext - Current state before update:', { 
          isAuthenticated: !!state.user, 
          isLoading: state.isLoading,
          hasUser: !!state.user 
        });
        
        dispatch({ type: 'SET_SESSION', payload: session });
        dispatch({ type: 'SET_USER', payload: session?.user || null });
        
        // Set loading to false after auth state change
        dispatch({ type: 'SET_LOADING', payload: false });
        
        console.log('AuthContext - State after update:', { 
          isAuthenticated: !!session?.user, 
          isLoading: false,
          hasUser: !!session?.user 
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
      
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_SESSION', payload: null });
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign out' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
