/**
 * @file main.c
 * @brief STM32 CAN Motor Control Application
 * 
 * This application demonstrates how to use the CAN control module to command
 * MKS Dual FOC Plus motor driver boards via CAN bus.
 * 
 * Hardware Setup:
 * ==============
 * 1. Connect WCMCU-230 CAN transceiver:
 *    - STM32 PA12 → CAN_TX (pin 1 of WCMCU-230)
 *    - STM32 PA11 → CAN_RX (pin 4 of WCMCU-230)
 *    - STM32 3.3V → VCC (pin 3 of WCMCU-230)
 *    - STM32 GND → GND (pin 2 of WCMCU-230)
 * 
 * 2. Connect CAN bus:
 *    - CANH (pin 7) → CAN bus high line
 *    - CANL (pin 6) → CAN bus low line
 *    - Add 120Ω termination resistor at each end of bus
 * 
 * 3. Power and ground:
 *    - Ensure common ground between STM32, WCMCU-230, and MKS boards
 *    - MKS boards powered by 12V 100A supply
 *    - STM32 powered separately (3.3V logic)
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-13
 */

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "can_control.h"

/* Private includes ----------------------------------------------------------*/

/* Private typedef -----------------------------------------------------------*/

/* Private define ------------------------------------------------------------*/
#define LED_PIN         GPIO_PIN_13  // Status LED (adjust for your board)
#define LED_PORT        GPIOC        // Adjust for your board

/* Private macro -------------------------------------------------------------*/

/* Private variables ---------------------------------------------------------*/
CAN_HandleTypeDef hcan1;
volatile bool can_error_detected = false;
volatile uint32_t can_rx_count = 0;

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_CAN1_Init(void);
static void Error_Handler(void);
static void Demo_MotorControl(void);

/**
 * @brief Application entry point
 */
int main(void)
{
    /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
    HAL_Init();
    
    /* Configure the system clock */
    SystemClock_Config();
    
    /* Initialize all configured peripherals */
    MX_GPIO_Init();
    
    /* Initialize CAN peripheral */
    MX_CAN1_Init();
    
    /* Configure CAN filter to accept all messages */
    if (CAN_Control_ConfigFilter(&hcan1) != HAL_OK) {
        Error_Handler();
    }
    
    /* Start CAN communication */
    if (CAN_Control_Start(&hcan1) != HAL_OK) {
        Error_Handler();
    }
    
    /* Blink LED to indicate successful initialization */
    HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_SET);
    HAL_Delay(500);
    HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
    HAL_Delay(500);
    
    /* Wait for bus to settle after startup */
    HAL_Delay(1000);
    
    /* Run motor control demo */
    Demo_MotorControl();
    
    /* Infinite loop */
    while (1)
    {
        /* Main application loop */
        
        // Check for CAN errors
        if (can_error_detected) {
            can_error_detected = false;
            
            // Toggle LED to indicate error
            HAL_GPIO_TogglePin(LED_PORT, LED_PIN);
            
            // Attempt recovery
            if (CAN_Control_RecoverFromError(&hcan1) == HAL_OK) {
                // Recovery successful
                HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
            }
        }
        
        // Example: Periodic heartbeat (1 Hz)
        HAL_Delay(1000);
        
        // Optional: Re-send motor commands periodically to maintain control
        // CAN_Motor_SetTarget(&hcan1, MKS_NODE_ID_MOTOR_1, 5.0f);
    }
}

/**
 * @brief System Clock Configuration
 * 
 * Configure system clock to achieve required APB1 frequency for CAN timing.
 * 
 * Example for STM32F103 (72 MHz max):
 * ===================================
 * - SYSCLK: 72 MHz (from PLL)
 * - AHB: 72 MHz (HCLK)
 * - APB1: 36 MHz (PCLK1) ← Important for CAN timing
 * - APB2: 72 MHz (PCLK2)
 * 
 * Example for STM32F407 (168 MHz max):
 * ====================================
 * - SYSCLK: 168 MHz (from PLL)
 * - AHB: 168 MHz (HCLK)
 * - APB1: 42 MHz (PCLK1) ← Important for CAN timing
 * - APB2: 84 MHz (PCLK2)
 * 
 * @note Use STM32CubeMX to generate this function for your specific MCU
 */
void SystemClock_Config(void)
{
    /* TODO: Configure system clock using STM32CubeMX generated code
     * 
     * Key requirements:
     * 1. Set APB1 clock to 36 MHz (STM32F1) or 42 MHz (STM32F4)
     * 2. Enable HSE or HSI oscillator
     * 3. Configure PLL for desired system frequency
     * 4. Set flash latency appropriately
     * 
     * Example skeleton (STM32F103):
     */
    
    #if 0  // Replace with your actual clock configuration
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
    
    // Configure HSE
    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState = RCC_HSE_ON;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;  // 8 MHz * 9 = 72 MHz
    if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) {
        Error_Handler();
    }
    
    // Configure clocks
    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                                 |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;   // 72 MHz
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;    // 36 MHz ← CAN clock
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;    // 72 MHz
    
    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK) {
        Error_Handler();
    }
    #endif
    
    /* NOTE: Use STM32CubeMX .ioc file to generate correct configuration */
}

/**
 * @brief CAN1 Initialization Function
 */
static void MX_CAN1_Init(void)
{
    /* CAN GPIO Configuration (PA11/PA12 for STM32F103)
     * 
     * For STM32F103:
     * PA11 → CAN_RX
     * PA12 → CAN_TX
     * 
     * For other STM32 families, check reference manual for alternate functions
     */
    
    // Enable CAN1 clock
    __HAL_RCC_CAN1_CLK_ENABLE();
    
    // Enable GPIO clocks
    __HAL_RCC_GPIOA_CLK_ENABLE();
    
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    
    /**CAN1 GPIO Configuration (STM32F103)
     * PA11 → CAN1_RX
     * PA12 → CAN1_TX
     */
    
    #ifdef STM32F1  // For STM32F1 series
        // CAN_RX (PA11) - Input pull-up
        GPIO_InitStruct.Pin = GPIO_PIN_11;
        GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
        GPIO_InitStruct.Pull = GPIO_PULLUP;
        HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
        
        // CAN_TX (PA12) - Alternate function push-pull
        GPIO_InitStruct.Pin = GPIO_PIN_12;
        GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
        GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
        HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
    #else  // For STM32F4/F7 and newer
        GPIO_InitStruct.Pin = GPIO_PIN_11 | GPIO_PIN_12;
        GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
        GPIO_InitStruct.Pull = GPIO_NOPULL;
        GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
        GPIO_InitStruct.Alternate = GPIO_AF9_CAN1;  // Check datasheet for correct AF
        HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
    #endif
    
    /* CAN1 interrupt Init */
    HAL_NVIC_SetPriority(CAN1_RX0_IRQn, 0, 0);
    HAL_NVIC_EnableIRQ(CAN1_RX0_IRQn);
    
    HAL_NVIC_SetPriority(CAN1_SCE_IRQn, 0, 0);  // Error interrupt
    HAL_NVIC_EnableIRQ(CAN1_SCE_IRQn);
    
    /* Initialize CAN peripheral with 1 Mbps */
    if (CAN_Control_Init(&hcan1) != HAL_OK) {
        Error_Handler();
    }
}

/**
 * @brief GPIO Initialization Function
 */
static void MX_GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    
    /* GPIO Ports Clock Enable */
    __HAL_RCC_GPIOC_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();
    
    /* Configure GPIO pin for LED */
    HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
    
    GPIO_InitStruct.Pin = LED_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(LED_PORT, &GPIO_InitStruct);
}

/**
 * @brief Motor Control Demo Function
 * 
 * Demonstrates the three basic motor control commands:
 * 1. Enable motor
 * 2. Set target velocity
 * 3. Disable motor
 * 
 * Customize this function based on your application requirements.
 */
static void Demo_MotorControl(void)
{
    CAN_MotorStatus_t status;
    
    /* Example 1: Enable Motor 1 */
    status = CAN_Motor_Enable(&hcan1, MKS_NODE_ID_MOTOR_1);
    if (status == CAN_MOTOR_OK) {
        // Command sent successfully
        HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_SET);
    } else {
        // Error occurred
        // Handle error (check wiring, power, node ID)
    }
    
    HAL_Delay(500);
    
    /* Example 2: Set Motor 1 target velocity to 5.0 rad/s */
    status = CAN_Motor_SetTarget(&hcan1, MKS_NODE_ID_MOTOR_1, 5.0f);
    if (status == CAN_MOTOR_OK) {
        // Motor should now spin at 5 rad/s
    }
    
    HAL_Delay(5000);  // Run for 5 seconds
    
    /* Example 3: Change velocity to 10.0 rad/s */
    CAN_Motor_SetTarget(&hcan1, MKS_NODE_ID_MOTOR_1, 10.0f);
    
    HAL_Delay(5000);  // Run for 5 seconds
    
    /* Example 4: Stop motor (set target to 0) */
    CAN_Motor_SetTarget(&hcan1, MKS_NODE_ID_MOTOR_1, 0.0f);
    
    HAL_Delay(2000);
    
    /* Example 5: Disable Motor 1 */
    status = CAN_Motor_Disable(&hcan1, MKS_NODE_ID_MOTOR_1);
    if (status == CAN_MOTOR_OK) {
        HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
    }
    
    /* Control both motors example */
    /*
    CAN_Motor_Enable(&hcan1, MKS_NODE_ID_MOTOR_1);
    CAN_Motor_Enable(&hcan1, MKS_NODE_ID_MOTOR_2);
    
    HAL_Delay(500);
    
    CAN_Motor_SetTarget(&hcan1, MKS_NODE_ID_MOTOR_1, 3.0f);  // 3 rad/s
    CAN_Motor_SetTarget(&hcan1, MKS_NODE_ID_MOTOR_2, -3.0f); // -3 rad/s (reverse)
    
    HAL_Delay(10000);
    
    CAN_Motor_Disable(&hcan1, MKS_NODE_ID_MOTOR_1);
    CAN_Motor_Disable(&hcan1, MKS_NODE_ID_MOTOR_2);
    */
}

/**
 * @brief This function is executed in case of error occurrence
 */
static void Error_Handler(void)
{
    /* User can add their own implementation to report the HAL error return state */
    __disable_irq();
    
    // Blink LED rapidly to indicate error
    while (1) {
        HAL_GPIO_TogglePin(LED_PORT, LED_PIN);
        HAL_Delay(100);
    }
}

/* Interrupt Service Routines -----------------------------------------------*/

/**
 * @brief CAN1 RX0 Interrupt Handler
 */
void CAN1_RX0_IRQHandler(void)
{
    HAL_CAN_IRQHandler(&hcan1);
}

/**
 * @brief CAN1 SCE (Status Change Error) Interrupt Handler
 */
void CAN1_SCE_IRQHandler(void)
{
    HAL_CAN_IRQHandler(&hcan1);
}

/* HAL Callbacks (Application-specific implementations) ----------------------*/

/**
 * @brief CAN Error Callback (Override weak implementation)
 * 
 * This callback is invoked when CAN errors occur.
 * Implement your error handling strategy here.
 */
void HAL_CAN_ErrorCallback(CAN_HandleTypeDef *hcan)
{
    if (hcan->Instance == CAN1) {
        can_error_detected = true;
        
        uint32_t error = HAL_CAN_GetError(hcan);
        
        // Blink LED to indicate error type
        if (error & HAL_CAN_ERROR_BOF) {
            // Bus-off: Rapid blink
            for (int i = 0; i < 10; i++) {
                HAL_GPIO_TogglePin(LED_PORT, LED_PIN);
                HAL_Delay(50);
            }
        } else if (error & HAL_CAN_ERROR_ACK) {
            // No ACK: Check if MKS boards are powered and connected
            // Single long blink
            HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_SET);
            HAL_Delay(1000);
            HAL_GPIO_WritePin(LED_PORT, LED_PIN, GPIO_PIN_RESET);
        }
        
        /* Additional error handling:
         * - Log error to UART/debug console
         * - Increment error counter
         * - Trigger watchdog reset if critical
         * - Send error notification to host system
         */
    }
}

/**
 * @brief CAN RX FIFO0 Message Pending Callback (Override weak implementation)
 * 
 * Process incoming messages from MKS motor driver boards.
 */
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    if (hcan->Instance == CAN1) {
        CAN_RxHeaderTypeDef rx_header;
        uint8_t rx_data[8];
        
        // Retrieve message from FIFO0
        if (HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &rx_header, rx_data) == HAL_OK) {
            can_rx_count++;
            
            uint32_t node_id = rx_header.StdId;
            uint8_t data_length = rx_header.DLC;
            
            // Process based on node ID
            if (node_id == MKS_NODE_ID_MOTOR_1) {
                // Parse Motor 1 response
                // Example: Extract motor position, velocity, current, etc.
                
                /* MKS SimpleFOC typical response format (verify with your firmware):
                 * Byte 0: Response code
                 * Bytes 1-4: Data (float or int32)
                 * Bytes 5-7: Additional data or status flags
                 */
                
            } else if (node_id == MKS_NODE_ID_MOTOR_2) {
                // Parse Motor 2 response
            }
            
            // Toggle LED to indicate message received
            HAL_GPIO_TogglePin(LED_PORT, LED_PIN);
        }
    }
}

/**
 * @brief CAN TX Mailbox Complete Callbacks (Optional)
 */
void HAL_CAN_TxMailbox0CompleteCallback(CAN_HandleTypeDef *hcan)
{
    if (hcan->Instance == CAN1) {
        // Message transmitted successfully from mailbox 0
        // Optional: Update transmission statistics
    }
}

#ifdef USE_FULL_ASSERT
/**
 * @brief Reports the name of the source file and the source line number
 *        where the assert_param error has occurred.
 * @param file: pointer to the source file name
 * @param line: assert_param error line source number
 */
void assert_failed(uint8_t *file, uint32_t line)
{
    /* User can add their own implementation to report the file name and line number,
       ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
}
#endif
