#ifndef BLEMANAGER_H
#define BLEMANAGER_H

#include <Arduino.h>
#include "BLEDevice.h"
#include "BLEServer.h"
#include "BLEUtils.h"
#include "BLE2902.h"
#include "config.h"

class BLEManager {
private:
    BLEServer* pServer;
    BLEService* pService;
    BLECharacteristic* pWaterCharacteristic;
    BLECharacteristic* pCommandCharacteristic;
    bool deviceConnected;
    bool oldDeviceConnected;
    
    // LED control
    void blinkLED(int times, int onMs = LED_BLINK_ON_MS, int offMs = LED_BLINK_OFF_MS) {
        for (int i = 0; i < times; i++) {
            digitalWrite(LED_PIN, HIGH);
            delay(onMs);
            digitalWrite(LED_PIN, LOW);
            if (i < times - 1) delay(offMs);
        }
    }
    
public:
    BLEManager() {
        pServer = nullptr;
        pService = nullptr;
        pWaterCharacteristic = nullptr;
        pCommandCharacteristic = nullptr;
        deviceConnected = false;
        oldDeviceConnected = false;
    }
    
    /**
     * Initialize the BLE server and start advertising
     */
    void begin() {
        Serial.println("Initializing BLE...");
        
        // Initialize BLE with iPhone-optimized settings
        BLEDevice::init(DEVICE_NAME);
        
        // Set power level for better iPhone connectivity
        BLEDevice::setPower(ESP_PWR_LVL_P9);
        
        Serial.println("BLE initialized with device name: " + String(DEVICE_NAME));
        
        // Create BLE server
        pServer = BLEDevice::createServer();
        pServer->setCallbacks(new ServerCallbacks(this));
        
        // Create service
        pService = pServer->createService(SERVICE_UUID);
        
        // Create Water Data Characteristic (NOTIFY + READ)
        pWaterCharacteristic = pService->createCharacteristic(
            WATER_CHARACTERISTIC_UUID,
            BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
        );
        
        // Add descriptor for notifications
        pWaterCharacteristic->addDescriptor(new BLE2902());
        
        // Create Command Characteristic (WRITE)
        pCommandCharacteristic = pService->createCharacteristic(
            COMMAND_CHARACTERISTIC_UUID,
            BLECharacteristic::PROPERTY_WRITE
        );
        pCommandCharacteristic->setCallbacks(new CommandCallbacks(this));
        
        // Start the service
        pService->start();
        
        // Configure advertising for iPhone compatibility
        BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
        pAdvertising->addServiceUUID(SERVICE_UUID);
        pAdvertising->setScanResponse(true);
        pAdvertising->setMinPreferred(0x06);  // Functions that help with iPhone connections
        pAdvertising->setMaxPreferred(0x12);
        BLEDevice::startAdvertising();
        
        Serial.println("BLE Server started, advertising...");
        Serial.println("Device name: " + String(DEVICE_NAME));
        Serial.println("Service UUID: " + String(SERVICE_UUID));
        Serial.println("Looking for 'WaterTracker' in BLE scanner apps");
    }
    
    /**
     * Send water data to connected device
     * @param ml Amount of water consumed in milliliters
     */
    void sendWaterData(int ml) {
        if (deviceConnected && pWaterCharacteristic) {
            unsigned long timestamp = millis();
            String data = "ML:" + String(ml) + ",TS:" + String(timestamp);
            
            pWaterCharacteristic->setValue(data.c_str());
            pWaterCharacteristic->notify();
            
            Serial.println("Sent: " + data);
            
            // Blink LED to indicate data sent
            digitalWrite(LED_PIN, HIGH);
            delay(LED_DATA_SENT_MS);
            digitalWrite(LED_PIN, LOW);
        }
    }
    
    /**
     * Handle incoming commands from the app
     * @param command Command string received from app
     */
    void handleCommand(String command) {
        Serial.println("Received command: " + command);
        
        if (command == "RESET") {
            // TODO: Call waterSensor.reset() - will be handled in main loop
            Serial.println("Reset command received");
        } else if (command == "STATUS") {
            // Send status response
            String status = "STATUS:OK,BATTERY:100,MODE:SIM";
            if (pWaterCharacteristic) {
                pWaterCharacteristic->setValue(status.c_str());
                pWaterCharacteristic->notify();
                Serial.println("Sent status: " + status);
            }
        }
    }
    
    /**
     * Check if device is connected
     * @return true if device is connected
     */
    bool isConnected() {
        return deviceConnected;
    }
    
    /**
     * Handle connection state changes
     * Call this in the main loop
     */
    void handleConnectionState() {
        // Disconnecting
        if (!deviceConnected && oldDeviceConnected) {
            delay(500); // Give the bluetooth stack the chance to get things ready
            pServer->startAdvertising(); // Restart advertising
            Serial.println("Device disconnected! Restarting advertising...");
            oldDeviceConnected = deviceConnected;
        }
        
        // Connecting
        if (deviceConnected && !oldDeviceConnected) {
            Serial.println("Device connected!");
            blinkLED(3); // 3 blinks on connect
            oldDeviceConnected = deviceConnected;
        }
    }
    
    /**
     * Set device connected state (called by callbacks)
     */
    void setDeviceConnected(bool connected) {
        deviceConnected = connected;
    }
    
private:
    // Server callbacks
    class ServerCallbacks : public BLEServerCallbacks {
    private:
        BLEManager* bleManager;
        
    public:
        ServerCallbacks(BLEManager* manager) : bleManager(manager) {}
        
        void onConnect(BLEServer* pServer) {
            bleManager->setDeviceConnected(true);
            Serial.println("iPhone connected!");
        }
        
        void onDisconnect(BLEServer* pServer) {
            bleManager->setDeviceConnected(false);
            Serial.println("iPhone disconnected");
        }
    };
    
    // Command characteristic callbacks
    class CommandCallbacks : public BLECharacteristicCallbacks {
    private:
        BLEManager* bleManager;
        
    public:
        CommandCallbacks(BLEManager* manager) : bleManager(manager) {}
        
        void onWrite(BLECharacteristic* pCharacteristic) {
            String command = pCharacteristic->getValue();
            bleManager->handleCommand(command);
        }
    };
};

#endif // BLEMANAGER_H