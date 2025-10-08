import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  Snackbar,
} from 'react-native-paper';
import { useBLE } from '../hooks/useBLE';
import BLEStatusIndicator from '../components/BLEStatusIndicator';
import BLEDeviceList from '../components/BLEDeviceList';
import BLEDataDisplay from '../components/BLEDataDisplay';

const MainScreen: React.FC = () => {
  const {
    devices,
    connectionState,
    connectedDevice,
    dataStream,
    error,
    scanForDevices,
    connectToDevice,
    disconnect,
    sendCommand,
    clearError,
    clearDataStream,
  } = useBLE();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleScanPress = async () => {
    try {
      await scanForDevices();
    } catch (err) {
      Alert.alert('Scan Error', 'Failed to start scanning for devices');
    }
  };

  const handleDevicePress = async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
    } catch (err) {
      Alert.alert('Connection Error', 'Failed to connect to device');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await scanForDevices();
    } catch (err) {
      Alert.alert('Refresh Error', 'Failed to refresh device list');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      Alert.alert('Disconnect Error', 'Failed to disconnect from device');
    }
  };

  const handleSendCommand = async (command: string) => {
    try {
      await sendCommand(command);
    } catch (err) {
      Alert.alert('Command Error', 'Failed to send command to device');
    }
  };

  const showScanButton = connectionState === 'idle' || connectionState === 'disconnected';
  const showDeviceList = connectionState === 'scanning' || devices.length > 0;
  const showDataDisplay = connectionState === 'connected';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>ESP32 BLE Controller</Title>
            <Paragraph style={styles.headerSubtitle}>
              Connect to your ESP32 device and monitor real-time data
            </Paragraph>
            <BLEStatusIndicator
              connectionState={connectionState}
              deviceName={connectedDevice?.name}
            />
          </Card.Content>
        </Card>

        {/* Scan Button */}
        {showScanButton && (
          <Card style={styles.actionCard}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={handleScanPress}
                style={styles.scanButton}
                icon="bluetooth-search"
              >
                Scan for Devices
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Device List */}
        {showDeviceList && (
          <Card style={styles.listCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Available Devices</Title>
              <BLEDeviceList
                devices={devices}
                connectionState={connectionState}
                onDevicePress={handleDevicePress}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            </Card.Content>
          </Card>
        )}

        {/* Connected Device Actions */}
        {showDataDisplay && (
          <Card style={styles.actionCard}>
            <Card.Content>
              <View style={styles.connectedActions}>
                <Button
                  mode="outlined"
                  onPress={handleDisconnect}
                  style={styles.disconnectButton}
                  icon="bluetooth-off"
                >
                  Disconnect
                </Button>
                <Button
                  mode="outlined"
                  onPress={clearDataStream}
                  style={styles.clearButton}
                  icon="delete-sweep"
                >
                  Clear Data
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Data Display */}
        {showDataDisplay && (
          <BLEDataDisplay
            dataStream={dataStream}
            onSendCommand={handleSendCommand}
            onClearData={clearDataStream}
          />
        )}
      </ScrollView>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={5000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#757575',
    marginBottom: 16,
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  scanButton: {
    marginVertical: 8,
  },
  connectedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  disconnectButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
  },
  listCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  snackbar: {
    backgroundColor: '#F44336',
  },
});

export default MainScreen;
