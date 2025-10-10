/**
 * Home Screen - Main water logging interface
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput as PaperTextInput,
  useTheme,
  Snackbar,
} from 'react-native-paper';
import { useWaterTracking } from '../../context/WaterTrackingContext';
import { useBLE } from '../../hooks/useBLE';
import { SUPABASE_CONFIG, BLE_CONFIG } from '../../config/supabase';
import ProgressCircle from '../../components/water/ProgressCircle';
import QuickAddButtons from '../../components/water/QuickAddButtons';
import StreakCounter from '../../components/water/StreakCounter';
import { getTodayProgress, getLogsForDate, formatAmount } from '../../utils/calculations';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const {
    logs,
    settings,
    isLoading,
    error,
    addWaterLog,
    updateWaterLog,
    deleteWaterLog,
    clearError,
    refreshData,
  } = useWaterTracking();

  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // BLE integration: when device sends ML:###, add a water log
  const handleWaterReading = useCallback((ml: number) => {
    addWaterLog(ml, undefined, 'ble');
  }, [addWaterLog]);

  const ble = useBLE({
    onWaterMl: handleWaterReading,
    serviceUUID: BLE_CONFIG.serviceUUID,
    waterCharacteristicUUID: BLE_CONFIG.WATER_CHARACTERISTIC_UUID,
  });

  const todayProgress = getTodayProgress(logs, settings.dailyGoalMl);
  const todayLogs = getLogsForDate(logs, new Date());
  const recentLogs = todayLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  const handleQuickAdd = (amount: number) => {
    addWaterLog(amount, undefined, 'manual');
    setCustomAmount('');
    setNote('');
    setShowNoteInput(false);
  };

  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    addWaterLog(amount, note.trim() || undefined, 'manual');
    setCustomAmount('');
    setNote('');
    setShowNoteInput(false);
  };

  const handleGoalReached = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleEditLog = (logId: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    Alert.prompt(
      'Edit Water Log',
      'Enter new amount (ml):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text: string | undefined) => {
            const amount = parseFloat(text || '0');
            if (!isNaN(amount) && amount > 0) {
              updateWaterLog(logId, amount, log.note);
            }
          },
        },
      ],
      'plain-text',
      log.amountMl.toString()
    );
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this water log?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWaterLog(logId) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <ProgressCircle
            currentMl={todayProgress.current}
            goalMl={todayProgress.goal}
            size={220}
            strokeWidth={16}
            unit={settings.unitPreference}
            onGoalReached={handleGoalReached}
          />
        </View>

        {/* Quick Add Buttons and BLE controls */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <QuickAddButtons
              amounts={settings.quickAddAmounts}
              unit={settings.unitPreference}
              onAdd={handleQuickAdd}
              isLoading={isLoading}
            />
            <View style={{ marginTop: 12 }}>
              <Button
                mode="outlined"
                onPress={() => ble.scanForDevices()}
                disabled={ble.connectionState === 'scanning'}
              >
                {ble.connectionState === 'scanning' ? 'Scanning...' : 'Scan for Devices'}
              </Button>
              {ble.error && (
                <Text style={{ color: '#b91c1c', marginTop: 8 }}>{ble.error}</Text>
              )}
              {ble.devices.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {ble.devices.slice(0, 3).map((d) => (
                    <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>{d.name} ({d.rssi} dBm)</Text>
                      <Button mode="text" onPress={() => ble.connectToDevice(d.id)} disabled={ble.connectionState === 'connecting' || ble.connectionState === 'connected'}>
                        {ble.connectionState === 'connecting' ? 'Connecting...' : 'Connect'}
                      </Button>
                    </View>
                  ))}
                </View>
              )}
              {ble.connectedDevice && (
                <View style={{ marginTop: 8 }}>
                  <Text>Connected to {ble.connectedDevice.name}</Text>
                  <Button mode="text" onPress={() => ble.disconnect()}>
                    Disconnect
                  </Button>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Custom Amount Input */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Custom Amount</Text>
            <PaperTextInput
              label="Amount (ml)"
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
              style={styles.amountInput}
              right={
                <PaperTextInput.Icon
                  icon="plus"
                  onPress={handleCustomAdd}
                  disabled={!customAmount || isLoading}
                />
              }
            />
            
            <Button
              mode="outlined"
              onPress={() => setShowNoteInput(!showNoteInput)}
              style={styles.noteToggleButton}
              icon={showNoteInput ? 'chevron-up' : 'chevron-down'}
            >
              Add Note
            </Button>

            {showNoteInput && (
              <PaperTextInput
                label="Note (optional)"
                value={note}
                onChangeText={setNote}
                multiline
                style={styles.noteInput}
              />
            )}

            <Button
              mode="contained"
              onPress={handleCustomAdd}
              disabled={!customAmount || isLoading}
              style={styles.addButton}
            >
              Log Water
            </Button>
          </Card.Content>
        </Card>

        {/* Streak Counter */}
        <Card style={styles.card}>
          <Card.Content>
            <StreakCounter
              currentStreak={settings.currentStreak}
              longestStreak={settings.longestStreak}
            />
          </Card.Content>
        </Card>

        {/* Recent Logs */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.recentLogsHeader}>
              <Text style={styles.sectionTitle}>Today's Logs</Text>
              <Text style={styles.logCount}>
                {todayLogs.length} log{todayLogs.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logContent}>
                    <Text style={styles.logAmount}>
                      {formatAmount(log.amountMl, settings.unitPreference)}
                    </Text>
                    <Text style={styles.logTime}>
                      {log.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                    {log.note && (
                      <Text style={styles.logNote}>{log.note}</Text>
                    )}
                  </View>
                  <View style={styles.logActions}>
                    <Button
                      mode="text"
                      onPress={() => handleEditLog(log.id)}
                      compact
                    >
                      Edit
                    </Button>
                    <Button
                      mode="text"
                      onPress={() => handleDeleteLog(log.id)}
                      textColor={theme.colors.error}
                      compact
                    >
                      Delete
                    </Button>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No water logged today yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Start by adding some water!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Confetti Animation Placeholder */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <Text style={styles.confettiText}>🎉 Goal Reached! 🎉</Text>
        </View>
      )}

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={5000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountInput: {
    marginBottom: 8,
  },
  noteToggleButton: {
    marginBottom: 8,
  },
  noteInput: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  recentLogsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  logContent: {
    flex: 1,
  },
  logAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  logNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  snackbar: {
    backgroundColor: '#ef4444',
  },
});

export default HomeScreen;
