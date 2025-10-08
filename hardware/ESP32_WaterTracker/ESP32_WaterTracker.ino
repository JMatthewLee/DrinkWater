/*
 * ESP32-S3 Water Tracker Firmware
 * 
 * BLE GATT Server for water consumption tracking
 * Simulates sensor data for testing (no physical sensors required)
 * 
 * Hardware: ESP32-S3 WROOM DevKit
 * - Built-in LED: GPIO2
 * - BOOT button: GPIO0
 * 
 * Libraries Required:
 * - ESP32 Built-in BLE Library (BLEDevice.h)
 * 
 * Board Settings:
 * - Board: ESP32S3 Dev Module
 * - Upload Speed: 921600
 * - USB CDC On Boot: Enabled
 * - Flash Size: 4MB
 * - Partition Scheme: Default 4MB with spiffs
 * 
 * File Structure:
 * - ESP32_WaterTracker.ino (this file)
 * - hardware/config.h
 * - hardware/WaterSensor.h
 * - hardware/BLEManager.h (now uses ESP32 built-in BLE library)
 */

#include "config.h"
#include "WaterSensor.h"
#include "BLEManager.h"

// Global objects
WaterSensor waterSensor;
BLEManager bleManager;

// Button state tracking
bool buttonPressed = false;
bool lastButtonState = HIGH;
unsigned long lastButtonTime = 0;

/**
 * Startup LED sequence - 3 blinks
 */
void startupLEDSequence() {
    Serial.println("Starting up...");
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(LED_BLINK_ON_MS);
        digitalWrite(LED_PIN, LOW);
        delay(LED_BLINK_OFF_MS);
    }
    Serial.println("Startup complete!");
}

/**
 * Print startup banner with device information
 */
void printStartupBanner() {
    Serial.println();
    Serial.println("========================================");
    Serial.println("    ESP32-S3 Water Tracker Firmware");
    Serial.println("========================================");
    Serial.println("Device Name: " + String(DEVICE_NAME));
    Serial.println("Service UUID: " + String(SERVICE_UUID));
    Serial.println("Water Characteristic: " + String(WATER_CHARACTERISTIC_UUID));
    Serial.println("Command Characteristic: " + String(COMMAND_CHARACTERISTIC_UUID));
    Serial.println("Simulation Interval: " + String(SIMULATION_INTERVAL) + "ms");
    Serial.println("Water Range: " + String(WATER_MIN_ML) + "-" + String(WATER_MAX_ML) + "mL");
    Serial.println("LED Pin: " + String(LED_PIN));
    Serial.println("Button Pin: " + String(BUTTON_PIN));
    Serial.println("File Structure: hardware/ folder");
    Serial.println("BLE Library: ESP32 Built-in (iPhone optimized)");
    Serial.println("========================================");
    Serial.println();
}

/**
 * Check button press with debouncing
 * @return true if button was pressed (debounced)
 */
bool checkButtonPress() {
    bool currentButtonState = digitalRead(BUTTON_PIN);
    unsigned long currentTime = millis();
    
    // Check for button press (LOW = pressed due to INPUT_PULLUP)
    if (currentButtonState == LOW && lastButtonState == HIGH) {
        // Button just pressed
        if (currentTime - lastButtonTime > BUTTON_DEBOUNCE_MS) {
            lastButtonTime = currentTime;
            lastButtonState = currentButtonState;
            return true;
        }
    }
    
    lastButtonState = currentButtonState;
    return false;
}

/**
 * Handle button press event
 */
void handleButtonPress() {
    Serial.println("Button pressed!");
    
    // LED feedback for button press
    digitalWrite(LED_PIN, HIGH);
    delay(LED_BUTTON_PRESS_MS);
    digitalWrite(LED_PIN, LOW);
    
    // Trigger manual water event
    int waterAmount = waterSensor.manualTrigger();
    
    // Send data via BLE if connected
    if (bleManager.isConnected()) {
        bleManager.sendWaterData(waterAmount);
    }
}

/**
 * Handle auto-simulation
 */
void handleAutoSimulation() {
    if (waterSensor.shouldSimulate()) {
        int waterAmount = waterSensor.simulateDrink();
        
        // Send data via BLE if connected
        if (bleManager.isConnected()) {
            bleManager.sendWaterData(waterAmount);
        }
    }
}

/**
 * Handle BLE commands
 * This would be called from BLEManager callbacks
 */
void handleBLECommands() {
    // Commands are handled directly in BLEManager callbacks
    // This function is here for future expansion if needed
}

void setup() {
    // Initialize Serial communication
    Serial.begin(SERIAL_BAUD);
    delay(1000); // Give time for Serial to initialize
    
    // Print startup banner
    printStartupBanner();
    
    // Initialize LED pin
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    
    // Initialize button pin with internal pullup
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    
    // Startup LED sequence
    startupLEDSequence();
    
    // Initialize BLE Manager
    bleManager.begin();
    
    // Initialize random seed for simulation
    randomSeed(analogRead(0));
    
    Serial.println("Setup complete! System ready.");
    Serial.println("Press BOOT button to trigger manual water event");
    Serial.println("Auto-simulation will start when device connects");
    Serial.println();
}

void loop() {
    // Handle BLE connection state
    bleManager.handleConnectionState();
    
    // Handle auto-simulation (only when connected)
    if (bleManager.isConnected()) {
        handleAutoSimulation();
    }
    
    // Check for button press
    if (checkButtonPress()) {
        handleButtonPress();
    }
    
    // Small delay to prevent watchdog issues
    delay(MAIN_LOOP_DELAY_MS);
}

/*
 * Additional Notes:
 * 
 * File Organization:
 * - All firmware files are now in the hardware/ folder
 * - Main sketch includes files with "hardware/" prefix
 * - This keeps Arduino code separate from React Native app code
 * 
 * BLE Implementation:
 * - Now uses ESP32 built-in BLE library (BLEDevice.h)
 * - iPhone-optimized advertising and connection settings
 * - Proven compatibility with LightBlue and other BLE scanners
 * 
 * Testing Checklist:
 * - [ ] Serial Monitor shows "BLE Server started"
 * - [ ] BOOT button triggers water event (see Serial + LED blink)
 * - [ ] Auto-sends data every 5 seconds when connected
 * - [ ] Connect from phone - Serial shows "Device connected!"
 * - [ ] App receives "ML:X,TS:Y" notifications
 * - [ ] Disconnect - restarts advertising
 * 
 * Data Format Sent to App:
 * "ML:<amount>,TS:<timestamp>"
 * Example: "ML:350,TS:123456"
 * 
 * Commands Received from App:
 * - "RESET" - reset water counter
 * - "STATUS" - respond with "STATUS:OK,BATTERY:100,MODE:SIM"
 * 
 * LED Behavior:
 * - 3 blinks on startup (200ms on/off)
 * - 3 blinks on BLE connect (200ms on/off)
 * - 1 blink when sending data (100ms on/off)
 * - 500ms on when button pressed
 * 
 * TODO for Developer:
 * - [ ] Generate 3 UUIDs at https://www.uuidgenerator.net/
 * - [ ] Update hardware/config.h with your UUIDs
 * - [ ] Copy same UUIDs to React Native config.ts
 * - [ ] Upload to ESP32 and test
 * - [ ] Future: Replace simulation with real sensor (ultrasonic/flow meter)
 */
