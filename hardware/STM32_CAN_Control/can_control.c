/**
 * @file can_control.c
 * @brief CAN Bus Motor Control Module Implementation
 * 
 * This module implements motor control functions for MKS Dual FOC Plus boards
 * using STM32 HAL CAN driver. Provides robust error handling and state management.
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-13
 */

/* Includes ------------------------------------------------------------------*/
#include "can_control.h"
#include <string.h>

/* Private typedef -----------------------------------------------------------*/

/* Private define ------------------------------------------------------------*/
#define CAN_TX_TIMEOUT_MS       CAN_DEFAULT_TIMEOUT_MS
#define CAN_PAYLOAD_SIZE        8

/* Private macro -------------------------------------------------------------*/

/* Private variables ---------------------------------------------------------*/
static CAN_Control_Config_t can_config = {0};

/* Private function prototypes -----------------------------------------------*/
static CAN_MotorStatus_t CAN_SendCommand(CAN_HandleTypeDef *hcan, 
                                          uint32_t node_id, 
                                          Motor_Command_t cmd,
                                          const uint8_t *data, 
                                          uint8_t data_len);
static void float_to_bytes(float value, uint8_t *bytes);

/* Exported functions --------------------------------------------------------*/

/**
 * @brief Initialize CAN peripheral with 1 Mbps baud rate
 * 
 * CAN Bit Timing Calculation:
 * ===========================
 * Assumptions:
 * - APB1 Clock: 36 MHz (typical for STM32F103, STM32F407)
 * - Desired Baud Rate: 1 Mbps
 * 
 * Formula: Baud Rate = APB1_Clock / (Prescaler × (1 + BS1 + BS2))
 * 
 * Configuration for 1 Mbps:
 * - Prescaler: 2
 * - Time Segment 1 (BS1): 13 TQ (CAN_BS1_13TQ)
 * - Time Segment 2 (BS2): 4 TQ (CAN_BS2_4TQ)
 * - Sync Jump Width (SJW): 1 TQ
 * - Total TQ per bit: 1 + 13 + 4 = 18 TQ
 * - Baud Rate = 36MHz / (2 × 18) = 1,000,000 bps = 1 Mbps
 * - Sample Point: (1 + 13) / 18 = 77.8%
 * 
 * Configuration for 500 kbps (if MKS defaults to this):
 * - Change Prescaler to 4
 * - Keep BS1 = 13 TQ, BS2 = 4 TQ
 * - Baud Rate = 36MHz / (4 × 18) = 500,000 bps = 500 kbps
 * 
 * For STM32F4 with APB1 @ 42 MHz:
 * - 1 Mbps: Prescaler = 3, BS1 = 11 TQ, BS2 = 2 TQ → 42MHz / (3 × 14) = 1 Mbps
 * - 500 kbps: Prescaler = 6
 * 
 * @note Adjust the prescaler based on your STM32 variant and clock configuration
 */
HAL_StatusTypeDef CAN_Control_Init(CAN_HandleTypeDef *hcan)
{
    if (hcan == NULL) {
        return HAL_ERROR;
    }
    
    // Store handle for later use
    can_config.hcan = hcan;
    can_config.timeout_ms = CAN_TX_TIMEOUT_MS;
    can_config.filter_configured = false;
    
    // CAN peripheral basic configuration
    hcan->Instance = CAN1;  // Change to CAN2 if using second CAN peripheral
    hcan->Init.Prescaler = 2;  // For 1 Mbps @ 36 MHz APB1
                                // Change to 4 for 500 kbps
    
    hcan->Init.Mode = CAN_MODE_NORMAL;  // Normal operating mode
    hcan->Init.SyncJumpWidth = CAN_SJW_1TQ;
    hcan->Init.TimeSeg1 = CAN_BS1_13TQ;
    hcan->Init.TimeSeg2 = CAN_BS2_4TQ;
    
    // Automatic features
    hcan->Init.TimeTriggeredMode = DISABLE;  // No time-triggered mode
    hcan->Init.AutoBusOff = ENABLE;          // Automatic recovery from bus-off
    hcan->Init.AutoWakeUp = DISABLE;         // No automatic wakeup
    hcan->Init.AutoRetransmission = ENABLE;  // Automatic retransmission on error
    hcan->Init.ReceiveFifoLocked = DISABLE;  // FIFO not locked on overrun
    hcan->Init.TransmitFifoPriority = DISABLE; // Priority by identifier, not request order
    
    // Initialize CAN peripheral
    if (HAL_CAN_Init(hcan) != HAL_OK) {
        return HAL_ERROR;
    }
    
    return HAL_OK;
}

/**
 * @brief Configure CAN filter to accept all incoming messages
 * 
 * Filter Configuration Strategy:
 * =============================
 * To ensure proper ACK reception from MKS slave nodes and avoid bus errors,
 * we configure the filter with a mask of 0x0000, which accepts ALL CAN IDs.
 * 
 * Filter Bank 0:
 * - Mode: Mask mode (ID + Mask comparison)
 * - Scale: 32-bit
 * - FIFO: FIFO0
 * - ID: 0x0000 (don't care)
 * - Mask: 0x0000 (accept all)
 * 
 * Alternative: If you want to filter specific node IDs, use:
 * - FilterIdHigh = (node_id << 5)
 * - FilterMaskIdHigh = 0xFFE0 (match exact 11-bit ID)
 */
HAL_StatusTypeDef CAN_Control_ConfigFilter(CAN_HandleTypeDef *hcan)
{
    if (hcan == NULL) {
        return HAL_ERROR;
    }
    
    CAN_FilterTypeDef filter_config;
    
    // Filter bank 0 configuration - Accept all messages
    filter_config.FilterBank = 0;
    filter_config.FilterMode = CAN_FILTERMODE_IDMASK;
    filter_config.FilterScale = CAN_FILTERSCALE_32BIT;
    filter_config.FilterIdHigh = 0x0000;      // ID bits [28:13]
    filter_config.FilterIdLow = 0x0000;       // ID bits [12:0] + RTR + IDE
    filter_config.FilterMaskIdHigh = 0x0000;  // Mask high - accept all
    filter_config.FilterMaskIdLow = 0x0000;   // Mask low - accept all
    filter_config.FilterFIFOAssignment = CAN_RX_FIFO0;
    filter_config.FilterActivation = CAN_FILTER_ENABLE;
    filter_config.SlaveStartFilterBank = 14;  // For dual CAN configurations
    
    if (HAL_CAN_ConfigFilter(hcan, &filter_config) != HAL_OK) {
        return HAL_ERROR;
    }
    
    can_config.filter_configured = true;
    
    return HAL_OK;
}

/**
 * @brief Start CAN communication
 */
HAL_StatusTypeDef CAN_Control_Start(CAN_HandleTypeDef *hcan)
{
    if (hcan == NULL || !can_config.filter_configured) {
        return HAL_ERROR;
    }
    
    // Start the CAN peripheral
    if (HAL_CAN_Start(hcan) != HAL_OK) {
        return HAL_ERROR;
    }
    
    // Enable RX FIFO message pending interrupt
    if (HAL_CAN_ActivateNotification(hcan, CAN_IT_RX_FIFO0_MSG_PENDING) != HAL_OK) {
        return HAL_ERROR;
    }
    
    // Enable error interrupts for monitoring
    if (HAL_CAN_ActivateNotification(hcan, CAN_IT_ERROR | CAN_IT_BUSOFF | 
                                            CAN_IT_LAST_ERROR_CODE) != HAL_OK) {
        return HAL_ERROR;
    }
    
    return HAL_OK;
}

/**
 * @brief Send Enable command to motor
 * 
 * CAN Frame Structure:
 * ====================
 * Byte 0: Command (0x01 = Enable)
 * Bytes 1-7: Reserved (0x00)
 * 
 * @note Verify command byte with your MKS firmware documentation
 */
CAN_MotorStatus_t CAN_Motor_Enable(CAN_HandleTypeDef *hcan, uint32_t node_id)
{
    uint8_t data[CAN_PAYLOAD_SIZE] = {0};
    data[0] = MOTOR_CMD_ENABLE;  // Command byte
    
    return CAN_SendCommand(hcan, node_id, MOTOR_CMD_ENABLE, data, CAN_PAYLOAD_SIZE);
}

/**
 * @brief Send Disable command to motor
 * 
 * CAN Frame Structure:
 * ====================
 * Byte 0: Command (0x00 = Disable)
 * Bytes 1-7: Reserved (0x00)
 */
CAN_MotorStatus_t CAN_Motor_Disable(CAN_HandleTypeDef *hcan, uint32_t node_id)
{
    uint8_t data[CAN_PAYLOAD_SIZE] = {0};
    data[0] = MOTOR_CMD_DISABLE;  // Command byte
    
    return CAN_SendCommand(hcan, node_id, MOTOR_CMD_DISABLE, data, CAN_PAYLOAD_SIZE);
}

/**
 * @brief Send Set Target command to motor
 * 
 * CAN Frame Structure:
 * ====================
 * Byte 0: Command (0x02 = Set Target)
 * Bytes 1-4: Target value as float (little-endian IEEE 754)
 * Bytes 5-7: Reserved (0x00)
 * 
 * The target_value interpretation depends on SimpleFOC controller mode:
 * - Velocity mode: rad/s
 * - Position mode: rad (or degrees if configured)
 * - Torque mode: Nm (or A if current control)
 * 
 * Example:
 * - Set velocity to 10 rad/s: CAN_Motor_SetTarget(hcan, node_id, 10.0f)
 * - Set position to 2π rad: CAN_Motor_SetTarget(hcan, node_id, 6.28318f)
 */
CAN_MotorStatus_t CAN_Motor_SetTarget(CAN_HandleTypeDef *hcan, uint32_t node_id, float target_value)
{
    uint8_t data[CAN_PAYLOAD_SIZE] = {0};
    
    // Construct payload
    data[0] = MOTOR_CMD_SET_TARGET;  // Command byte
    
    // Pack float into bytes 1-4 (little-endian)
    float_to_bytes(target_value, &data[1]);
    
    // Bytes 5-7 remain 0x00 (reserved)
    
    return CAN_SendCommand(hcan, node_id, MOTOR_CMD_SET_TARGET, data, CAN_PAYLOAD_SIZE);
}

/**
 * @brief Get last CAN error code
 */
uint32_t CAN_Control_GetError(CAN_HandleTypeDef *hcan)
{
    if (hcan == NULL) {
        return HAL_CAN_ERROR_NONE;
    }
    return HAL_CAN_GetError(hcan);
}

/**
 * @brief Check if CAN bus is in error state
 */
bool CAN_Control_IsError(CAN_HandleTypeDef *hcan)
{
    if (hcan == NULL) {
        return true;
    }
    
    uint32_t error = HAL_CAN_GetError(hcan);
    return (error != HAL_CAN_ERROR_NONE);
}

/**
 * @brief Recover from CAN bus-off state
 * 
 * Recovery sequence:
 * 1. Stop CAN peripheral
 * 2. Reset error flags
 * 3. Re-initialize CAN
 * 4. Restart communication
 */
HAL_StatusTypeDef CAN_Control_RecoverFromError(CAN_HandleTypeDef *hcan)
{
    if (hcan == NULL) {
        return HAL_ERROR;
    }
    
    // Stop CAN
    HAL_CAN_Stop(hcan);
    
    // Small delay to allow bus to settle
    HAL_Delay(10);
    
    // Reset peripheral
    HAL_CAN_ResetError(hcan);
    
    // Re-initialize
    if (CAN_Control_Init(hcan) != HAL_OK) {
        return HAL_ERROR;
    }
    
    // Reconfigure filter
    if (CAN_Control_ConfigFilter(hcan) != HAL_OK) {
        return HAL_ERROR;
    }
    
    // Restart
    if (CAN_Control_Start(hcan) != HAL_OK) {
        return HAL_ERROR;
    }
    
    return HAL_OK;
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Generic CAN command transmission function
 * 
 * This function constructs a CAN message with standard 11-bit identifier
 * and transmits it via the HAL CAN driver.
 * 
 * @param hcan: CAN handle
 * @param node_id: Target node CAN identifier (11-bit)
 * @param cmd: Command type (for logging/debugging)
 * @param data: Pointer to 8-byte payload
 * @param data_len: Length of data (should be 8)
 * @retval CAN_MotorStatus_t
 */
static CAN_MotorStatus_t CAN_SendCommand(CAN_HandleTypeDef *hcan, 
                                          uint32_t node_id, 
                                          Motor_Command_t cmd,
                                          const uint8_t *data, 
                                          uint8_t data_len)
{
    if (hcan == NULL || data == NULL || data_len != CAN_PAYLOAD_SIZE) {
        return CAN_MOTOR_ERROR;
    }
    
    CAN_TxHeaderTypeDef tx_header;
    uint32_t tx_mailbox;
    
    // Configure TX header
    tx_header.StdId = node_id;              // 11-bit standard identifier
    tx_header.ExtId = 0x00;                  // Not using extended ID
    tx_header.RTR = CAN_RTR_DATA;            // Data frame (not remote request)
    tx_header.IDE = CAN_ID_STD;              // Standard identifier
    tx_header.DLC = data_len;                // Data length code (8 bytes)
    tx_header.TransmitGlobalTime = DISABLE;  // No timestamp
    
    // Check if a TX mailbox is free
    if (HAL_CAN_GetTxMailboxesFreeLevel(hcan) == 0) {
        return CAN_MOTOR_BUSY;  // All mailboxes full
    }
    
    // Add message to TX mailbox
    HAL_StatusTypeDef status = HAL_CAN_AddTxMessage(hcan, &tx_header, (uint8_t*)data, &tx_mailbox);
    
    if (status != HAL_OK) {
        // Check for specific errors
        uint32_t error = HAL_CAN_GetError(hcan);
        
        if (error & HAL_CAN_ERROR_TIMEOUT) {
            return CAN_MOTOR_TIMEOUT;
        }
        
        return CAN_MOTOR_ERROR;
    }
    
    // Optional: Wait for transmission completion with timeout
    uint32_t timeout = HAL_GetTick() + can_config.timeout_ms;
    while (HAL_CAN_IsTxMessagePending(hcan, tx_mailbox)) {
        if (HAL_GetTick() > timeout) {
            return CAN_MOTOR_TIMEOUT;
        }
    }
    
    return CAN_MOTOR_OK;
}

/**
 * @brief Convert float to byte array (little-endian)
 * 
 * Uses union to safely convert between float and byte representation
 * following IEEE 754 standard.
 * 
 * @param value: Float value to convert
 * @param bytes: Output byte array (must be at least 4 bytes)
 */
static void float_to_bytes(float value, uint8_t *bytes)
{
    union {
        float f;
        uint8_t b[4];
    } float_union;
    
    float_union.f = value;
    
    // Copy bytes (little-endian order)
    bytes[0] = float_union.b[0];
    bytes[1] = float_union.b[1];
    bytes[2] = float_union.b[2];
    bytes[3] = float_union.b[3];
}

/* HAL Callback Implementations (Weak) ---------------------------------------*/

/**
 * @brief TX mailbox complete callbacks
 * 
 * These callbacks are invoked when a CAN message transmission completes successfully.
 * Override these in your main application if you need transmission confirmation.
 */
__weak void HAL_CAN_TxMailbox0CompleteCallback(CAN_HandleTypeDef *hcan)
{
    /* Prevent unused argument compilation warning */
    UNUSED(hcan);
    
    /* NOTE: This function should not be modified, when the callback is needed,
             the HAL_CAN_TxMailbox0CompleteCallback can be implemented in the user file */
}

__weak void HAL_CAN_TxMailbox1CompleteCallback(CAN_HandleTypeDef *hcan)
{
    UNUSED(hcan);
}

__weak void HAL_CAN_TxMailbox2CompleteCallback(CAN_HandleTypeDef *hcan)
{
    UNUSED(hcan);
}

/**
 * @brief CAN Error Callback
 * 
 * This callback is invoked when CAN errors occur:
 * - HAL_CAN_ERROR_EWG: Error warning (TX or RX error counter > 96)
 * - HAL_CAN_ERROR_EPV: Error passive (TX or RX error counter > 127)
 * - HAL_CAN_ERROR_BOF: Bus-off (TX error counter > 255)
 * - HAL_CAN_ERROR_STF: Stuff error
 * - HAL_CAN_ERROR_FOR: Form error
 * - HAL_CAN_ERROR_ACK: Acknowledgment error (no slave responded)
 * - HAL_CAN_ERROR_BR: Bit recessive error
 * - HAL_CAN_ERROR_BD: Bit dominant error
 * - HAL_CAN_ERROR_CRC: CRC error
 * 
 * Override this function to implement error logging, LED indicators, or recovery logic.
 */
__weak void HAL_CAN_ErrorCallback(CAN_HandleTypeDef *hcan)
{
    UNUSED(hcan);
    
    uint32_t error = HAL_CAN_GetError(hcan);
    
    // Example error handling (implement your own logic):
    if (error & HAL_CAN_ERROR_BOF) {
        // Bus-off detected - attempt recovery
        // CAN_Control_RecoverFromError(hcan);
    }
    
    if (error & HAL_CAN_ERROR_ACK) {
        // No ACK received - check if MKS boards are powered and connected
        // Check common ground connection
    }
    
    /* NOTE: Implement your error handling strategy here */
}

/**
 * @brief RX FIFO0 Message Pending Callback
 * 
 * This callback is invoked when a new CAN message is received in FIFO0.
 * Override this function to process incoming messages from MKS boards
 * (e.g., status updates, telemetry, acknowledgments).
 * 
 * Example usage:
 * - Read motor position feedback
 * - Monitor motor current/voltage
 * - Detect fault conditions
 */
__weak void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    UNUSED(hcan);
    
    CAN_RxHeaderTypeDef rx_header;
    uint8_t rx_data[8];
    
    // Retrieve message from FIFO0
    if (HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &rx_header, rx_data) == HAL_OK) {
        // Process received message
        uint32_t node_id = rx_header.StdId;
        uint8_t data_length = rx_header.DLC;
        
        // Example: Parse motor status response
        // if (node_id == MKS_NODE_ID_MOTOR_1) {
        //     // Process Motor 1 data
        // }
        
        /* NOTE: Implement your RX message handling here */
    }
}
