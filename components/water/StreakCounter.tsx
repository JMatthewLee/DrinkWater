/**
 * Streak Counter Component (Simplified Version)
 * Visual streak display with fire emoji and animations
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
}) => {
  const theme = useTheme();
  const [scale, setScale] = useState(1);
  const [fireScale, setFireScale] = useState(1);

  // Celebrate milestone achievements
  const milestones = [7, 14, 30, 60, 90];
  const isMilestone = milestones.includes(currentStreak);

  useEffect(() => {
    if (currentStreak > 0) {
      // Animate streak counter
      setScale(1.2);
      setTimeout(() => setScale(1), 200);

      // Special animation for milestones
      if (isMilestone) {
        setFireScale(1.5);
        setTimeout(() => setFireScale(1), 300);
      }
    }
  }, [currentStreak]);

  const getStreakColor = () => {
    if (currentStreak >= 30) return '#10b981'; // green
    if (currentStreak >= 14) return '#f59e0b'; // amber
    if (currentStreak >= 7) return '#ef4444'; // red
    return theme.colors.primary;
  };

  const getFireEmoji = () => {
    if (currentStreak >= 90) return '🔥🔥🔥';
    if (currentStreak >= 30) return '🔥🔥';
    if (currentStreak >= 7) return '🔥';
    return '💧';
  };

  return (
    <View style={styles.container}>
      <View style={styles.streakContainer}>
        <View style={[styles.fireContainer, { transform: [{ scale: fireScale }] }]}>
          <Text style={styles.fireEmoji}>{getFireEmoji()}</Text>
        </View>
        
        <View style={[styles.textContainer, { transform: [{ scale }] }]}>
          <Text style={[styles.currentStreak, { color: getStreakColor() }]}>
            {currentStreak}
          </Text>
          <Text style={styles.streakLabel}>
            day{currentStreak !== 1 ? 's' : ''} streak
          </Text>
        </View>
      </View>
      
      {longestStreak > currentStreak && (
        <View style={styles.longestContainer}>
          <Text style={styles.longestLabel}>
            Best: {longestStreak} days
          </Text>
        </View>
      )}
      
      {isMilestone && (
        <View style={styles.milestoneContainer}>
          <Text style={styles.milestoneText}>
            🎉 Milestone reached!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireContainer: {
    marginRight: 8,
  },
  fireEmoji: {
    fontSize: 32,
  },
  textContainer: {
    alignItems: 'center',
  },
  currentStreak: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  longestContainer: {
    marginTop: 8,
  },
  longestLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  milestoneContainer: {
    marginTop: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestoneText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
});

export default StreakCounter;
