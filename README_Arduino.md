# ESP32-S3 Water Tracker Firmware

Complete Arduino firmware for ESP32-S3 WROOM that implements a BLE GATT server for water tracking with simulated sensor data.

## Hardware Requirements

- **ESP32-S3 WROOM DevKit**
- **Built-in LED** (GPIO2)
- **BOOT button** (GPIO0)
- **USB cable** for programming and power

## Arduino IDE Setup

### 1. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add this URL to **Additional Board Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "**esp32**" and install "**esp32 by Espressif Systems**"

### 2. Install NimBLE-Arduino Library
1. Go to **Sketch → Include Library → Manage Libraries**
2. Search for "**NimBLE-Arduino**"
3. Install "**NimBLE-Arduino by h2zero**"

### 3. Board Configuration
1. Go to **Tools → Board → ESP32S3 Dev Module**
2. Set the following board settings:
   - **Upload Speed**: 921600
   - **USB CDC On Boot**: Enabled
   - **Flash Size**: 4MB
   - **Partition Scheme**: Default 4MB with spiffs

## Project Files

The firmware consists of 4 main files in the `hardware/` folder:

### 1. `hardware/config.h`
- All configuration settings in one place
- Device name: "WaterTracker"
- Service and characteristic UUIDs
- Hardware pin definitions
- Simulation parameters

### 2. `hardware/WaterSensor.h`
- Simulated sensor class
- Auto-simulation every 5 seconds
- Manual trigger via button press
- Session total tracking
- Reset functionality

### 3. `hardware/BLEManager.h`
- Complete BLE GATT server implementation
- Two characteristics: Water Data (NOTIFY+READ) and Commands (WRITE)
- Connection state management
- LED status indicators
- Command handling

### 4. `hardware/ESP32_WaterTracker.ino`
- Main Arduino sketch
- Setup and loop functions
- Button debouncing
- LED control
- Serial debug output
- Updated include paths for hardware folder structure

## File Organization

The Arduino firmware is organized in the `hardware/` folder to keep it separate from the React Native app code:

```
hardware/
├── ESP32_WaterTracker.ino    # Main Arduino sketch
├── config.h                  # Configuration and UUIDs
├── WaterSensor.h            # Simulated sensor class
└── BLEManager.h             # BLE GATT server implementation
```

This structure allows you to:
- Keep Arduino code separate from React Native app
- Easily share the hardware folder with other developers
- Maintain clean project organization
- Upload only the hardware folder to Arduino IDE

## Features

- ✅ **Auto-simulation** every 5 seconds when BLE connected
- ✅ **Manual trigger** via BOOT button (GPIO0)
- ✅ **BLE GATT server** with two characteristics
- ✅ **Connection management** with auto-restart advertising
- ✅ **Command handling** (RESET, STATUS)
- ✅ **LED status indicators** for all events
- ✅ **Serial debug logging** for troubleshooting
- ✅ **Thread-safe** BLE operations
- ✅ **Debounced button** input
- ✅ **Organized file structure** in hardware folder

## Data Format

### Sent to App (Water Data Characteristic)
```
ML:<amount>,TS:<timestamp>
```
**Example**: `ML:350,TS:123456`

### Received from App (Command Characteristic)
- `RESET` - Reset water consumption counter
- `STATUS` - Request device status

### Status Response
```
STATUS:OK,BATTERY:100,MODE:SIM
```

## LED Behavior

| Event | LED Pattern |
|-------|-------------|
| Startup | 3 blinks (200ms on/off) |
| BLE Connect | 3 blinks (200ms on/off) |
| Data Sent | 1 blink (100ms on/off) |
| Button Press | 500ms solid on |

## Serial Debug Output

The firmware provides comprehensive debug output:

```
========================================
    ESP32-S3 Water Tracker Firmware
========================================
Device Name: WaterTracker
Service UUID: 12345678-1234-1234-1234-123456789abc
Water Characteristic: 87654321-4321-4321-4321-cba987654321
Command Characteristic: 11111111-2222-3333-4444-555555555555
Simulation Interval: 5000ms
Water Range: 0-500mL
LED Pin: 2
Button Pin: 0
========================================

BLE Server started, advertising...
Device connected!
Simulated drink: 350 mL
Sent: ML:350,TS:123456
Button pressed!
Manual trigger activated!
Simulated drink: 200 mL
Sent: ML:200,TS:123789
Received command: RESET
Reset command received
Device disconnected! Restarting advertising...
```

## Testing Checklist

### Basic Functionality
- [ ] Serial Monitor shows "BLE Server started, advertising..."
- [ ] LED blinks 3 times on startup
- [ ] BOOT button triggers water event (see Serial + LED blink)
- [ ] Auto-sends data every 5 seconds when connected
- [ ] LED blinks 3 times on BLE connect

### BLE Communication
- [ ] Connect from phone - Serial shows "Device connected!"
- [ ] App receives "ML:X,TS:Y" notifications
- [ ] App can send "RESET" command
- [ ] App can send "STATUS" command
- [ ] Disconnect - restarts advertising automatically

### Error Handling
- [ ] Reconnection works after disconnect
- [ ] Button debouncing prevents multiple triggers
- [ ] No crashes during extended operation
- [ ] Serial output remains stable

## Upload Instructions

1. **Open Arduino IDE**
2. **Open the main sketch**: `hardware/ESP32_WaterTracker.ino`
3. **Connect ESP32-S3** to computer via USB
4. **Select correct port** in Arduino IDE (Tools → Port)
5. **Verify board settings** match requirements above
6. **Upload the sketch** (Ctrl+U or Upload button)
7. **Open Serial Monitor** (Ctrl+Shift+M) at 115200 baud
8. **Watch startup sequence** and verify BLE advertising

**Note**: The sketch automatically includes all files from the `hardware/` folder. Arduino IDE will compile all `.h` files in the same folder as the main `.ino` file.

## Troubleshooting

### Common Issues

**"Failed to connect" during upload**
- Hold BOOT button while clicking Upload
- Try different USB cable/port
- Check board settings match ESP32S3 Dev Module

**"BLE Server started" not appearing**
- Check Serial Monitor baud rate (115200)
- Verify NimBLE-Arduino library is installed
- Check for compilation errors

**No BLE advertising**
- Restart ESP32 (power cycle)
- Check Serial output for error messages
- Verify UUIDs are properly formatted

**Button not responding**
- Check button wiring (GPIO0 with pullup)
- Verify debounce timing in code
- Test with multimeter for button continuity

### Debug Tips

1. **Enable verbose output** by adding `#define DEBUG 1` to config.h
2. **Check memory usage** with `Serial.println(ESP.getFreeHeap())`
3. **Monitor BLE events** by adding more Serial.println statements
4. **Test individual components** by commenting out sections

## Future Enhancements

### Real Sensor Integration
Replace simulation with actual sensors:

```cpp
// Ultrasonic sensor for water level
#include <NewPing.h>
NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE);

// Flow meter for water consumption
volatile int flowCount = 0;
void flowISR() { flowCount++; }
```

### Additional Features
- Battery level monitoring
- Data logging to SD card
- WiFi connectivity for cloud sync
- Multiple sensor support
- Calibration routines

## UUID Configuration

**IMPORTANT**: Before using with your React Native app:

1. Generate new UUIDs at https://www.uuidgenerator.net/
2. Update `config.h` with your UUIDs
3. Copy the same UUIDs to your React Native `config.ts`
4. Re-upload firmware to ESP32

## License

This firmware is provided as-is for educational and development purposes. Modify as needed for your specific requirements.

## Support

For issues or questions:
1. Check Serial Monitor output for error messages
2. Verify all setup steps were completed
3. Test with BLE scanner app to verify advertising
4. Check hardware connections and power supply
