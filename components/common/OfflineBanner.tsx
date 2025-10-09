/**
 * Offline Banner Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

interface OfflineBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  isVisible, 
  onDismiss 
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>
          You're offline. Changes will sync when you're back online.
        </Text>
        {onDismiss && (
          <IconButton
            icon="close"
            size={16}
            iconColor="#ffffff"
            onPress={onDismiss}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default OfflineBanner;
