# BLE Water Tracker - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the BLE Water Tracker app on both iOS and Android platforms using Expo Go.

## Prerequisites

### Hardware Requirements
- ESP32 development board with water sensor
- Physical iOS device (iPhone/iPad) or Android device
- Computer with development environment

### Software Requirements
- Expo Go app installed on test device
- Development server running (`npm start` or `expo start`)

## Platform-Specific Testing

### iOS Testing

#### Setup
1. Install Expo Go from App Store
2. Ensure Bluetooth is enabled in Settings
3. Grant location permissions when prompted (required for BLE scanning)

#### Key iOS Considerations
- **Location Permission**: iOS requires location permission for BLE scanning
- **Background App Refresh**: May affect BLE connections when app is backgrounded
- **Bluetooth State**: iOS handles Bluetooth state changes differently than Android
- **Permission Prompts**: iOS shows system permission dialogs

#### Test Cases
1. **Initial Setup**
   - [ ] App requests location permission
   - [ ] Bluetooth permission is granted
   - [ ] BLE manager initializes successfully

2. **Device Scanning**
   - [ ] Scan starts when "Scan" button is pressed
   - [ ] ESP32 device appears in device list
   - [ ] Device RSSI values are displayed correctly
   - [ ] Scan stops after timeout or manual stop

3. **Device Connection**
   - [ ] Connection attempt shows loading state
   - [ ] Connection succeeds with valid ESP32 device
   - [ ] Connection fails gracefully with invalid device
   - [ ] Connection state updates correctly

4. **Data Reception**
   - [ ] Water data is received and parsed correctly
   - [ ] Status data is received and parsed correctly
   - [ ] Battery level updates are displayed
   - [ ] Data stream maintains last 20 messages

5. **Command Sending**
   - [ ] Commands are sent successfully
   - [ ] Command input is cleared after sending
   - [ ] Loading state is shown during sending
   - [ ] Error handling works for failed commands

6. **Disconnection**
   - [ ] Manual disconnection works
   - [ ] Automatic disconnection is handled
   - [ ] State resets after disconnection
   - [ ] Data stream is cleared

### Android Testing

#### Setup
1. Install Expo Go from Google Play Store
2. Enable Bluetooth in Settings
3. Grant all required permissions (Bluetooth, Location, etc.)

#### Key Android Considerations
- **Multiple Permissions**: Android requires multiple BLE-related permissions
- **Background Limitations**: Android 8+ has background execution limits
- **Bluetooth Adapter**: Android may have different Bluetooth adapter behaviors
- **Permission Handling**: Android permission system differs from iOS

#### Test Cases
1. **Permission Handling**
   - [ ] All required permissions are requested
   - [ ] Permission denial is handled gracefully
   - [ ] Permission re-request works correctly

2. **BLE Operations**
   - [ ] BLE scanning works correctly
   - [ ] Device discovery is reliable
   - [ ] Connection establishment is stable
   - [ ] Data transfer is consistent

3. **App Lifecycle**
   - [ ] App handles background/foreground transitions
   - [ ] BLE connections persist during app lifecycle changes
   - [ ] Memory usage remains stable

## Cross-Platform Testing

### Common Test Scenarios

#### 1. Basic Functionality
```bash
# Start the development server
npm start

# Scan QR code with Expo Go on both platforms
# Test all basic features on both iOS and Android
```

#### 2. Error Handling
- [ ] Test with Bluetooth disabled
- [ ] Test with no ESP32 device in range
- [ ] Test with invalid ESP32 device
- [ ] Test network connectivity issues

#### 3. Performance Testing
- [ ] Monitor memory usage during extended use
- [ ] Test with multiple rapid connections/disconnections
- [ ] Verify data stream performance with high frequency data

#### 4. Edge Cases
- [ ] Test with very weak Bluetooth signal
- [ ] Test with multiple ESP32 devices in range
- [ ] Test rapid scanning and connection attempts
- [ ] Test app termination during BLE operations

## ESP32 Hardware Testing

### Required ESP32 Setup
1. Flash the ESP32 with the provided Arduino code
2. Ensure water sensor is properly connected
3. Verify BLE service and characteristics are working
4. Test data transmission format matches expected format

### ESP32 Test Commands
- `STATUS` - Request device status
- `RESET` - Reset device counters
- `CALIBRATE` - Calibrate water sensor
- `BATTERY` - Request battery level

## Debugging Tips

### Common Issues and Solutions

#### iOS Issues
1. **"Bluetooth is not powered on"**
   - Ensure Bluetooth is enabled in iOS Settings
   - Restart the app after enabling Bluetooth

2. **Location permission denied**
   - Go to Settings > Privacy > Location Services
   - Enable location services for Expo Go

3. **Device not found during scan**
   - Ensure ESP32 is powered on and in range
   - Check ESP32 BLE advertising is working

#### Android Issues
1. **Permission denied errors**
   - Check Android Settings > Apps > Expo Go > Permissions
   - Ensure all BLE-related permissions are granted

2. **Connection failures**
   - Try restarting Bluetooth on Android device
   - Clear Expo Go app cache if issues persist

3. **Scanning not working**
   - Verify location services are enabled
   - Check if other BLE apps are interfering

### Debug Tools
- Use React Native Debugger for state inspection
- Monitor console logs for BLE events
- Use Expo CLI logs: `expo logs`
- Check device Bluetooth logs (Android: Developer Options)

## Performance Monitoring

### Key Metrics to Monitor
- BLE connection establishment time
- Data transmission latency
- Memory usage during operation
- Battery impact on mobile device
- ESP32 battery level monitoring

### Recommended Testing Duration
- **Short Test**: 30 minutes of continuous operation
- **Medium Test**: 2 hours with periodic connections
- **Long Test**: 8+ hours to test stability and memory leaks

## Reporting Issues

When reporting issues, include:
1. Platform (iOS/Android) and version
2. Device model and OS version
3. Expo Go version
4. ESP32 firmware version
5. Steps to reproduce
6. Expected vs actual behavior
7. Console logs and error messages
8. Screenshots if applicable

## Success Criteria

The app is considered ready for production when:
- [ ] All test cases pass on both iOS and Android
- [ ] No memory leaks detected during extended testing
- [ ] Error handling works correctly for all edge cases
- [ ] Performance meets requirements (connection time < 5s, data latency < 1s)
- [ ] User experience is smooth and intuitive
- [ ] ESP32 communication is reliable and stable
