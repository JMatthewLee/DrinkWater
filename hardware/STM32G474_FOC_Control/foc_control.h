/**
 * @file foc_control.h
 * @brief Field-Oriented Control (FOC) for BLDC Motors on STM32G474
 * 
 * This module provides FOC control for two BLDC motors using STM32G474's
 * advanced timers (TIM1 and TIM8) to generate 6-channel complementary PWM.
 * 
 * Hardware:
 * - STM32G474RE Nucleo board
 * - MKS 3.2 Dual FOC board (dumb power stage)
 * - 2x GL30 BLDC motors (12V, 7.4A peak)
 * - Incremental encoders for position feedback
 * 
 * Control Modes:
 * - Open-loop (force commutation)
 * - Closed-loop velocity control
 * - Closed-loop position control
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-15
 */

#ifndef FOC_CONTROL_H
#define FOC_CONTROL_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "stm32g4xx_hal.h"
#include <stdint.h>
#include <stdbool.h>
#include <math.h>

/* Exported types ------------------------------------------------------------*/

/**
 * @brief Motor ID enumeration
 */
typedef enum {
    MOTOR_A = 0,  // Motor A (TIM1)
    MOTOR_B = 1,  // Motor B (TIM8)
    MOTOR_COUNT = 2
} Motor_ID_t;

/**
 * @brief Motor control mode
 */
typedef enum {
    MODE_DISABLED = 0,     // Motor disabled (coast)
    MODE_OPEN_LOOP,        // Open-loop voltage control (no feedback)
    MODE_VELOCITY,         // Closed-loop velocity control
    MODE_POSITION,         // Closed-loop position control
    MODE_TORQUE            // Closed-loop torque/current control
} Motor_Mode_t;

/**
 * @brief Motor state structure
 */
typedef struct {
    Motor_Mode_t mode;           // Current control mode
    bool enabled;                // Motor enable flag
    
    // Electrical angle and position
    float electrical_angle;      // Electrical angle in radians [0, 2π]
    float mechanical_angle;      // Mechanical angle in radians
    int32_t encoder_count;       // Raw encoder count
    
    // Velocity
    float velocity;              // Mechanical velocity in rad/s
    float velocity_filtered;     // Low-pass filtered velocity
    
    // Targets
    float target_velocity;       // Target velocity (rad/s)
    float target_position;       // Target position (rad)
    float target_voltage;        // Target voltage (V) for open-loop
    
    // FOC outputs
    float voltage_d;             // D-axis voltage (V)
    float voltage_q;             // Q-axis voltage (V)
    float current_d;             // D-axis current (A) - optional
    float current_q;             // Q-axis current (A) - optional
    
    // PWM duty cycles [0.0, 1.0]
    float duty_a;
    float duty_b;
    float duty_c;
    
    // PID controller states
    float pid_vel_integral;
    float pid_vel_error_prev;
    float pid_pos_integral;
    float pid_pos_error_prev;
    
} Motor_State_t;

/**
 * @brief Motor configuration structure
 */
typedef struct {
    // Hardware configuration
    TIM_HandleTypeDef *htim_pwm;     // Timer for PWM generation
    TIM_HandleTypeDef *htim_encoder; // Timer for encoder reading
    
    // Motor parameters
    uint8_t pole_pairs;              // Number of pole pairs (GL30: 7 typical)
    float supply_voltage;            // Supply voltage (V)
    uint32_t encoder_ppr;            // Encoder pulses per revolution
    
    // Control limits
    float max_velocity;              // Maximum velocity (rad/s)
    float max_voltage;               // Maximum voltage (V)
    float max_current;               // Maximum current (A)
    
    // PID gains - Velocity controller
    float pid_vel_p;
    float pid_vel_i;
    float pid_vel_d;
    
    // PID gains - Position controller
    float pid_pos_p;
    float pid_pos_i;
    float pid_pos_d;
    
    // Filter coefficients
    float velocity_filter_alpha;     // Low-pass filter: 0.0-1.0 (0=no filter, 1=no change)
    
} Motor_Config_t;

/* Exported constants --------------------------------------------------------*/

// Motor parameters for GL30
#define GL30_POLE_PAIRS             7       // Typical for GL30
#define GL30_RATED_VOLTAGE          12.0f   // Volts
#define GL30_PEAK_CURRENT           7.4f    // Amperes
#define GL30_CONT_CURRENT           2.13f   // Amperes

// PWM configuration
#define PWM_FREQUENCY_HZ            20000   // 20 kHz
#define PWM_DEADTIME_NS             500     // 500ns deadtime

// Encoder configuration (adjust for your encoder)
#define ENCODER_PPR                 2048    // Pulses per revolution (example)

// Control loop frequency
#define FOC_CONTROL_FREQ_HZ         10000   // 10 kHz FOC loop

// Default PID gains (tune these for your system!)
#define DEFAULT_VEL_KP              0.5f
#define DEFAULT_VEL_KI              1.0f
#define DEFAULT_VEL_KD              0.0f

#define DEFAULT_POS_KP              20.0f
#define DEFAULT_POS_KI              0.0f
#define DEFAULT_POS_KD              0.1f

// Velocity filter (lower = more filtering, higher = more responsive)
#define VELOCITY_FILTER_ALPHA       0.2f

/* Exported macro ------------------------------------------------------------*/

#define RAD_TO_DEG(rad)             ((rad) * 180.0f / M_PI)
#define DEG_TO_RAD(deg)             ((deg) * M_PI / 180.0f)

/* Exported functions prototypes ---------------------------------------------*/

/**
 * @brief Initialize FOC control system
 * 
 * Configures timers for PWM generation and encoder reading.
 * Call this once during startup.
 * 
 * @param motor_id: Motor identifier (MOTOR_A or MOTOR_B)
 * @param config: Pointer to motor configuration structure
 * @retval HAL status
 */
HAL_StatusTypeDef FOC_Init(Motor_ID_t motor_id, const Motor_Config_t *config);

/**
 * @brief Start motor control
 * 
 * Enables PWM outputs and starts the FOC control loop.
 * 
 * @param motor_id: Motor identifier
 * @retval HAL status
 */
HAL_StatusTypeDef FOC_Start(Motor_ID_t motor_id);

/**
 * @brief Stop motor control
 * 
 * Disables PWM outputs and stops motor (coast mode).
 * 
 * @param motor_id: Motor identifier
 * @retval HAL status
 */
HAL_StatusTypeDef FOC_Stop(Motor_ID_t motor_id);

/**
 * @brief Enable motor (energize windings)
 * 
 * @param motor_id: Motor identifier
 */
void FOC_Enable(Motor_ID_t motor_id);

/**
 * @brief Disable motor (coast)
 * 
 * @param motor_id: Motor identifier
 */
void FOC_Disable(Motor_ID_t motor_id);

/**
 * @brief Set motor control mode
 * 
 * @param motor_id: Motor identifier
 * @param mode: Control mode (open-loop, velocity, position)
 */
void FOC_SetMode(Motor_ID_t motor_id, Motor_Mode_t mode);

/**
 * @brief Set target velocity (rad/s)
 * 
 * Use in MODE_VELOCITY. Positive = forward, negative = reverse.
 * 
 * @param motor_id: Motor identifier
 * @param velocity: Target velocity in rad/s
 */
void FOC_SetVelocity(Motor_ID_t motor_id, float velocity);

/**
 * @brief Set target position (rad)
 * 
 * Use in MODE_POSITION.
 * 
 * @param motor_id: Motor identifier
 * @param position: Target position in radians
 */
void FOC_SetPosition(Motor_ID_t motor_id, float position);

/**
 * @brief Set target voltage (open-loop)
 * 
 * Use in MODE_OPEN_LOOP for testing without encoder feedback.
 * 
 * @param motor_id: Motor identifier
 * @param voltage: Target voltage in volts (0 to supply_voltage)
 * @param angle: Electrical angle in radians (for forced commutation)
 */
void FOC_SetVoltage(Motor_ID_t motor_id, float voltage, float angle);

/**
 * @brief Update FOC control loop
 * 
 * **MUST be called at 10 kHz (every 100µs) from timer interrupt!**
 * This function:
 * - Reads encoder position
 * - Calculates velocity
 * - Runs PID controllers
 * - Performs Clarke/Park transforms
 * - Updates PWM duty cycles
 * 
 * Call from TIM6 interrupt or similar high-priority timer.
 */
void FOC_Update(void);

/**
 * @brief Get motor state (read-only)
 * 
 * @param motor_id: Motor identifier
 * @retval Pointer to motor state structure
 */
const Motor_State_t* FOC_GetState(Motor_ID_t motor_id);

/**
 * @brief Set PID velocity gains
 * 
 * @param motor_id: Motor identifier
 * @param kp: Proportional gain
 * @param ki: Integral gain
 * @param kd: Derivative gain
 */
void FOC_SetVelocityPID(Motor_ID_t motor_id, float kp, float ki, float kd);

/**
 * @brief Set PID position gains
 * 
 * @param motor_id: Motor identifier
 * @param kp: Proportional gain
 * @param ki: Integral gain
 * @param kd: Derivative gain
 */
void FOC_SetPositionPID(Motor_ID_t motor_id, float kp, float ki, float kd);

/**
 * @brief Emergency stop all motors
 * 
 * Immediately disables all PWM outputs and sets motors to coast.
 * Call this in fault/error conditions.
 */
void FOC_EmergencyStop(void);

#ifdef __cplusplus
}
#endif

#endif /* FOC_CONTROL_H */
