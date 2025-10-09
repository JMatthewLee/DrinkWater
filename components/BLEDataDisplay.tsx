import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  IconButton,
  Divider,
  Chip,
} from 'react-native-paper';
import { BLEData } from '../types/ble.types';
import { formatWaterData, formatStatusData, ParsedData } from '../utils/dataParser';

interface BLEDataDisplayProps {
  dataStream: BLEData[];
  onSendCommand: (command: string) => Promise<void>;
  onClearData: () => void;
}

const BLEDataDisplay: React.FC<BLEDataDisplayProps> = ({
  dataStream,
  onSendCommand,
  onClearData,
}) => {
  const [command, setCommand] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new data arrives
    if (dataStream.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dataStream]);

  const handleSendCommand = useCallback(async (): Promise<void> => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand || isSending) return;
    
    try {
      setIsSending(true);
      await onSendCommand(trimmedCommand);
      setCommand('');
    } catch (error) {
      console.error('Failed to send command:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSending(false);
    }
  }, [command, isSending, onSendCommand]);

  const formatTimestamp = useCallback((timestamp: Date): string => {
    if (!timestamp || !(timestamp instanceof Date)) {
      return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const renderDataItem = useCallback((item: BLEData, index: number) => {
    const getDataDisplay = (): React.ReactNode => {
      if (item.parsed) {
        if (item.parsed.type === 'water_data') {
          return (
            <View style={styles.parsedDataContainer}>
              <Chip icon="cup" style={styles.waterChip}>
                {formatWaterData(item.parsed)}
              </Chip>
            </View>
          );
        } else if (item.parsed.type === 'status') {
          return (
            <View style={styles.parsedDataContainer}>
              <Chip icon="information" style={styles.statusChip}>
                {formatStatusData(item.parsed)}
              </Chip>
            </View>
          );
        }
      }
      return <Text style={styles.dataValue}>{item.value}</Text>;
    };

    return (
      <View key={`${item.timestamp.getTime()}-${index}`} style={styles.dataItem}>
        <View style={styles.dataHeader}>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          {getDataDisplay()}
        </View>
        {index < dataStream.length - 1 && <Divider style={styles.divider} />}
      </View>
    );
  }, [dataStream.length, formatTimestamp]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>Real-time Data</Title>
            <IconButton
              icon="delete-sweep"
              onPress={onClearData}
              iconColor="#757575"
            />
          </View>
          
          <ScrollView
            ref={scrollViewRef}
            style={styles.dataContainer}
            showsVerticalScrollIndicator={false}
          >
            {dataStream.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data received yet</Text>
                <Text style={styles.emptySubtext}>
                  Send a command to start receiving data from your ESP32
                </Text>
              </View>
            ) : (
              dataStream.map(renderDataItem)
            )}
          </ScrollView>

          <View style={styles.commandContainer}>
            <TextInput
              style={styles.commandInput}
              value={command}
              onChangeText={setCommand}
              placeholder="Enter command to send..."
              placeholderTextColor="#9E9E9E"
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={handleSendCommand}
            />
            <Button
              mode="contained"
              onPress={handleSendCommand}
              disabled={!command.trim() || isSending}
              loading={isSending}
              style={styles.sendButton}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  dataContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dataItem: {
    paddingVertical: 8,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'monospace',
  },
  dataValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    marginTop: 8,
    backgroundColor: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
  },
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commandInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
  },
  sendButton: {
    minWidth: 80,
  },
  parsedDataContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  waterChip: {
    backgroundColor: '#E3F2FD',
  },
  statusChip: {
    backgroundColor: '#F3E5F5',
  },
});

export default BLEDataDisplay;
