/**
 * Loading Screen Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary}
        style={styles.spinner}
      />
      <Text style={[styles.message, { color: theme.colors.onSurface }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingScreen;
