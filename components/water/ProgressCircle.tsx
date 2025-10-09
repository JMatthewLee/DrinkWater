/**
 * Progress Circle Component (Simplified Version)
 * Large circular progress indicator for daily water goal
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatAmount } from '../../utils/calculations';
import { getProgressColor } from '../../utils/calculations';

interface ProgressCircleProps {
  currentMl: number;
  goalMl: number;
  size?: number;
  strokeWidth?: number;
  unit?: 'ml' | 'oz' | 'cups';
  onGoalReached?: () => void;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  currentMl,
  goalMl,
  size = 200,
  strokeWidth = 12,
  unit = 'ml',
  onGoalReached,
}) => {
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const [celebrationTriggered, setCelebrationTriggered] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const percentage = goalMl > 0 ? Math.min((currentMl / goalMl) * 100, 100) : 0;
  const progressColor = getProgressColor(percentage);

  useEffect(() => {
    // Animate progress
    const timer = setTimeout(() => {
      setProgress(percentage / 100);
    }, 100);
    
    // Trigger celebration animation when reaching 100%
    if (percentage >= 100 && !celebrationTriggered) {
      setCelebrationTriggered(true);
      setScale(1.1);
      
      setTimeout(() => {
        setScale(1);
        if (onGoalReached) {
          onGoalReached();
        }
      }, 300);
    } else if (percentage < 100) {
      setCelebrationTriggered(false);
    }
    
    return () => clearTimeout(timer);
  }, [percentage]);

  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { transform: [{ scale }] }]}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        
        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={styles.currentAmount}>
            {formatAmount(currentMl, unit)}
          </Text>
          <Text style={styles.goalAmount}>
            / {formatAmount(goalMl, unit)}
          </Text>
          <Text style={styles.percentage}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  goalAmount: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  percentage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ProgressCircle;
