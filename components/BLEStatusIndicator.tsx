import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge, Text } from 'react-native-paper';
import { BLEConnectionState } from '../types/ble.types';

interface BLEStatusIndicatorProps {
  connectionState: BLEConnectionState;
  deviceName?: string | null;
  batteryLevel?: number | null;
}

const BLEStatusIndicator: React.FC<BLEStatusIndicatorProps> = ({
  connectionState,
  deviceName,
  batteryLevel,
}) => {
  const statusConfig = useMemo(() => {
    const getStatusColor = (state: BLEConnectionState): string => {
      switch (state) {
        case 'idle': return '#757575';
        case 'scanning': return '#2196F3';
        case 'connecting': return '#FF9800';
        case 'connected': return '#4CAF50';
        case 'disconnected': return '#F44336';
        default: return '#757575';
      }
    };

    const getStatusText = (state: BLEConnectionState): string => {
      switch (state) {
        case 'idle': return 'Idle';
        case 'scanning': return 'Scanning...';
        case 'connecting': return 'Connecting...';
        case 'connected': {
          const baseText = deviceName ? `Connected to ${deviceName}` : 'Connected';
          return batteryLevel !== null ? `${baseText} (${batteryLevel}%)` : baseText;
        }
        case 'disconnected': return 'Disconnected';
        default: return 'Unknown';
      }
    };

    const getStatusIcon = (state: BLEConnectionState): string => {
      switch (state) {
        case 'idle': return 'bluetooth-off';
        case 'scanning': return 'bluetooth-searching';
        case 'connecting': return 'bluetooth-searching';
        case 'connected': return 'bluetooth-connected';
        case 'disconnected': return 'bluetooth-off';
        default: return 'bluetooth-off';
      }
    };

    return {
      color: getStatusColor(connectionState),
      text: getStatusText(connectionState),
      icon: getStatusIcon(connectionState),
    };
  }, [connectionState, deviceName, batteryLevel]);

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: statusConfig.color }]}>
        <Badge
          icon={statusConfig.icon}
          style={styles.badge}
        >
          <Text style={styles.text}>{statusConfig.text}</Text>
        </Badge>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  indicator: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  badge: {
    backgroundColor: 'transparent',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BLEStatusIndicator;
