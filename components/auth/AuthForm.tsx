/**
 * Auth Form Component
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, useTheme } from 'react-native-paper';
import PasswordInput from './PasswordInput';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  onSwitchMode?: () => void;
  isLoading?: boolean;
  error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onForgotPassword,
  onSwitchMode,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (mode === 'signup') {
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        return false;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        return false;
      }
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      onSubmit(email, password);
    }
  };

  const isSignUp = mode === 'signup';
  const isFormValid = email && password && (!isSignUp || confirmPassword);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp 
                ? 'Sign up to start tracking your water intake' 
                : 'Sign in to continue tracking your water intake'
              }
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={!!emailError}
              style={styles.input}
            />
            {emailError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}

            <PasswordInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              placeholder="Enter your password"
            />

            {isSignUp && (
              <PasswordInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={confirmPasswordError}
                placeholder="Confirm your password"
              />
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              style={styles.submitButton}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {!isSignUp && onForgotPassword && (
              <Button
                mode="text"
                onPress={onForgotPassword}
                style={styles.forgotButton}
              >
                Forgot Password?
              </Button>
            )}

            {onSwitchMode && (
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <Button
                  mode="text"
                  onPress={onSwitchMode}
                  style={styles.switchButton}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
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
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  forgotButton: {
    marginBottom: 16,
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  switchButton: {
    marginTop: 4,
  },
});

export default AuthForm;
