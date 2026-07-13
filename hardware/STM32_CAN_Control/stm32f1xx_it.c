/**
 * @file stm32f1xx_it.c
 * @brief Interrupt Service Routine handlers
 * 
 * This file contains the interrupt handlers for the CAN motor control application.
 * Integrate these handlers into your existing stm32fXxx_it.c file.
 * 
 * @author Embedded Systems Engineer
 * @date 2026-07-13
 */

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "stm32f1xx_it.h"  // Change to your MCU family

/* External variables --------------------------------------------------------*/
extern CAN_HandleTypeDef hcan1;

/* Cortex-M3 Processor Interruption and Exception Handlers -------------------*/

/**
 * @brief This function handles Non maskable interrupt.
 */
void NMI_Handler(void)
{
    while (1) {
    }
}

/**
 * @brief This function handles Hard fault interrupt.
 */
void HardFault_Handler(void)
{
    while (1) {
    }
}

/**
 * @brief This function handles Memory management fault.
 */
void MemManage_Handler(void)
{
    while (1) {
    }
}

/**
 * @brief This function handles Prefetch fault, memory access fault.
 */
void BusFault_Handler(void)
{
    while (1) {
    }
}

/**
 * @brief This function handles Undefined instruction or illegal state.
 */
void UsageFault_Handler(void)
{
    while (1) {
    }
}

/**
 * @brief This function handles System service call via SWI instruction.
 */
void SVC_Handler(void)
{
}

/**
 * @brief This function handles Debug monitor.
 */
void DebugMon_Handler(void)
{
}

/**
 * @brief This function handles Pendable request for system service.
 */
void PendSV_Handler(void)
{
}

/**
 * @brief This function handles System tick timer.
 */
void SysTick_Handler(void)
{
    HAL_IncTick();
}

/* STM32F1xx Peripheral Interrupt Handlers ------------------------------------
   Add here the Interrupt Handlers for the used peripherals.
   For the available peripheral interrupt handler names,
   please refer to the startup file (startup_stm32f1xx.s). */

/**
 * @brief This function handles CAN1 RX0 interrupts.
 * 
 * Triggered when a message is received in FIFO0.
 */
void CAN1_RX0_IRQHandler(void)
{
    HAL_CAN_IRQHandler(&hcan1);
}

/**
 * @brief This function handles CAN1 SCE (Status Change Error) interrupt.
 * 
 * Triggered on:
 * - Error warning
 * - Error passive
 * - Bus-off
 * - Last error code
 */
void CAN1_SCE_IRQHandler(void)
{
    HAL_CAN_IRQHandler(&hcan1);
}

/**
 * @brief This function handles CAN1 TX interrupts (optional).
 * 
 * Uncomment if you enable TX complete interrupts.
 */
#if 0
void CAN1_TX_IRQHandler(void)
{
    HAL_CAN_IRQHandler(&hcan1);
}
#endif
