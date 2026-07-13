/**
 * @file config_template.h
 * @brief Configuration template for CAN motor control
 * 
 * Copy this file and customize for your specific hardware setup.
 * Rename to "config.h" and include in your project.
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-13
 */

#ifndef CONFIG_TEMPLATE_H
#define CONFIG_TEMPLATE_H

/* ============================================================================
   STEP 1: SELECT YOUR STM32 FAMILY
   ============================================================================ */

// Uncomment your STM32 family:
// #define STM32F103         // STM32F103 (Blue Pill, etc.)
// #define STM32F407         // STM32F407 Discovery
// #define STM32F429         // STM32F429 Discovery
// #define STM32F746         // STM32F746 Discovery
// #define STM32H743         // STM32H743 Nucleo

/* ============================================================================
   STEP 2: CONFIGURE CAN NODE IDs
   ============================================================================ */

// MKS Dual FOC Plus Node IDs (verify with DIP switch settings)
#define MKS_NODE_ID_MOTOR_1     0x141    // Motor 1 CAN ID
#define MKS_NODE_ID_MOTOR_2     0x142    // Motor 2 CAN ID

// Additional motors (if using multiple MKS boards)
// #define MKS_NODE_ID_MOTOR_3     0x143
// #define MKS_NODE_ID_MOTOR_4     0x144

/* ============================================================================
   STEP 3: CONFIGURE CAN TIMING
   ============================================================================ */

// CAN Baud Rate Selection
// #define CAN_BAUDRATE_1000K    // 1 Mbps (high-speed)
// #define CAN_BAUDRATE_500K     // 500 kbps (common default)
// #define CAN_BAUDRATE_250K     // 250 kbps (robust for noisy environments)

// APB1 Clock Frequency (Hz) - must match your system clock configuration
#ifdef STM32F103
    #define APB1_CLOCK_HZ       36000000  // 36 MHz (typical for STM32F1)
#elif defined(STM32F407) || defined(STM32F429)
    #define APB1_CLOCK_HZ       42000000  // 42 MHz (typical for STM32F4)
#elif defined(STM32F746)
    #define APB1_CLOCK_HZ       54000000  // 54 MHz (typical for STM32F7)
#elif defined(STM32H743)
    #define APB1_CLOCK_HZ       120000000 // 120 MHz (typical for STM32H7)
#else
    #define APB1_CLOCK_HZ       36000000  // Default fallback
#endif

// CAN Prescaler (calculated based on baud rate and APB1 clock)
#ifdef CAN_BAUDRATE_1000K
    #if APB1_CLOCK_HZ == 36000000
        #define CAN_PRESCALER   2         // 36MHz / (2 * 18) = 1 Mbps
    #elif APB1_CLOCK_HZ == 42000000
        #define CAN_PRESCALER   3         // 42MHz / (3 * 14) = 1 Mbps
    #endif
#elif defined(CAN_BAUDRATE_500K)
    #if APB1_CLOCK_HZ == 36000000
        #define CAN_PRESCALER   4         // 36MHz / (4 * 18) = 500 kbps
    #elif APB1_CLOCK_HZ == 42000000
        #define CAN_PRESCALER   6         // 42MHz / (6 * 14) = 500 kbps
    #endif
#elif defined(CAN_BAUDRATE_250K)
    #if APB1_CLOCK_HZ == 36000000
        #define CAN_PRESCALER   8         // 36MHz / (8 * 18) = 250 kbps
    #elif APB1_CLOCK_HZ == 42000000
        #define CAN_PRESCALER   12        // 42MHz / (12 * 14) = 250 kbps
    #endif
#endif

/* ============================================================================
   STEP 4: CONFIGURE GPIO PINS
   ============================================================================ */

// CAN GPIO Pins (PA11/PA12 is standard, change if using alternate pins)
#define CAN_RX_GPIO_Port        GPIOA
#define CAN_RX_Pin              GPIO_PIN_11
#define CAN_TX_GPIO_Port        GPIOA
#define CAN_TX_Pin              GPIO_PIN_12

// Status LED Pin (for debugging)
#define LED_GPIO_Port           GPIOC
#define LED_Pin                 GPIO_PIN_13

// CAN Alternate Function (for STM32F4/F7/H7)
#define CAN_GPIO_AF             GPIO_AF9_CAN1  // Check datasheet for your MCU

/* ============================================================================
   STEP 5: CONFIGURE MOTOR PARAMETERS
   ============================================================================ */

// Motor Limits (GL30 specifications)
#define MOTOR_MAX_CURRENT_A     7.4f     // Peak current (A)
#define MOTOR_CONT_CURRENT_A    2.13f    // Continuous current (A)
#define MOTOR_VOLTAGE_V         12.0f    // Rated voltage (V)

// Velocity Limits (rad/s)
#define MOTOR_MAX_VELOCITY      50.0f    // Maximum safe velocity (rad/s)
#define MOTOR_MIN_VELOCITY      -50.0f   // Minimum velocity (reverse)

// Position Limits (rad)
#define MOTOR_MAX_POSITION      100.0f   // Maximum position (rad)
#define MOTOR_MIN_POSITION      -100.0f  // Minimum position (rad)

/* ============================================================================
   STEP 6: CONFIGURE SIMPLEFOC COMMAND PROTOCOL
   ============================================================================ */

// Verify these with your MKS firmware version
#define MOTOR_CMD_DISABLE       0x00     // Disable motor
#define MOTOR_CMD_ENABLE        0x01     // Enable motor
#define MOTOR_CMD_SET_TARGET    0x02     // Set target value
#define MOTOR_CMD_GET_STATUS    0x03     // Request status (future)

/* ============================================================================
   STEP 7: CONFIGURE TIMING AND TIMEOUTS
   ============================================================================ */

#define CAN_TX_TIMEOUT_MS       100      // CAN transmission timeout (ms)
#define MOTOR_CMD_INTERVAL_MS   50       // Minimum time between commands (ms)
#define HEARTBEAT_INTERVAL_MS   1000     // Status heartbeat interval (ms)

/* ============================================================================
   STEP 8: CONFIGURE SAFETY FEATURES
   ============================================================================ */

// Watchdog timeout (disable motors if no command received)
#define MOTOR_WATCHDOG_MS       500      // Watchdog timeout (ms)

// Enable/disable safety features
#define ENABLE_VELOCITY_LIMIT   1        // Clamp velocity to safe range
#define ENABLE_CURRENT_LIMIT    1        // Monitor current (requires feedback)
#define ENABLE_WATCHDOG         1        // Auto-disable on timeout

/* ============================================================================
   EXAMPLE CONFIGURATIONS
   ============================================================================ */

#if 0  // Example 1: STM32F103 Blue Pill @ 1 Mbps
#define STM32F103
#define CAN_BAUDRATE_1000K
#define MKS_NODE_ID_MOTOR_1     0x141
#define MKS_NODE_ID_MOTOR_2     0x142
#endif

#if 0  // Example 2: STM32F407 Discovery @ 500 kbps
#define STM32F407
#define CAN_BAUDRATE_500K
#define MKS_NODE_ID_MOTOR_1     0x140
#define MKS_NODE_ID_MOTOR_2     0x141
#define LED_GPIO_Port           GPIOD
#define LED_Pin                 GPIO_PIN_12  // Green LED on Discovery
#endif

#endif /* CONFIG_TEMPLATE_H */
