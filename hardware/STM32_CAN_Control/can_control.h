/**
 * @file can_control.h
 * @brief CAN Bus Motor Control Module Header
 * 
 * This module provides high-level motor control functions for commanding
 * MKS Dual FOC Plus motor driver boards via CAN bus using STM32 HAL.
 * 
 * Hardware:
 * - STM32 MCU (Master Controller)
 * - WCMCU-230 CAN Transceiver (SN65HVD230 - 3.3V logic)
 * - MKS Dual FOC Plus (Slave nodes)
 * - GL30 BLDC Motors (12V, 7.4A Peak, 2.13A Continuous)
 * 
 * CAN Configuration:
 * - Pins: PA12 (CAN_TX), PA11 (CAN_RX)
 * - Standard 11-bit Identifier
 * - Baud Rate: 1 Mbps (configurable to 500 kbps)
 * - Frame: 8-byte data payload
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-13
 */

#ifndef CAN_CONTROL_H
#define CAN_CONTROL_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "stm32f1xx_hal.h"  // Change to your specific STM32 family (f1xx, f4xx, etc.)
#include <stdint.h>
#include <stdbool.h>

/* Exported types ------------------------------------------------------------*/

/**
 * @brief CAN Motor Control Status
 */
typedef enum {
    CAN_MOTOR_OK       = 0x00,
    CAN_MOTOR_ERROR    = 0x01,
    CAN_MOTOR_TIMEOUT  = 0x02,
    CAN_MOTOR_BUSY     = 0x03
} CAN_MotorStatus_t;

/**
 * @brief Motor Command Types
 * These match the MKS/SimpleFOC command protocol.
 * Verify these values with your specific MKS firmware version.
 */
typedef enum {
    MOTOR_CMD_DISABLE  = 0x00,  // Disable motor (coast)
    MOTOR_CMD_ENABLE   = 0x01,  // Enable motor control
    MOTOR_CMD_SET_TARGET = 0x02, // Set target velocity/position/torque
    MOTOR_CMD_GET_STATUS = 0x03  // Request motor status (future expansion)
} Motor_Command_t;

/**
 * @brief CAN Control Module Configuration
 */
typedef struct {
    CAN_HandleTypeDef *hcan;      // Pointer to HAL CAN handle
    uint32_t timeout_ms;          // Transmission timeout in milliseconds
    bool filter_configured;       // Filter initialization status
} CAN_Control_Config_t;

/* Exported constants --------------------------------------------------------*/

// CAN Node IDs - Modify these based on your MKS board DIP switch settings
#define MKS_NODE_ID_MOTOR_1     0x141  // Example: Motor 1 CAN ID
#define MKS_NODE_ID_MOTOR_2     0x142  // Example: Motor 2 CAN ID

// CAN Timing Configuration
#define CAN_DEFAULT_TIMEOUT_MS  100    // Default transmission timeout

/* Exported macro ------------------------------------------------------------*/

/* Exported functions prototypes ---------------------------------------------*/

/**
 * @brief Initialize CAN peripheral with 1 Mbps baud rate
 * 
 * This function configures the CAN peripheral with the following settings:
 * - APB1 Clock: 36 MHz (typical for STM32F1/F4)
 * - Prescaler: 2
 * - Time Quanta: 18 TQ (1 TQ + 13 TQ + 4 TQ)
 * - Baud Rate: 36MHz / (2 * 18) = 1 Mbps
 * 
 * For 500 kbps: Set Prescaler to 4 (see comments in .c file)
 * 
 * @param hcan: Pointer to CAN handle structure
 * @retval HAL status
 */
HAL_StatusTypeDef CAN_Control_Init(CAN_HandleTypeDef *hcan);

/**
 * @brief Configure CAN filter to accept all incoming messages
 * 
 * Sets up filter bank with mask 0x0000 to ensure proper ACK reception
 * from MKS slave nodes and avoid bus errors.
 * 
 * @param hcan: Pointer to CAN handle structure
 * @retval HAL status
 */
HAL_StatusTypeDef CAN_Control_ConfigFilter(CAN_HandleTypeDef *hcan);

/**
 * @brief Start CAN communication
 * 
 * Activates CAN peripheral and enables notifications.
 * Call this after initialization and filter configuration.
 * 
 * @param hcan: Pointer to CAN handle structure
 * @retval HAL status
 */
HAL_StatusTypeDef CAN_Control_Start(CAN_HandleTypeDef *hcan);

/**
 * @brief Send Enable command to motor
 * 
 * Constructs and transmits an 8-byte CAN frame to enable the specified motor.
 * Frame format: [CMD, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
 * 
 * @param hcan: Pointer to CAN handle structure
 * @param node_id: CAN identifier of target motor (e.g., MKS_NODE_ID_MOTOR_1)
 * @retval CAN_MotorStatus_t
 */
CAN_MotorStatus_t CAN_Motor_Enable(CAN_HandleTypeDef *hcan, uint32_t node_id);

/**
 * @brief Send Disable command to motor
 * 
 * Constructs and transmits an 8-byte CAN frame to disable the specified motor.
 * Frame format: [CMD, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
 * 
 * @param hcan: Pointer to CAN handle structure
 * @param node_id: CAN identifier of target motor
 * @retval CAN_MotorStatus_t
 */
CAN_MotorStatus_t CAN_Motor_Disable(CAN_HandleTypeDef *hcan, uint32_t node_id);

/**
 * @brief Send Set Target command to motor
 * 
 * Constructs and transmits an 8-byte CAN frame with a float target value.
 * The target can represent velocity (rad/s), position (rad), or torque (Nm)
 * depending on your MKS SimpleFOC controller mode.
 * 
 * Frame format: [CMD, float_byte0, float_byte1, float_byte2, float_byte3, 0x00, 0x00, 0x00]
 * 
 * @param hcan: Pointer to CAN handle structure
 * @param node_id: CAN identifier of target motor
 * @param target_value: Target setpoint (velocity/position/torque)
 * @retval CAN_MotorStatus_t
 */
CAN_MotorStatus_t CAN_Motor_SetTarget(CAN_HandleTypeDef *hcan, uint32_t node_id, float target_value);

/**
 * @brief Get last CAN error code
 * 
 * @param hcan: Pointer to CAN handle structure
 * @retval CAN error code (HAL_CAN_ERROR_xxx)
 */
uint32_t CAN_Control_GetError(CAN_HandleTypeDef *hcan);

/**
 * @brief Check if CAN bus is in error state
 * 
 * @param hcan: Pointer to CAN handle structure
 * @retval true if error state detected, false otherwise
 */
bool CAN_Control_IsError(CAN_HandleTypeDef *hcan);

/**
 * @brief Recover from CAN bus-off state
 * 
 * Attempts to reset the CAN peripheral and restart communication
 * after a bus-off error condition.
 * 
 * @param hcan: Pointer to CAN handle structure
 * @retval HAL status
 */
HAL_StatusTypeDef CAN_Control_RecoverFromError(CAN_HandleTypeDef *hcan);

/* HAL Callback Prototypes (weak implementations in can_control.c) -----------*/

/**
 * @brief CAN transmission complete callback
 * 
 * Override this function in your application code to handle successful transmissions.
 */
void HAL_CAN_TxMailbox0CompleteCallback(CAN_HandleTypeDef *hcan);
void HAL_CAN_TxMailbox1CompleteCallback(CAN_HandleTypeDef *hcan);
void HAL_CAN_TxMailbox2CompleteCallback(CAN_HandleTypeDef *hcan);

/**
 * @brief CAN error callback
 * 
 * Override this function to handle CAN errors (bus-off, arbitration loss, etc.)
 */
void HAL_CAN_ErrorCallback(CAN_HandleTypeDef *hcan);

/**
 * @brief CAN RX FIFO message pending callback
 * 
 * Override this function to handle incoming messages from MKS boards.
 */
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan);

#ifdef __cplusplus
}
#endif

#endif /* CAN_CONTROL_H */
