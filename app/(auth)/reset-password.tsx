/**
 * Reset Password Screen using Supabase Auth UI
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SupabaseAuth from '../../components/auth/SupabaseAuth';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';

const ResetPasswordScreen: React.FC = () => {
  const { isLoading } = useAuth();

  const handleAuthSuccess = () => {
    console.log('Password reset email sent!');
    // Navigation will be handled by the app layout based on auth state
  };

  const handleAuthError = (error: string) => {
    console.error('Password reset error:', error);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading authentication..." />;
  }

  return (
    <View style={styles.container}>
      <SupabaseAuth
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        view="forgotten_password"
        appearance={{
          theme: 'light',
          colors: {
            primary: '#3b82f6',
            secondary: '#6b7280',
            background: '#ffffff',
            text: '#1f2937',
          },
        }}
        showLinks={true}
        additionalData={{
          app_name: 'Water Tracker',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});

export default ResetPasswordScreen;