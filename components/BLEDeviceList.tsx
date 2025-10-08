import React, { useState } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Text,
  IconButton,
} from 'react-native-paper';
import { BLEDevice } from '../types/ble.types';

interface BLEDeviceListProps {
  devices: BLEDevice[];
  connectionState: string;
  onDevicePress: (deviceId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const BLEDeviceList: React.FC<BLEDeviceListProps> = ({
  devices,
  connectionState,
  onDevicePress,
  onRefresh,
  isRefreshing,
}) => {
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  const handleDevicePress = async (deviceId: string) => {
    try {
      setConnectingDeviceId(deviceId);
      await onDevicePress(deviceId);
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to device');
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const getSignalStrengthIcon = (rssi: number): string => {
    if (rssi > -50) return 'signal-cellular-4';
    if (rssi > -60) return 'signal-cellular-3';
    if (rssi > -70) return 'signal-cellular-2';
    if (rssi > -80) return 'signal-cellular-1';
    return 'signal-cellular-0';
  };

  const getSignalStrengthColor = (rssi: number): string => {
    if (rssi > -50) return '#4CAF50';
    if (rssi > -60) return '#8BC34A';
    if (rssi > -70) return '#FFC107';
    if (rssi > -80) return '#FF9800';
    return '#F44336';
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => {
    const isConnecting = connectingDeviceId === item.id;
    const canConnect = connectionState === 'idle' || connectionState === 'scanning';

    return (
      <Card style={styles.deviceCard}>
        <Card.Content>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceInfo}>
              <Title style={styles.deviceName}>{item.name}</Title>
              <Paragraph style={styles.deviceId}>ID: {item.id}</Paragraph>
            </View>
            <View style={styles.signalInfo}>
              <IconButton
                icon={getSignalStrengthIcon(item.rssi)}
                iconColor={getSignalStrengthColor(item.rssi)}
                size={20}
              />
              <Text style={styles.rssiText}>{item.rssi} dBm</Text>
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => handleDevicePress(item.id)}
            disabled={!canConnect || isConnecting}
            loading={isConnecting}
            style={styles.connectButton}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="bluetooth-off"
        size={64}
        iconColor="#757575"
      />
      <Text style={styles.emptyText}>No devices found</Text>
      <Text style={styles.emptySubtext}>
        Make sure your ESP32 device is powered on and in range
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Scanning for devices...</Text>
    </View>
  );

  if (connectionState === 'scanning' && devices.length === 0) {
    return renderLoadingState();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={devices.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceCard: {
    marginBottom: 12,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  signalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rssiText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  connectButton: {
    marginLeft: 'auto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
});

export default BLEDeviceList;
