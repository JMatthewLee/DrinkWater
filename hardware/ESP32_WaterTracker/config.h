#ifndef CONFIG_H
#define CONFIG_H

// Device Configuration
#define DEVICE_NAME "WaterTracker"
#define SERIAL_BAUD 115200

// Hardware Pin Definitions
#define LED_PIN 2
#define BUTTON_PIN 0

// Simulation Settings
#define SIMULATION_INTERVAL 5000  // 5 seconds in milliseconds
#define WATER_MIN_ML 0
#define WATER_MAX_ML 500

// BLE Service and Characteristic UUIDs
// Generated at https://www.uuidgenerator.net/
// TODO: Copy these same UUIDs to React Native config.ts

// Main Service UUID
#define SERVICE_UUID "1693d55e-fc28-4cf2-ba71-2e9e1079a51b"

// Water Data Characteristic (NOTIFY + READ)
#define WATER_CHARACTERISTIC_UUID "3d108257-830b-4572-b7b7-328178886f66"

// Command Characteristic (WRITE)
#define COMMAND_CHARACTERISTIC_UUID "c1721d4d-970a-4037-956b-cf655b0cd5ef"

// Battery Level Characteristic (READ + NOTIFY)
#define BATTERY_CHARACTERISTIC_UUID "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// LED Timing Constants
#define LED_BLINK_ON_MS 200
#define LED_BLINK_OFF_MS 200
#define LED_DATA_SENT_MS 100
#define LED_BUTTON_PRESS_MS 2000

// Button Debounce
#define BUTTON_DEBOUNCE_MS 50

// Main Loop Delay
#define MAIN_LOOP_DELAY_MS 10

#endif // CONFIG_H
