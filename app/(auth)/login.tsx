/**
 * Login Screen using Supabase Auth UI
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SupabaseAuth from '../../components/auth/SupabaseAuth';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';

const LoginScreen: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('LoginScreen - User already authenticated, redirecting to home');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleAuthSuccess = () => {
    console.log('Authentication successful!');
    // Navigate to home page after successful authentication
    router.replace('/(tabs)');
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading authentication..." />;
  }

  return (
    <View style={styles.container}>
      <SupabaseAuth
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        view="sign_in"
        providers={['google', 'github']}
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

export default LoginScreen;
