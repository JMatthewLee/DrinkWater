# DrinkWater - ESP32 BLE Water Tracking App

A React Native + Expo app with TypeScript that implements BLE communication with an ESP32 water tracking device using `react-native-ble-plx`.

## 🚀 Android-First Development

**Current Status**: Migrated to Android-first development for BLE testing. iOS support will be added after Android testing is complete.

### Quick Start (Android)
```bash
# Build preview APK for testing
npm run android:build

# Local development (requires Android Studio)
npm run android:dev

# Install APK on device
adb install path/to/app.apk
```

📖 **See [ANDROID_DEVELOPMENT.md](./ANDROID_DEVELOPMENT.md) for complete Android setup and testing guide.**

## Features

- **BLE Device Discovery**: Scan and discover nearby ESP32 water tracking devices
- **Real-time Water Tracking**: Receive water consumption data from ESP32
- **Connection Management**: Connect/disconnect with visual status indicators
- **Data Visualization**: Real-time water consumption display
- **Modern UI**: Built with React Native Paper components
- **TypeScript**: Full type safety throughout the application
- **Android-First**: Optimized for Android BLE functionality

## Project Structure

```
water-tracking-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Main water tracking screen
│   │   ├── analytics.tsx      # Water consumption analytics
│   │   ├── calendar.tsx       # Calendar view
│   │   └── settings.tsx       # App settings
│   ├── (auth)/
│   │   ├── login.tsx          # User authentication
│   │   └── signup.tsx         # User registration
│   └── _layout.tsx            # Root layout
├── components/
│   ├── water/
│   │   ├── ProgressCircle.tsx # Water consumption progress
│   │   ├── QuickAddButtons.tsx # Quick water intake buttons
│   │   └── StreakCounter.tsx  # Daily streak counter
│   └── common/
│       ├── ErrorBoundary.tsx  # Error handling
│       └── LoadingScreen.tsx  # Loading states
├── hooks/
│   └── useBLE.ts              # Custom BLE hook
├── services/
│   ├── databaseService.ts     # Supabase integration
│   └── supabase.ts           # Supabase client
├── context/
│   ├── AuthContext.tsx       # Authentication state
│   └── WaterTrackingContext.tsx # Water tracking state
└── hardware/
    └── ESP32_WaterTracker/    # ESP32 firmware
        ├── ESP32_WaterTracker.ino
        ├── BLEManager.h
        └── WaterSensor.h
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`
- Android Studio (for local development)
- Physical Android device (Android 5.0+ / API 21+)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure EAS (if not done already):
```bash
eas build:configure
```

3. Start the development server:
```bash
npm start
```

## Android Development

### Build Commands

```bash
# Local development (requires Android Studio)
npm run android:dev

# Cloud builds
npm run android:build        # Preview APK
npm run android:build-dev    # Development client
npm run android:build-prod   # Production AAB
```

### Testing Checklist

- [ ] App builds successfully
- [ ] APK installs on Android device
- [ ] BLE permissions are requested correctly
- [ ] Can scan for ESP32 device
- [ ] Can connect to ESP32
- [ ] Receives water consumption data
- [ ] BLE works in background
- [ ] Reconnection works after app restart

## ESP32 Setup

Your ESP32 device should implement a BLE service for water tracking:

### Expected BLE Service
- **Service UUID**: Configured in your ESP32 code
- **Characteristic UUID**: For water consumption data
- **Data Format**: `ML:XXX` where XXX is milliliters consumed

### Example ESP32 Code Structure

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

class WaterTrackingCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string rxValue = pCharacteristic->getValue();
        // Handle water consumption commands
    }
    
    void onNotify(BLECharacteristic *pCharacteristic) {
        // Send water consumption data
        String waterData = "ML:" + String(consumedMl);
        pCharacteristic->setValue(waterData.c_str());
        pCharacteristic->notify();
    }
};

void setup() {
    BLEDevice::init("WaterTracker");
    pServer = BLEDevice::createServer();
    BLEService *pService = pServer->createService(SERVICE_UUID);
    
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    
    pCharacteristic->setCallbacks(new WaterTrackingCallbacks());
    pCharacteristic->addDescriptor(new BLE2902());
    
    pService->start();
    pServer->getAdvertising()->start();
}
```

## Usage

### 1. Scanning for Devices
- Tap "Scan for Devices" to discover nearby ESP32 water trackers
- Devices are sorted by signal strength (RSSI)
- Pull down to refresh the device list

### 2. Connecting to a Device
- Tap "Connect" on any discovered device
- The app will request BLE permissions if needed
- Connection status is shown in the header

### 3. Water Tracking
- Real-time water consumption data appears automatically
- Shows milliliters consumed with timestamps
- Progress circle updates in real-time
- Daily streak counter tracks consistency

## Permissions

The app handles Android permissions automatically:

### Android 12+ (API 31+)
- `BLUETOOTH_SCAN` - Required for BLE scanning
- `BLUETOOTH_CONNECT` - Required for BLE connections
- `ACCESS_FINE_LOCATION` - Required for BLE scanning

### Android 11 and Below
- `BLUETOOTH` - Legacy Bluetooth permission
- `BLUETOOTH_ADMIN` - Legacy Bluetooth admin permission
- `ACCESS_FINE_LOCATION` - Required for BLE scanning

## Architecture

### useBLE Hook
Custom React hook that provides:
- Device list management
- Connection state tracking
- Real-time water data streaming
- Android permission handling
- Error handling and cleanup

### Water Tracking Context
Global state management for:
- Water consumption data
- Daily goals and progress
- Streak tracking
- Offline data synchronization

### Components
- **ProgressCircle**: Animated water consumption progress
- **QuickAddButtons**: Quick water intake buttons
- **StreakCounter**: Daily streak tracking
- **ErrorBoundary**: Error handling and recovery

## Troubleshooting

### Common Issues

1. **Bluetooth not available**: Install development build (expo-dev-client)
2. **Permissions denied**: Enable all Bluetooth and Location permissions
3. **Device not found**: Ensure ESP32 is powered on and advertising
4. **Connection failed**: Check UUIDs match between app and ESP32
5. **Build failures**: Run `eas build:configure` and check dependencies

### Debug Commands
```bash
# Check connected devices
adb devices

# View Android logs
adb logcat | grep -i bluetooth

# Install APK manually
adb install path/to/app.apk
```

## Distribution

### Sharing with Testers
1. Build preview APK: `npm run android:build`
2. Download APK from EAS dashboard
3. Share download link with testers
4. Testers install APK directly on their devices

### Play Store Preparation
1. Build production AAB: `npm run android:build-prod`
2. Upload AAB to Google Play Console
3. Complete store listing and metadata
4. Submit for review

## Future Development

### Phase 1: Android Testing ✅
- [x] Android-first configuration
- [x] BLE permission handling
- [x] ESP32 integration
- [x] APK distribution

### Phase 2: iOS Support (Next)
- [ ] Re-enable iOS configuration
- [ ] Test BLE on iOS devices
- [ ] iOS-specific permission handling
- [ ] TestFlight distribution

### Phase 3: Cross-Platform Optimization
- [ ] Unified cross-platform release
- [ ] Tablet optimization
- [ ] Advanced analytics
- [ ] Social features

## Dependencies

- `react-native-ble-plx`: BLE communication
- `react-native-paper`: UI components
- `expo-router`: Navigation
- `@supabase/supabase-js`: Backend services
- `@expo/vector-icons`: Icons
- `expo-dev-client`: Development builds

## License

MIT License - see LICENSE file for details.