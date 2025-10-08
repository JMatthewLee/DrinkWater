import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge, Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { BLEConnectionState } from '../types/ble.types';

interface BLEStatusIndicatorProps {
  connectionState: BLEConnectionState;
  deviceName?: string | null;
}

const BLEStatusIndicator: React.FC<BLEStatusIndicatorProps> = ({
  connectionState,
  deviceName,
}) => {
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    const getValueForState = (state: BLEConnectionState): number => {
      switch (state) {
        case 'idle': return 0;
        case 'scanning': return 1;
        case 'connecting': return 2;
        case 'connected': return 3;
        case 'disconnected': return 4;
        default: return 0;
      }
    };

    animatedValue.value = withTiming(getValueForState(connectionState), {
      duration: 300,
    });
  }, [connectionState, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1, 2, 3, 4],
      ['#757575', '#2196F3', '#FF9800', '#4CAF50', '#F44336']
    );

    return {
      backgroundColor,
    };
  });

  const getStatusText = (state: BLEConnectionState): string => {
    switch (state) {
      case 'idle': return 'Idle';
      case 'scanning': return 'Scanning...';
      case 'connecting': return 'Connecting...';
      case 'connected': return deviceName ? `Connected to ${deviceName}` : 'Connected';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (state: BLEConnectionState): string => {
    switch (state) {
      case 'idle': return 'bluetooth-off';
      case 'scanning': return 'bluetooth-searching';
      case 'connecting': return 'bluetooth-connecting';
      case 'connected': return 'bluetooth-connected';
      case 'disconnected': return 'bluetooth-off';
      default: return 'bluetooth-off';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, animatedStyle]}>
        <Badge
          icon={getStatusIcon(connectionState)}
          style={styles.badge}
        >
          <Text style={styles.text}>{getStatusText(connectionState)}</Text>
        </Badge>
      </Animated.View>
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
