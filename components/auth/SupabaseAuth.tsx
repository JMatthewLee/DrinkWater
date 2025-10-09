/**
 * Supabase Auth UI Component for React Native
 * A comprehensive authentication component with modern UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Divider,
  useTheme,
  ActivityIndicator,
  IconButton,
  Surface,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { AuthError } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

export interface SupabaseAuthProps {
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  appearance?: {
    theme?: 'light' | 'dark' | 'auto';
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
    };
  };
  providers?: ('google' | 'github' | 'apple' | 'facebook' | 'twitter')[];
  view?: 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password';
  redirectTo?: string;
  showLinks?: boolean;
  additionalData?: Record<string, any>;
}

type AuthView = 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password';

const SupabaseAuth: React.FC<SupabaseAuthProps> = ({
  onAuthSuccess,
  onAuthError,
  appearance = { theme: 'light' },
  providers = ['google', 'github'],
  view: initialView = 'sign_in',
  redirectTo,
  showLinks = true,
  additionalData = {},
}) => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Clear messages when view changes
  useEffect(() => {
    setError(null);
    setMessage(null);
  }, [currentView]);

  const handleError = (error: AuthError | Error) => {
    const errorMessage = error.message || 'An unexpected error occurred';
    setError(errorMessage);
    onAuthError?.(errorMessage);
  };

  const handleSuccess = (message?: string) => {
    setMessage(message || 'Success!');
    setError(null);
    onAuthSuccess?.();
  };

  const signInWithEmail = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      handleSuccess('Signed in successfully!');
    } catch (error) {
      handleError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: additionalData,
          ...(redirectTo && { emailRedirectTo: redirectTo }),
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        handleSuccess('Check your email for the confirmation link!');
      } else {
        handleSuccess('Account created successfully!');
      }
    } catch (error) {
      handleError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        ...(redirectTo && { redirectTo }),
      });

      if (error) throw error;

      handleSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      handleError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          ...(redirectTo && { redirectTo }),
        },
      });

      if (error) throw error;

      // OAuth will redirect, so we don't need to handle success here
    } catch (error) {
      handleError(error as AuthError);
      setLoading(false);
    }
  };

  const renderProviderButton = (provider: string) => {
    const providerConfig = {
      google: { name: 'Google', icon: 'g-translate', color: '#4285F4' },
      github: { name: 'GitHub', icon: 'code', color: '#333' },
      apple: { name: 'Apple', icon: 'phone-iphone', color: '#000' },
      facebook: { name: 'Facebook', icon: 'facebook', color: '#1877F2' },
      twitter: { name: 'Twitter', icon: 'alternate-email', color: '#1DA1F2' },
    };

    const config = providerConfig[provider as keyof typeof providerConfig];
    if (!config) return null;

    return (
      <Button
        key={provider}
        mode="outlined"
        onPress={() => signInWithProvider(provider)}
        disabled={loading}
        style={[styles.providerButton, { borderColor: config.color }]}
        icon={() => (
          <MaterialIcons name={config.icon as any} size={20} color={config.color} />
        )}
      >
        Continue with {config.name}
      </Button>
    );
  };

  const renderForm = () => {
    switch (currentView) {
      case 'sign_in':
        return (
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              disabled={loading}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              style={styles.input}
              disabled={loading}
            />
            <Button
              mode="contained"
              onPress={signInWithEmail}
              disabled={loading || !email || !password}
              style={styles.submitButton}
              loading={loading}
            >
              Sign In
            </Button>
            {showLinks && (
              <View style={styles.links}>
                <Button
                  mode="text"
                  onPress={() => setCurrentView('forgotten_password')}
                  disabled={loading}
                >
                  Forgot Password?
                </Button>
                <Button
                  mode="text"
                  onPress={() => setCurrentView('sign_up')}
                  disabled={loading}
                >
                  Don't have an account? Sign Up
                </Button>
              </View>
            )}
          </View>
        );

      case 'sign_up':
        return (
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              disabled={loading}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              style={styles.input}
              disabled={loading}
            />
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              style={styles.input}
              disabled={loading}
            />
            <Button
              mode="contained"
              onPress={signUpWithEmail}
              disabled={loading || !email || !password || !confirmPassword}
              style={styles.submitButton}
              loading={loading}
            >
              Sign Up
            </Button>
            {showLinks && (
              <View style={styles.links}>
                <Button
                  mode="text"
                  onPress={() => setCurrentView('sign_in')}
                  disabled={loading}
                >
                  Already have an account? Sign In
                </Button>
              </View>
            )}
          </View>
        );

      case 'forgotten_password':
        return (
          <View style={styles.form}>
            <Text style={styles.description}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              disabled={loading}
            />
            <Button
              mode="contained"
              onPress={resetPassword}
              disabled={loading || !email}
              style={styles.submitButton}
              loading={loading}
            >
              Send Reset Link
            </Button>
            {showLinks && (
              <View style={styles.links}>
                <Button
                  mode="text"
                  onPress={() => setCurrentView('sign_in')}
                  disabled={loading}
                >
                  Back to Sign In
                </Button>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'sign_in':
        return 'Welcome Back';
      case 'sign_up':
        return 'Create Account';
      case 'forgotten_password':
        return 'Reset Password';
      default:
        return 'Authentication';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'sign_in':
        return 'Sign in to your account';
      case 'sign_up':
        return 'Create a new account';
      case 'forgotten_password':
        return 'Reset your password';
      default:
        return '';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.card} elevation={4}>
          <View style={styles.header}>
            <MaterialIcons name="water-drop" size={48} color={theme.colors.primary} />
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>

          {error && (
            <Surface style={styles.errorCard} elevation={2}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          )}

          {message && (
            <Surface style={styles.messageCard} elevation={2}>
              <Text style={styles.messageText}>{message}</Text>
            </Surface>
          )}

          {providers.length > 0 && currentView !== 'forgotten_password' && (
            <>
              <View style={styles.providers}>
                {providers.map(renderProviderButton)}
              </View>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
            </>
          )}

          {renderForm()}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  messageText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
  },
  providers: {
    marginBottom: 16,
  },
  providerButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
  dividerText: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  form: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  submitButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  links: {
    alignItems: 'center',
  },
});

export default SupabaseAuth;
