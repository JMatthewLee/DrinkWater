/**
 * Settings Screen - User preferences and data management
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  TextInput, 
  Switch, 
  List, 
  Divider,
  useTheme 
} from 'react-native-paper';
import { useWaterTracking } from '../../context/WaterTrackingContext';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { settings, updateSettings, isLoading } = useWaterTracking();
  const { user, signOut } = useAuth();
  
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoalMl.toString());
  const [unitPreference, setUnitPreference] = useState(settings.unitPreference);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [quickAddAmounts, setQuickAddAmounts] = useState(settings.quickAddAmounts.join(', '));

  const handleSaveSettings = () => {
    const newSettings = {
      dailyGoalMl: parseInt(dailyGoal) || 2000,
      unitPreference,
      notificationsEnabled,
      quickAddAmounts: quickAddAmounts
        .split(',')
        .map(amount => parseInt(amount.trim()))
        .filter(amount => !isNaN(amount) && amount > 0),
    };

    updateSettings(newSettings);
    Alert.alert('Success', 'Settings saved successfully!');
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            updateSettings({
              dailyGoalMl: 2000,
              currentStreak: 0,
              longestStreak: 0,
              quickAddAmounts: [250, 500, 1000],
              unitPreference: 'ml',
              notificationsEnabled: false,
              reminderTimes: ['09:00', '12:00', '15:00', '18:00'],
            });
            setDailyGoal('2000');
            setUnitPreference('ml');
            setNotificationsEnabled(false);
            setQuickAddAmounts('250, 500, 1000');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your water logs. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            // This would need to be implemented in the context
            Alert.alert('Info', 'Clear data functionality would be implemented here');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const unitOptions = [
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'oz', label: 'Ounces (oz)' },
    { value: 'cups', label: 'Cups' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account</Text>
          <List.Item
            title="Email"
            description={user?.email || 'Not signed in'}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="User ID"
            description={user?.id || 'N/A'}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <Divider />
          <List.Item
            title="Sign Out"
            description="Sign out of your account"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={handleSignOut}
            titleStyle={{ color: theme.colors.error }}
          />
        </Card.Content>
      </Card>

      {/* Water Goal Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          
          <TextInput
            label="Daily Goal"
            value={dailyGoal}
            onChangeText={setDailyGoal}
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text="ml" />}
          />
          
          <Text style={styles.helpText}>
            Recommended daily water intake is 2000-3000ml (8-12 cups)
          </Text>
        </Card.Content>
      </Card>

      {/* Unit Preference */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Unit Preference</Text>
          
          {unitOptions.map((option) => (
            <List.Item
              key={option.value}
              title={option.label}
              onPress={() => setUnitPreference(option.value as 'ml' | 'oz' | 'cups')}
              right={(props) => (
                <List.Icon
                  {...props}
                  icon={unitPreference === option.value ? 'check' : 'circle-outline'}
                />
              )}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Quick Add Amounts */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Add Amounts</Text>
          
          <TextInput
            label="Amounts (comma separated)"
            value={quickAddAmounts}
            onChangeText={setQuickAddAmounts}
            placeholder="250, 500, 1000"
            style={styles.input}
          />
          
          <Text style={styles.helpText}>
            Enter amounts in ml, separated by commas
          </Text>
        </Card.Content>
      </Card>

      {/* Notifications */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <List.Item
            title="Enable Notifications"
            description="Get reminders to drink water"
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
          />
          
          {notificationsEnabled && (
            <Text style={styles.helpText}>
              Notification settings will be available in a future update
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <List.Item
            title="Export Data"
            description="Download your water logs"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={() => Alert.alert('Info', 'Export functionality coming soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Clear All Data"
            description="Permanently delete all water logs"
            left={(props) => <List.Icon {...props} icon="delete" />}
            onPress={handleClearData}
            titleStyle={{ color: theme.colors.error }}
          />
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>About</Text>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <List.Item
            title="Privacy Policy"
            description="View our privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => Alert.alert('Info', 'Privacy policy coming soon')}
          />
          
          <List.Item
            title="Terms of Service"
            description="View terms and conditions"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => Alert.alert('Info', 'Terms of service coming soon')}
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleSaveSettings}
          loading={isLoading}
          style={styles.saveButton}
        >
          Save Settings
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleResetSettings}
          style={styles.resetButton}
        >
          Reset to Defaults
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  saveButton: {
    marginBottom: 8,
  },
  resetButton: {
    marginBottom: 16,
  },
});

export default SettingsScreen;
