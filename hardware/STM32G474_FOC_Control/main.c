/**
 * @file main.c
 * @brief STM32G474 FOC Motor Control Application
 * 
 * This application demonstrates Field-Oriented Control of two BLDC motors
 * using the STM32G474RE Nucleo board and MKS 3.2 Dual FOC power stage.
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-15
 */

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "foc_control.h"

/* Private variables ---------------------------------------------------------*/
TIM_HandleTypeDef htim1;   // PWM for Motor A
TIM_HandleTypeDef htim2;   // Encoder for Motor A
TIM_HandleTypeDef htim3;   // Encoder for Motor B
TIM_HandleTypeDef htim6;   // FOC update timer (10 kHz)
TIM_HandleTypeDef htim8;   // PWM for Motor B

UART_HandleTypeDef huart2; // Debug UART

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_TIM1_Init(void);
static void MX_TIM2_Init(void);
static void MX_TIM3_Init(void);
static void MX_TIM6_Init(void);
static void MX_TIM8_Init(void);
static void MX_USART2_UART_Init(void);
static void Demo_VelocityControl(void);
static void Demo_PositionControl(void);
static void Demo_OpenLoop(void);

/**
 * @brief Application entry point
 */
int main(void)
{
    /* MCU Configuration -------------------------------------------------------*/
    
    /* Reset of all peripherals, Initializes the Flash interface and the Systick */
    HAL_Init();
    
    /* Configure the system clock to 170 MHz */
    SystemClock_Config();
    
    /* Initialize all configured peripherals */
    MX_GPIO_Init();
    MX_TIM1_Init();
    MX_TIM2_Init();
    MX_TIM3_Init();
    MX_TIM6_Init();
    MX_TIM8_Init();
    MX_USART2_UART_Init();
    
    /* Initialize FOC control --------------------------------------------------*/
    
    // Motor A configuration
    Motor_Config_t motor_a_config = {
        .htim_pwm = &htim1,
        .htim_encoder = &htim2,
        .pole_pairs = GL30_POLE_PAIRS,
        .supply_voltage = 12.0f,
        .encoder_ppr = ENCODER_PPR,
        .max_velocity = 50.0f,        // 50 rad/s ≈ 477 RPM
        .max_voltage = 12.0f,
        .max_current = GL30_CONT_CURRENT,
        .pid_vel_p = DEFAULT_VEL_KP,
        .pid_vel_i = DEFAULT_VEL_KI,
        .pid_vel_d = DEFAULT_VEL_KD,
        .pid_pos_p = DEFAULT_POS_KP,
        .pid_pos_i = DEFAULT_POS_KI,
        .pid_pos_d = DEFAULT_POS_KD,
        .velocity_filter_alpha = VELOCITY_FILTER_ALPHA
    };
    
    // Motor B configuration
    Motor_Config_t motor_b_config = {
        .htim_pwm = &htim8,
        .htim_encoder = &htim3,
        .pole_pairs = GL30_POLE_PAIRS,
        .supply_voltage = 12.0f,
        .encoder_ppr = ENCODER_PPR,
        .max_velocity = 50.0f,
        .max_voltage = 12.0f,
        .max_current = GL30_CONT_CURRENT,
        .pid_vel_p = DEFAULT_VEL_KP,
        .pid_vel_i = DEFAULT_VEL_KI,
        .pid_vel_d = DEFAULT_VEL_KD,
        .pid_pos_p = DEFAULT_POS_KP,
        .pid_pos_i = DEFAULT_POS_KI,
        .pid_pos_d = DEFAULT_POS_KD,
        .velocity_filter_alpha = VELOCITY_FILTER_ALPHA
    };
    
    // Initialize motors
    if (FOC_Init(MOTOR_A, &motor_a_config) != HAL_OK) {
        Error_Handler();
    }
    
    if (FOC_Init(MOTOR_B, &motor_b_config) != HAL_OK) {
        Error_Handler();
    }
    
    // Start motors
    FOC_Start(MOTOR_A);
    FOC_Start(MOTOR_B);
    
    // Start FOC update timer (10 kHz interrupt)
    HAL_TIM_Base_Start_IT(&htim6);
    
    /* Blink LED to indicate successful initialization */
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);  // LED on
    HAL_Delay(500);
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
    HAL_Delay(500);
    
    /* Run demo -----------------------------------------------------------------*/
    
    // Choose one demo (comment out others):
    Demo_VelocityControl();
    // Demo_PositionControl();
    // Demo_OpenLoop();
    
    /* Infinite loop */
    while (1)
    {
        // Main loop can be used for:
        // - Reading sensors
        // - Processing commands from UART/CAN
        // - Monitoring motor status
        // - Safety checks
        
        // Example: Print motor status every 100ms
        HAL_Delay(100);
        
        const Motor_State_t *state_a = FOC_GetState(MOTOR_A);
        const Motor_State_t *state_b = FOC_GetState(MOTOR_B);
        
        // Toggle LED as heartbeat
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        
        // Optional: Print to UART for debugging
        #ifdef DEBUG_UART
        char msg[128];
        sprintf(msg, "Motor A: %.2f rad/s, Motor B: %.2f rad/s\r\n", 
                state_a->velocity_filtered, state_b->velocity_filtered);
        HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), 100);
        #endif
    }
}

/**
 * @brief Velocity control demo
 * 
 * Demonstrates closed-loop velocity control with encoder feedback.
 * Both motors spin at different speeds and directions.
 */
static void Demo_VelocityControl(void)
{
    // Set mode to velocity control
    FOC_SetMode(MOTOR_A, MODE_VELOCITY);
    FOC_SetMode(MOTOR_B, MODE_VELOCITY);
    
    // Enable motors
    FOC_Enable(MOTOR_A);
    FOC_Enable(MOTOR_B);
    
    HAL_Delay(500);
    
    // Ramp up Motor A to 5 rad/s (forward)
    for (float v = 0.0f; v <= 5.0f; v += 0.5f) {
        FOC_SetVelocity(MOTOR_A, v);
        HAL_Delay(200);
    }
    
    // Ramp up Motor B to -3 rad/s (backward)
    for (float v = 0.0f; v >= -3.0f; v -= 0.3f) {
        FOC_SetVelocity(MOTOR_B, v);
        HAL_Delay(200);
    }
    
    // Run for 5 seconds
    HAL_Delay(5000);
    
    // Change velocities
    FOC_SetVelocity(MOTOR_A, 10.0f);  // Motor A faster
    FOC_SetVelocity(MOTOR_B, 10.0f);  // Motor B same direction now
    
    HAL_Delay(5000);
    
    // Slow down to stop
    for (float v = 10.0f; v >= 0.0f; v -= 1.0f) {
        FOC_SetVelocity(MOTOR_A, v);
        FOC_SetVelocity(MOTOR_B, v);
        HAL_Delay(200);
    }
    
    // Disable motors
    FOC_Disable(MOTOR_A);
    FOC_Disable(MOTOR_B);
}

/**
 * @brief Position control demo
 * 
 * Demonstrates closed-loop position control.
 * Motors move to specific positions.
 */
static void Demo_PositionControl(void)
{
    // Set mode to position control
    FOC_SetMode(MOTOR_A, MODE_POSITION);
    FOC_SetMode(MOTOR_B, MODE_POSITION);
    
    // Enable motors
    FOC_Enable(MOTOR_A);
    FOC_Enable(MOTOR_B);
    
    HAL_Delay(500);
    
    // Move to position 1 (π radians = 180 degrees)
    FOC_SetPosition(MOTOR_A, 3.14159f);
    FOC_SetPosition(MOTOR_B, 3.14159f);
    
    HAL_Delay(3000);  // Wait for motors to reach position
    
    // Move to position 2 (2π radians = 360 degrees)
    FOC_SetPosition(MOTOR_A, 6.28318f);
    FOC_SetPosition(MOTOR_B, 6.28318f);
    
    HAL_Delay(3000);
    
    // Move back to zero
    FOC_SetPosition(MOTOR_A, 0.0f);
    FOC_SetPosition(MOTOR_B, 0.0f);
    
    HAL_Delay(3000);
    
    // Disable motors
    FOC_Disable(MOTOR_A);
    FOC_Disable(MOTOR_B);
}

/**
 * @brief Open-loop demo (no encoder required)
 * 
 * Demonstrates open-loop voltage control with forced commutation.
 * Useful for testing without encoder or initial motor identification.
 */
static void Demo_OpenLoop(void)
{
    // Set mode to open-loop
    FOC_SetMode(MOTOR_A, MODE_OPEN_LOOP);
    FOC_SetMode(MOTOR_B, MODE_OPEN_LOOP);
    
    // Enable motors
    FOC_Enable(MOTOR_A);
    FOC_Enable(MOTOR_B);
    
    HAL_Delay(500);
    
    // Spin at constant voltage, manually increment angle
    float angle = 0.0f;
    float voltage = 3.0f;  // Start with low voltage
    
    for (int i = 0; i < 2000; i++) {  // 20 seconds at 10 kHz
        FOC_SetVoltage(MOTOR_A, voltage, angle);
        FOC_SetVoltage(MOTOR_B, voltage, angle);
        
        angle += 0.01f;  // Increment angle (simulated rotation)
        if (angle > 6.28318f) {
            angle -= 6.28318f;
        }
        
        HAL_Delay(10);  // 100 Hz update rate
    }
    
    // Disable motors
    FOC_Disable(MOTOR_A);
    FOC_Disable(MOTOR_B);
}

/**
 * @brief TIM6 interrupt - FOC update loop at 10 kHz
 */
void TIM6_DAC_IRQHandler(void)
{
    if (__HAL_TIM_GET_FLAG(&htim6, TIM_FLAG_UPDATE)) {
        __HAL_TIM_CLEAR_FLAG(&htim6, TIM_FLAG_UPDATE);
        
        // Call FOC update function
        FOC_Update();
    }
}

/**
 * @brief System Clock Configuration
 * 
 * Configure STM32G474 to run at 170 MHz (maximum)
 */
void SystemClock_Config(void)
{
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
    
    /* Configure the main internal regulator output voltage */
    HAL_PWREx_ControlVoltageScaling(PWR_REGULATOR_VOLTAGE_SCALE1_BOOST);
    
    /* Initializes the RCC Oscillators */
    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState = RCC_HSE_ON;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLM = RCC_PLLM_DIV6;
    RCC_OscInitStruct.PLL.PLLN = 85;
    RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
    RCC_OscInitStruct.PLL.PLLQ = RCC_PLLQ_DIV2;
    RCC_OscInitStruct.PLL.PLLR = RCC_PLLR_DIV2;
    if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) {
        Error_Handler();
    }
    
    /* Initializes the CPU, AHB and APB buses clocks */
    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                                 |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;
    
    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_8) != HAL_OK) {
        Error_Handler();
    }
}

/**
 * @brief TIM1 Initialization (Motor A PWM)
 * 
 * 20 kHz PWM with complementary outputs and 500ns deadtime
 */
static void MX_TIM1_Init(void)
{
    TIM_MasterConfigTypeDef sMasterConfig = {0};
    TIM_OC_InitTypeDef sConfigOC = {0};
    TIM_BreakDeadTimeConfigTypeDef sBreakDeadTimeConfig = {0};
    
    htim1.Instance = TIM1;
    htim1.Init.Prescaler = 0;
    htim1.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim1.Init.Period = (170000000 / PWM_FREQUENCY_HZ) - 1;  // ARR for 20 kHz
    htim1.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim1.Init.RepetitionCounter = 0;
    htim1.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
    if (HAL_TIM_PWM_Init(&htim1) != HAL_OK) {
        Error_Handler();
    }
    
    sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
    sMasterConfig.MasterOutputTrigger2 = TIM_TRGO2_RESET;
    sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
    if (HAL_TIMEx_MasterConfigSynchronization(&htim1, &sMasterConfig) != HAL_OK) {
        Error_Handler();
    }
    
    sConfigOC.OCMode = TIM_OCMODE_PWM1;
    sConfigOC.Pulse = 0;
    sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
    sConfigOC.OCNPolarity = TIM_OCNPOLARITY_HIGH;
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
    sConfigOC.OCIdleState = TIM_OCIDLESTATE_RESET;
    sConfigOC.OCNIdleState = TIM_OCNIDLESTATE_RESET;
    
    if (HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_1) != HAL_OK ||
        HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_2) != HAL_OK ||
        HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_3) != HAL_OK) {
        Error_Handler();
    }
    
    // Deadtime configuration (500ns at 170 MHz)
    sBreakDeadTimeConfig.OffStateRunMode = TIM_OSSR_ENABLE;
    sBreakDeadTimeConfig.OffStateIDLEMode = TIM_OSSI_ENABLE;
    sBreakDeadTimeConfig.LockLevel = TIM_LOCKLEVEL_OFF;
    sBreakDeadTimeConfig.DeadTime = 85;  // 500ns deadtime
    sBreakDeadTimeConfig.BreakState = TIM_BREAK_DISABLE;
    sBreakDeadTimeConfig.BreakPolarity = TIM_BREAKPOLARITY_HIGH;
    sBreakDeadTimeConfig.BreakFilter = 0;
    sBreakDeadTimeConfig.AutomaticOutput = TIM_AUTOMATICOUTPUT_DISABLE;
    if (HAL_TIMEx_ConfigBreakDeadTime(&htim1, &sBreakDeadTimeConfig) != HAL_OK) {
        Error_Handler();
    }
    
    /* GPIO Configuration: PA8-PA10 (CH1-CH3), PA7,PB0-PB1 (CH1N-CH3N) */
    // See MX_GPIO_Init() for pin configuration
}

/**
 * @brief TIM8 Initialization (Motor B PWM) - Similar to TIM1
 */
static void MX_TIM8_Init(void)
{
    // Same configuration as TIM1
    // GPIO: PC6-PC8 (CH1-CH3), PA5,PB14-PB15 (CH1N-CH3N)
    // (Implementation similar to MX_TIM1_Init)
}

/**
 * @brief TIM2 Initialization (Motor A Encoder)
 */
static void MX_TIM2_Init(void)
{
    TIM_Encoder_InitTypeDef sConfig = {0};
    
    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 0;
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim2.Init.Period = 65535;  // Full 16-bit range
    htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
    
    sConfig.EncoderMode = TIM_ENCODERMODE_TI12;  // Count on both edges
    sConfig.IC1Polarity = TIM_ICPOLARITY_RISING;
    sConfig.IC1Selection = TIM_ICSELECTION_DIRECTTI;
    sConfig.IC1Prescaler = TIM_ICPSC_DIV1;
    sConfig.IC1Filter = 10;  // Noise filter
    sConfig.IC2Polarity = TIM_ICPOLARITY_RISING;
    sConfig.IC2Selection = TIM_ICSELECTION_DIRECTTI;
    sConfig.IC2Prescaler = TIM_ICPSC_DIV1;
    sConfig.IC2Filter = 10;
    
    if (HAL_TIM_Encoder_Init(&htim2, &sConfig) != HAL_OK) {
        Error_Handler();
    }
    
    /* GPIO Configuration: PA15 (CH1), PB3 (CH2) */
}

/**
 * @brief TIM3 Initialization (Motor B Encoder) - Similar to TIM2
 */
static void MX_TIM3_Init(void)
{
    // Same as TIM2
    // GPIO: PA6 (CH1), PA7 (CH2)
}

/**
 * @brief TIM6 Initialization (FOC Update Timer - 10 kHz)
 */
static void MX_TIM6_Init(void)
{
    htim6.Instance = TIM6;
    htim6.Init.Prescaler = 16;  // 170 MHz / 17 = 10 MHz
    htim6.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim6.Init.Period = 999;  // 10 MHz / 1000 = 10 kHz
    htim6.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
    if (HAL_TIM_Base_Init(&htim6) != HAL_OK) {
        Error_Handler();
    }
    
    /* Enable TIM6 interrupt */
    HAL_NVIC_SetPriority(TIM6_DAC_IRQn, 0, 0);  // Highest priority!
    HAL_NVIC_EnableIRQ(TIM6_DAC_IRQn);
}

/**
 * @brief GPIO Initialization
 */
static void MX_GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    
    /* GPIO Ports Clock Enable */
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();
    
    /* Configure LED pin (PA5 - Nucleo board LED) */
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
    
    /* TIM1 PWM pins configuration (Motor A) */
    /* PA8-TIM1_CH1, PA9-TIM1_CH2, PA10-TIM1_CH3 */
    /* PA7-TIM1_CH1N, PB0-TIM1_CH2N, PB1-TIM1_CH3N */
    // (Configure as AF1 for TIM1)
    
    /* TIM8 PWM pins configuration (Motor B) */
    /* PC6-TIM8_CH1, PC7-TIM8_CH2, PC8-TIM8_CH3 */
    /* PA5-TIM8_CH1N, PB14-TIM8_CH2N, PB15-TIM8_CH3N */
    // (Configure as AF3 for TIM8)
    
    /* TIM2 Encoder pins (Motor A) */
    /* PA15-TIM2_CH1, PB3-TIM2_CH2 */
    // (Configure as AF1 for TIM2)
    
    /* TIM3 Encoder pins (Motor B) */
    /* PA6-TIM3_CH1, PA7-TIM3_CH2 */
    // (Configure as AF2 for TIM3)
}

/**
 * @brief USART2 Initialization (Debug output)
 */
static void MX_USART2_UART_Init(void)
{
    huart2.Instance = USART2;
    huart2.Init.BaudRate = 115200;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    huart2.Init.Mode = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart2.Init.OverSampling = UART_OVERSAMPLING_16;
    if (HAL_UART_Init(&huart2) != HAL_OK) {
        Error_Handler();
    }
}

/**
 * @brief Error Handler
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1) {
        // Blink LED rapidly
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        HAL_Delay(100);
    }
}

#ifdef USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line)
{
    /* User can add implementation to report file and line */
}
#endif
