import React, { useRef, useEffect, useState } from 'react';
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
} from 'react-native-paper';
import { BLEData } from '../types/ble.types';

interface BLEDataDisplayProps {
  dataStream: BLEData[];
  onSendCommand: (command: string) => void;
  onClearData: () => void;
}

const BLEDataDisplay: React.FC<BLEDataDisplayProps> = ({
  dataStream,
  onSendCommand,
  onClearData,
}) => {
  const [command, setCommand] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new data arrives
    if (dataStream.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [dataStream]);

  const handleSendCommand = () => {
    if (command.trim()) {
      onSendCommand(command.trim());
      setCommand('');
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderDataItem = (item: BLEData, index: number) => (
    <View key={index} style={styles.dataItem}>
      <View style={styles.dataHeader}>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        <Text style={styles.dataValue}>{item.value}</Text>
      </View>
      {index < dataStream.length - 1 && <Divider style={styles.divider} />}
    </View>
  );

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
              disabled={!command.trim()}
              style={styles.sendButton}
            >
              Send
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
});

export default BLEDataDisplay;
