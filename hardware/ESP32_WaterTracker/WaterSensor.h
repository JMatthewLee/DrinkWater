#ifndef WATERSENSOR_H
#define WATERSENSOR_H

#include <Arduino.h>
#include "config.h"

class WaterSensor {
private:
    unsigned long lastSimulationTime;
    int totalConsumed;
    bool autoSimulateEnabled;
    
public:
    WaterSensor() {
        lastSimulationTime = 0;
        totalConsumed = 0;
        autoSimulateEnabled = true;
    }
    
    /**
     * Simulate a water drinking event
     * @return Random amount of water consumed (0-500mL)
     */
    int simulateDrink() {
        int amount = random(WATER_MIN_ML, WATER_MAX_ML + 1);
        totalConsumed += amount;
        Serial.println("Simulated drink: " + String(amount) + " mL");
        return amount;
    }
    
    /**
     * Check if enough time has passed for auto-simulation
     * @return true if 5 seconds have elapsed since last simulation
     */
    bool shouldSimulate() {
        if (!autoSimulateEnabled) return false;
        
        unsigned long currentTime = millis();
        if (currentTime - lastSimulationTime >= SIMULATION_INTERVAL) {
            lastSimulationTime = currentTime;
            return true;
        }
        return false;
    }
    
    /**
     * Manually trigger a water event (button press)
     * @return Amount of water consumed
     */
    int manualTrigger() {
        Serial.println("Manual trigger activated!");
        return simulateDrink();
    }
    
    /**
     * Get total water consumed in current session
     * @return Total milliliters consumed
     */
    int getTotalConsumed() {
        return totalConsumed;
    }
    
    /**
     * Reset the water consumption counter
     */
    void reset() {
        totalConsumed = 0;
        Serial.println("Water consumption counter reset");
    }
    
    /**
     * Enable or disable auto-simulation
     * @param enabled true to enable auto-simulation, false to disable
     */
    void setAutoSimulate(bool enabled) {
        autoSimulateEnabled = enabled;
        Serial.println("Auto-simulation " + String(enabled ? "enabled" : "disabled"));
    }
    
    /**
     * Get auto-simulation status
     * @return true if auto-simulation is enabled
     */
    bool isAutoSimulateEnabled() {
        return autoSimulateEnabled;
    }
    
    /**
     * TODO: Future implementation for real sensor integration
     * This method will be replaced with actual sensor reading
     * when physical sensors (ultrasonic, flow meter, etc.) are connected
     */
    int readRealSensor() {
        // TODO: Implement real sensor reading
        // Example for ultrasonic sensor:
        // return ultrasonicSensor.readDistance();
        // Example for flow meter:
        // return flowMeter.readFlowRate();
        return 0;
    }
};

#endif // WATERSENSOR_H
