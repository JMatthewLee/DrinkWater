# ESP32 BLE Controller App

A React Native + Expo app with TypeScript that implements BLE communication with an ESP32 device using `react-native-ble-plx`.

## Features

- **BLE Device Discovery**: Scan and discover nearby ESP32 devices
- **Real-time Communication**: Send commands and receive data from ESP32
- **Connection Management**: Connect/disconnect with visual status indicators
- **Data Visualization**: Real-time data display with timestamps
- **Modern UI**: Built with React Native Paper components
- **TypeScript**: Full type safety throughout the application

## Project Structure

```
water-tracking-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Main BLE screen
│   │   └── _layout.tsx        # Tab layout
│   ├── _layout.tsx            # Root layout
│   └── +not-found.tsx         # 404 page
├── components/
│   ├── BLEDeviceList.tsx      # List of discovered devices
│   ├── BLEStatusIndicator.tsx # Connection status display
│   └── BLEDataDisplay.tsx     # Real-time data from ESP32
├── services/
│   └── BLEManager.ts          # BLE service logic (singleton)
├── types/
│   └── ble.types.ts           # TypeScript interfaces
├── hooks/
│   └── useBLE.ts              # Custom BLE hook
└── config.ts                  # Configuration (BLE UUIDs)
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI
- React Native development environment
- ESP32 device with BLE capabilities

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure BLE UUIDs in `config.ts`:
```typescript
export const config = {
  ble: {
    serviceUUID: 'YOUR_SERVICE_UUID',
    characteristicUUID: 'YOUR_CHARACTERISTIC_UUID',
  },
};
```

3. Start the development server:
```bash
npx expo start
```

## ESP32 Setup

Your ESP32 device should implement a BLE service with the following characteristics:

- **Service UUID**: Configured in `config.ts`
- **Characteristic UUID**: Configured in `config.ts`
- **Properties**: Read, Write, Notify

### Example ESP32 Code Structure

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string rxValue = pCharacteristic->getValue();
        // Handle incoming commands
    }
};

void setup() {
    BLEDevice::init("ESP32_BLE_Device");
    pServer = BLEDevice::createServer();
    BLEService *pService = pServer->createService(SERVICE_UUID);
    
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    
    pCharacteristic->setCallbacks(new MyCallbacks());
    pCharacteristic->addDescriptor(new BLE2902());
    
    pService->start();
    pServer->getAdvertising()->start();
}
```

## Usage

### 1. Scanning for Devices

- Tap "Scan for Devices" to discover nearby ESP32 devices
- Devices are sorted by signal strength (RSSI)
- Pull down to refresh the device list

### 2. Connecting to a Device

- Tap "Connect" on any discovered device
- The app will attempt to connect and discover services
- Connection status is shown in the header

### 3. Sending Commands

- Once connected, use the command input field
- Type your command and tap "Send"
- Commands are sent to the ESP32 device

### 4. Receiving Data

- Real-time data from ESP32 appears in the data display
- Shows timestamp and data value
- Auto-scrolls to show latest data
- Clear button to reset the log

## Permissions

The app handles the following permissions automatically:

### Android
- `BLUETOOTH`
- `BLUETOOTH_ADMIN`
- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- `ACCESS_FINE_LOCATION`

### iOS
- Bluetooth Always Usage Description
- Bluetooth Peripheral Usage Description

## Architecture

### BLEManager Service

Singleton service that manages all BLE operations:
- Device scanning and connection
- Service and characteristic discovery
- Data transmission and reception
- Event emission for state changes

### useBLE Hook

Custom React hook that provides:
- Device list management
- Connection state tracking
- Real-time data streaming
- Error handling
- Cleanup on unmount

### Components

- **BLEStatusIndicator**: Animated status display with color coding
- **BLEDeviceList**: FlatList with device discovery and connection
- **BLEDataDisplay**: Real-time data visualization with command input

## Troubleshooting

### Common Issues

1. **Bluetooth not enabled**: Ensure Bluetooth is enabled on the device
2. **Permissions denied**: Grant all required permissions in device settings
3. **Device not found**: Ensure ESP32 is powered on and in range
4. **Connection failed**: Check UUIDs match between app and ESP32

### Debug Mode

Enable debug logging by checking the console output for detailed BLE operations.

## Dependencies

- `react-native-ble-plx`: BLE communication
- `react-native-paper`: UI components
- `react-native-reanimated`: Animations
- `expo-router`: Navigation
- `@expo/vector-icons`: Icons

## License

MIT License - see LICENSE file for details.