/**
 * @file foc_control.c
 * @brief Field-Oriented Control (FOC) Implementation
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-15
 */

/* Includes ------------------------------------------------------------------*/
#include "foc_control.h"
#include <string.h>

/* Private defines -----------------------------------------------------------*/
#define _2PI            6.28318530718f
#define _PI             3.14159265359f
#define _SQRT3          1.73205080757f
#define _1_SQRT3        0.57735026919f

#define ANGLE_NORMALIZE(a)  (fmodf((a) + _2PI, _2PI))

/* Private variables ---------------------------------------------------------*/
static Motor_State_t motor_states[MOTOR_COUNT] = {0};
static Motor_Config_t motor_configs[MOTOR_COUNT] = {0};
static bool initialized[MOTOR_COUNT] = {false};

// FOC loop timing
static uint32_t foc_loop_counter = 0;
static float dt = 1.0f / FOC_CONTROL_FREQ_HZ;  // Time step

/* Private function prototypes -----------------------------------------------*/
static void FOC_InitTimer_PWM(Motor_ID_t motor_id);
static void FOC_InitTimer_Encoder(Motor_ID_t motor_id);
static void FOC_UpdateEncoder(Motor_ID_t motor_id);
static void FOC_UpdateVelocity(Motor_ID_t motor_id);
static float FOC_PID_Velocity(Motor_ID_t motor_id, float error);
static float FOC_PID_Position(Motor_ID_t motor_id, float error);
static void FOC_Clarke(float a, float b, float c, float *alpha, float *beta);
static void FOC_Park(float alpha, float beta, float angle, float *d, float *q);
static void FOC_InversePark(float d, float q, float angle, float *alpha, float *beta);
static void FOC_SVPWM(float alpha, float beta, float *duty_a, float *duty_b, float *duty_c);
static void FOC_SetPWM(Motor_ID_t motor_id, float duty_a, float duty_b, float duty_c);
static float constrain(float value, float min, float max);

/* Exported functions --------------------------------------------------------*/

/**
 * @brief Initialize FOC control system
 */
HAL_StatusTypeDef FOC_Init(Motor_ID_t motor_id, const Motor_Config_t *config)
{
    if (motor_id >= MOTOR_COUNT || config == NULL) {
        return HAL_ERROR;
    }
    
    // Copy configuration
    memcpy(&motor_configs[motor_id], config, sizeof(Motor_Config_t));
    
    // Initialize state
    memset(&motor_states[motor_id], 0, sizeof(Motor_State_t));
    motor_states[motor_id].mode = MODE_DISABLED;
    motor_states[motor_id].enabled = false;
    
    // Initialize timers
    FOC_InitTimer_PWM(motor_id);
    FOC_InitTimer_Encoder(motor_id);
    
    initialized[motor_id] = true;
    
    return HAL_OK;
}

/**
 * @brief Start motor control
 */
HAL_StatusTypeDef FOC_Start(Motor_ID_t motor_id)
{
    if (motor_id >= MOTOR_COUNT || !initialized[motor_id]) {
        return HAL_ERROR;
    }
    
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    // Start PWM generation (all 3 channels + complementary)
    HAL_TIM_PWM_Start(cfg->htim_pwm, TIM_CHANNEL_1);
    HAL_TIMEx_PWMN_Start(cfg->htim_pwm, TIM_CHANNEL_1);
    
    HAL_TIM_PWM_Start(cfg->htim_pwm, TIM_CHANNEL_2);
    HAL_TIMEx_PWMN_Start(cfg->htim_pwm, TIM_CHANNEL_2);
    
    HAL_TIM_PWM_Start(cfg->htim_pwm, TIM_CHANNEL_3);
    HAL_TIMEx_PWMN_Start(cfg->htim_pwm, TIM_CHANNEL_3);
    
    // Start encoder reading
    HAL_TIM_Encoder_Start(cfg->htim_encoder, TIM_CHANNEL_ALL);
    
    return HAL_OK;
}

/**
 * @brief Stop motor control
 */
HAL_StatusTypeDef FOC_Stop(Motor_ID_t motor_id)
{
    if (motor_id >= MOTOR_COUNT || !initialized[motor_id]) {
        return HAL_ERROR;
    }
    
    FOC_Disable(motor_id);
    
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    // Stop PWM
    HAL_TIM_PWM_Stop(cfg->htim_pwm, TIM_CHANNEL_1);
    HAL_TIMEx_PWMN_Stop(cfg->htim_pwm, TIM_CHANNEL_1);
    
    HAL_TIM_PWM_Stop(cfg->htim_pwm, TIM_CHANNEL_2);
    HAL_TIMEx_PWMN_Stop(cfg->htim_pwm, TIM_CHANNEL_2);
    
    HAL_TIM_PWM_Stop(cfg->htim_pwm, TIM_CHANNEL_3);
    HAL_TIMEx_PWMN_Stop(cfg->htim_pwm, TIM_CHANNEL_3);
    
    // Stop encoder
    HAL_TIM_Encoder_Stop(cfg->htim_encoder, TIM_CHANNEL_ALL);
    
    return HAL_OK;
}

/**
 * @brief Enable motor
 */
void FOC_Enable(Motor_ID_t motor_id)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    motor_states[motor_id].enabled = true;
    
    // Reset integrators
    motor_states[motor_id].pid_vel_integral = 0.0f;
    motor_states[motor_id].pid_pos_integral = 0.0f;
}

/**
 * @brief Disable motor
 */
void FOC_Disable(Motor_ID_t motor_id)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    motor_states[motor_id].enabled = false;
    motor_states[motor_id].mode = MODE_DISABLED;
    
    // Set all PWM to 50% (motor coast)
    FOC_SetPWM(motor_id, 0.5f, 0.5f, 0.5f);
}

/**
 * @brief Set motor control mode
 */
void FOC_SetMode(Motor_ID_t motor_id, Motor_Mode_t mode)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    motor_states[motor_id].mode = mode;
    
    // Reset PID integrators when changing modes
    motor_states[motor_id].pid_vel_integral = 0.0f;
    motor_states[motor_id].pid_pos_integral = 0.0f;
}

/**
 * @brief Set target velocity
 */
void FOC_SetVelocity(Motor_ID_t motor_id, float velocity)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    // Clamp to limits
    motor_states[motor_id].target_velocity = constrain(velocity, 
                                                        -cfg->max_velocity, 
                                                        cfg->max_velocity);
}

/**
 * @brief Set target position
 */
void FOC_SetPosition(Motor_ID_t motor_id, float position)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    motor_states[motor_id].target_position = position;
}

/**
 * @brief Set target voltage (open-loop)
 */
void FOC_SetVoltage(Motor_ID_t motor_id, float voltage, float angle)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    Motor_Config_t *cfg = &motor_configs[motor_id];
    Motor_State_t *state = &motor_states[motor_id];
    
    state->target_voltage = constrain(voltage, 0.0f, cfg->max_voltage);
    state->electrical_angle = ANGLE_NORMALIZE(angle);
}

/**
 * @brief Main FOC update loop - CALL AT 10 kHz!
 */
void FOC_Update(void)
{
    foc_loop_counter++;
    
    for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
        if (!initialized[i] || !motor_states[i].enabled) {
            continue;
        }
        
        Motor_State_t *state = &motor_states[i];
        Motor_Config_t *cfg = &motor_configs[i];
        
        // 1. Read encoder and update velocity
        FOC_UpdateEncoder(i);
        FOC_UpdateVelocity(i);
        
        // 2. Calculate electrical angle
        state->electrical_angle = ANGLE_NORMALIZE(state->mechanical_angle * cfg->pole_pairs);
        
        // 3. Control mode logic
        float voltage_magnitude = 0.0f;
        
        switch (state->mode) {
            case MODE_OPEN_LOOP:
                // User manually controls voltage and angle
                voltage_magnitude = state->target_voltage;
                // electrical_angle already set by FOC_SetVoltage()
                break;
                
            case MODE_VELOCITY:
            {
                // Velocity PID controller
                float vel_error = state->target_velocity - state->velocity_filtered;
                voltage_magnitude = FOC_PID_Velocity(i, vel_error);
                voltage_magnitude = constrain(voltage_magnitude, 0.0f, cfg->max_voltage);
                break;
            }
            
            case MODE_POSITION:
            {
                // Position PID → Velocity setpoint
                float pos_error = state->target_position - state->mechanical_angle;
                float vel_setpoint = FOC_PID_Position(i, pos_error);
                vel_setpoint = constrain(vel_setpoint, -cfg->max_velocity, cfg->max_velocity);
                
                // Velocity PID → Voltage
                float vel_error = vel_setpoint - state->velocity_filtered;
                voltage_magnitude = FOC_PID_Velocity(i, vel_error);
                voltage_magnitude = constrain(voltage_magnitude, 0.0f, cfg->max_voltage);
                break;
            }
            
            case MODE_DISABLED:
            default:
                FOC_SetPWM(i, 0.5f, 0.5f, 0.5f);  // Coast
                continue;
        }
        
        // 4. FOC: Convert voltage magnitude to D-Q frame
        // For simplicity, we set Vd=0 and Vq=voltage (maximum torque per amp)
        state->voltage_d = 0.0f;
        state->voltage_q = voltage_magnitude;
        
        // 5. Inverse Park transform: D-Q → Alpha-Beta
        float v_alpha, v_beta;
        FOC_InversePark(state->voltage_d, state->voltage_q, 
                        state->electrical_angle, &v_alpha, &v_beta);
        
        // 6. Space Vector PWM: Alpha-Beta → Duty cycles
        FOC_SVPWM(v_alpha / cfg->supply_voltage, 
                  v_beta / cfg->supply_voltage,
                  &state->duty_a, &state->duty_b, &state->duty_c);
        
        // 7. Update PWM registers
        FOC_SetPWM(i, state->duty_a, state->duty_b, state->duty_c);
    }
}

/**
 * @brief Get motor state
 */
const Motor_State_t* FOC_GetState(Motor_ID_t motor_id)
{
    if (motor_id >= MOTOR_COUNT) return NULL;
    return &motor_states[motor_id];
}

/**
 * @brief Set velocity PID gains
 */
void FOC_SetVelocityPID(Motor_ID_t motor_id, float kp, float ki, float kd)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    motor_configs[motor_id].pid_vel_p = kp;
    motor_configs[motor_id].pid_vel_i = ki;
    motor_configs[motor_id].pid_vel_d = kd;
}

/**
 * @brief Set position PID gains
 */
void FOC_SetPositionPID(Motor_ID_t motor_id, float kp, float ki, float kd)
{
    if (motor_id >= MOTOR_COUNT) return;
    
    motor_configs[motor_id].pid_pos_p = kp;
    motor_configs[motor_id].pid_pos_i = ki;
    motor_configs[motor_id].pid_pos_d = kd;
}

/**
 * @brief Emergency stop
 */
void FOC_EmergencyStop(void)
{
    for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
        FOC_Disable(i);
    }
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Initialize PWM timer
 */
static void FOC_InitTimer_PWM(Motor_ID_t motor_id)
{
    // PWM configuration is done in MX_TIMx_Init()
    // This function just stores the handle
    // Actual HAL timer init should be done in main.c or auto-generated code
}

/**
 * @brief Initialize encoder timer
 */
static void FOC_InitTimer_Encoder(Motor_ID_t motor_id)
{
    // Encoder configuration is done in MX_TIMx_Init()
    // Set encoder to count both edges on both channels (4x resolution)
}

/**
 * @brief Update encoder reading
 */
static void FOC_UpdateEncoder(Motor_ID_t motor_id)
{
    Motor_State_t *state = &motor_states[motor_id];
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    // Read encoder count
    int32_t count = (int32_t)__HAL_TIM_GET_COUNTER(cfg->htim_encoder);
    
    // Handle 16-bit overflow (encoder timer is 16-bit on most STM32)
    static int32_t prev_count[MOTOR_COUNT] = {0};
    int32_t delta = count - prev_count[motor_id];
    
    // Detect overflow
    if (delta > 32768) {
        delta -= 65536;
    } else if (delta < -32768) {
        delta += 65536;
    }
    
    state->encoder_count += delta;
    prev_count[motor_id] = count;
    
    // Convert to mechanical angle (radians)
    // 4x resolution: 4 counts per encoder pulse
    state->mechanical_angle = (float)state->encoder_count / (cfg->encoder_ppr * 4.0f) * _2PI;
}

/**
 * @brief Calculate velocity from encoder
 */
static void FOC_UpdateVelocity(Motor_ID_t motor_id)
{
    Motor_State_t *state = &motor_states[motor_id];
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    static float prev_angle[MOTOR_COUNT] = {0};
    
    // Calculate velocity (rad/s)
    float angle_delta = state->mechanical_angle - prev_angle[motor_id];
    
    // Handle angle wraparound
    if (angle_delta > _PI) {
        angle_delta -= _2PI;
    } else if (angle_delta < -_PI) {
        angle_delta += _2PI;
    }
    
    float velocity_raw = angle_delta / dt;
    
    // Low-pass filter
    state->velocity = velocity_raw;
    state->velocity_filtered = cfg->velocity_filter_alpha * velocity_raw + 
                              (1.0f - cfg->velocity_filter_alpha) * state->velocity_filtered;
    
    prev_angle[motor_id] = state->mechanical_angle;
}

/**
 * @brief Velocity PID controller
 */
static float FOC_PID_Velocity(Motor_ID_t motor_id, float error)
{
    Motor_State_t *state = &motor_states[motor_id];
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    // P term
    float p_term = cfg->pid_vel_p * error;
    
    // I term with anti-windup
    state->pid_vel_integral += cfg->pid_vel_i * error * dt;
    state->pid_vel_integral = constrain(state->pid_vel_integral, 
                                        -cfg->max_voltage, 
                                        cfg->max_voltage);
    
    // D term
    float d_term = cfg->pid_vel_d * (error - state->pid_vel_error_prev) / dt;
    state->pid_vel_error_prev = error;
    
    return p_term + state->pid_vel_integral + d_term;
}

/**
 * @brief Position PID controller
 */
static float FOC_PID_Position(Motor_ID_t motor_id, float error)
{
    Motor_State_t *state = &motor_states[motor_id];
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    // P term
    float p_term = cfg->pid_pos_p * error;
    
    // I term with anti-windup
    state->pid_pos_integral += cfg->pid_pos_i * error * dt;
    state->pid_pos_integral = constrain(state->pid_pos_integral, 
                                        -cfg->max_velocity, 
                                        cfg->max_velocity);
    
    // D term
    float d_term = cfg->pid_pos_d * (error - state->pid_pos_error_prev) / dt;
    state->pid_pos_error_prev = error;
    
    return p_term + state->pid_pos_integral + d_term;
}

/**
 * @brief Clarke transform: ABC → Alpha-Beta
 */
static void FOC_Clarke(float a, float b, float c, float *alpha, float *beta)
{
    *alpha = a;
    *beta = _1_SQRT3 * a + _2_SQRT3 * b;
}

/**
 * @brief Park transform: Alpha-Beta → D-Q
 */
static void FOC_Park(float alpha, float beta, float angle, float *d, float *q)
{
    float cos_a = cosf(angle);
    float sin_a = sinf(angle);
    
    *d = alpha * cos_a + beta * sin_a;
    *q = -alpha * sin_a + beta * cos_a;
}

/**
 * @brief Inverse Park transform: D-Q → Alpha-Beta
 */
static void FOC_InversePark(float d, float q, float angle, float *alpha, float *beta)
{
    float cos_a = cosf(angle);
    float sin_a = sinf(angle);
    
    *alpha = d * cos_a - q * sin_a;
    *beta = d * sin_a + q * cos_a;
}

/**
 * @brief Space Vector PWM (SVPWM)
 * 
 * Converts alpha-beta voltages to 3-phase duty cycles using space vector modulation.
 * Provides better DC bus utilization than sinusoidal PWM.
 */
static void FOC_SVPWM(float alpha, float beta, float *duty_a, float *duty_b, float *duty_c)
{
    // Sector calculation
    float angle = atan2f(beta, alpha);
    if (angle < 0) angle += _2PI;
    
    uint8_t sector = (uint8_t)(angle / (_PI / 3.0f));
    
    // Magnitude
    float magnitude = sqrtf(alpha * alpha + beta * beta);
    
    // Calculate duty cycles using space vector algorithm
    float t1, t2, t0;
    
    float sector_angle = angle - sector * (_PI / 3.0f);
    
    t1 = magnitude * sinf((_PI / 3.0f) - sector_angle);
    t2 = magnitude * sinf(sector_angle);
    t0 = 1.0f - t1 - t2;
    
    // Distribute zero time
    t0 = t0 / 2.0f;
    
    // Calculate duty cycles based on sector
    switch (sector) {
        case 0:
            *duty_a = t0 + t1 + t2;
            *duty_b = t0 + t2;
            *duty_c = t0;
            break;
        case 1:
            *duty_a = t0 + t1;
            *duty_b = t0 + t1 + t2;
            *duty_c = t0;
            break;
        case 2:
            *duty_a = t0;
            *duty_b = t0 + t1 + t2;
            *duty_c = t0 + t2;
            break;
        case 3:
            *duty_a = t0;
            *duty_b = t0 + t1;
            *duty_c = t0 + t1 + t2;
            break;
        case 4:
            *duty_a = t0 + t2;
            *duty_b = t0;
            *duty_c = t0 + t1 + t2;
            break;
        case 5:
            *duty_a = t0 + t1 + t2;
            *duty_b = t0;
            *duty_c = t0 + t1;
            break;
        default:
            *duty_a = 0.5f;
            *duty_b = 0.5f;
            *duty_c = 0.5f;
            break;
    }
    
    // Constrain to [0, 1]
    *duty_a = constrain(*duty_a, 0.0f, 1.0f);
    *duty_b = constrain(*duty_b, 0.0f, 1.0f);
    *duty_c = constrain(*duty_c, 0.0f, 1.0f);
}

/**
 * @brief Update PWM duty cycles
 */
static void FOC_SetPWM(Motor_ID_t motor_id, float duty_a, float duty_b, float duty_c)
{
    Motor_Config_t *cfg = &motor_configs[motor_id];
    
    uint32_t arr = __HAL_TIM_GET_AUTORELOAD(cfg->htim_pwm);
    
    uint32_t ccr_a = (uint32_t)(duty_a * arr);
    uint32_t ccr_b = (uint32_t)(duty_b * arr);
    uint32_t ccr_c = (uint32_t)(duty_c * arr);
    
    __HAL_TIM_SET_COMPARE(cfg->htim_pwm, TIM_CHANNEL_1, ccr_a);
    __HAL_TIM_SET_COMPARE(cfg->htim_pwm, TIM_CHANNEL_2, ccr_b);
    __HAL_TIM_SET_COMPARE(cfg->htim_pwm, TIM_CHANNEL_3, ccr_c);
}

/**
 * @brief Constrain value to range
 */
static float constrain(float value, float min, float max)
{
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

#define _2_SQRT3        1.15470053838f
