/**
 * Analytics Screen - Charts and statistics
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { useWaterTracking } from '../../context/WaterTrackingContext';
import { 
  getLogsForDateRange, 
  getAverageConsumption, 
  formatAmount,
  getTodayProgress 
} from '../../utils/calculations';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const { logs, settings } = useWaterTracking();
  const [timeRange, setTimeRange] = useState('7');

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  const rangeLogs = getLogsForDateRange(logs, startDate, endDate);
  const averageConsumption = getAverageConsumption(rangeLogs, parseInt(timeRange));
  const todayProgress = getTodayProgress(logs, settings.dailyGoalMl);

  // Calculate statistics
  const totalWater = rangeLogs.reduce((sum, log) => sum + log.amountMl, 0);
  const goalMetDays = rangeLogs.reduce((count, log) => {
    const dayLogs = getLogsForDateRange(logs, log.timestamp, log.timestamp);
    const dayTotal = dayLogs.reduce((sum, l) => sum + l.amountMl, 0);
    return dayTotal >= settings.dailyGoalMl ? count + 1 : count;
  }, 0);

  const consistencyScore = rangeLogs.length > 0 
    ? Math.round((goalMetDays / rangeLogs.length) * 100) 
    : 0;

  // Find best day
  const dailyTotals = rangeLogs.reduce((acc, log) => {
    const dateKey = log.timestamp.toDateString();
    acc[dateKey] = (acc[dateKey] || 0) + log.amountMl;
    return acc;
  }, {} as Record<string, number>);

  const bestDayTotal = Math.max(...Object.values(dailyTotals), 0);
  const bestDayDate = Object.keys(dailyTotals).find(
    date => dailyTotals[date] === bestDayTotal
  );

  // Simple bar chart data for weekly view
  const getWeeklyData = () => {
    if (timeRange !== '7') return [];
    
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayLogs = getLogsForDateRange(logs, date, date);
      const total = dayLogs.reduce((sum, log) => sum + log.amountMl, 0);
      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: total,
        percentage: (total / settings.dailyGoalMl) * 100,
      });
    }
    return weeklyData;
  };

  const weeklyData = getWeeklyData();

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: '7', label: '7 Days' },
              { value: '30', label: '30 Days' },
              { value: '90', label: '90 Days' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Key Statistics */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatAmount(averageConsumption, settings.unitPreference)}
              </Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatAmount(totalWater, settings.unitPreference)}
              </Text>
              <Text style={styles.statLabel}>Total Water</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{consistencyScore}%</Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatAmount(bestDayTotal, settings.unitPreference)}
              </Text>
              <Text style={styles.statLabel}>Best Day</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Weekly Chart */}
      {timeRange === '7' && weeklyData.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>7-Day Overview</Text>
            
            <View style={styles.chartContainer}>
              {weeklyData.map((data, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max((data.percentage / 100) * 120, 4),
                          backgroundColor: data.percentage >= 100 
                            ? '#10b981' 
                            : data.percentage >= 50 
                            ? '#f59e0b' 
                            : '#ef4444',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{data.day}</Text>
                  <Text style={styles.barValue}>
                    {formatAmount(data.amount, settings.unitPreference)}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Today's Progress */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(todayProgress.percentage, 100)}%`,
                    backgroundColor: todayProgress.percentage >= 100 
                      ? '#10b981' 
                      : todayProgress.percentage >= 50 
                      ? '#f59e0b' 
                      : '#ef4444',
                  },
                ]}
              />
            </View>
            
            <View style={styles.progressText}>
              <Text style={styles.progressCurrent}>
                {formatAmount(todayProgress.current, settings.unitPreference)}
              </Text>
              <Text style={styles.progressGoal}>
                / {formatAmount(todayProgress.goal, settings.unitPreference)}
              </Text>
            </View>
            
            <Text style={styles.progressPercentage}>
              {Math.round(todayProgress.percentage)}%
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          <View style={styles.insights}>
            {consistencyScore >= 80 && (
              <Text style={styles.insightText}>
                🎉 Excellent consistency! You're meeting your goal most days.
              </Text>
            )}
            
            {consistencyScore >= 50 && consistencyScore < 80 && (
              <Text style={styles.insightText}>
                👍 Good progress! Try to be more consistent with your daily goal.
              </Text>
            )}
            
            {consistencyScore < 50 && (
              <Text style={styles.insightText}>
                💪 Keep going! Focus on building a daily habit of drinking water.
              </Text>
            )}
            
            {averageConsumption < settings.dailyGoalMl * 0.8 && (
              <Text style={styles.insightText}>
                💧 Consider increasing your daily water intake to reach your goal.
              </Text>
            )}
            
            {bestDayTotal > settings.dailyGoalMl * 1.5 && (
              <Text style={styles.insightText}>
                🌟 Your best day shows you can exceed your goal! Use that as motivation.
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 2,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  progressCurrent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressGoal: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#6b7280',
  },
  insights: {
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default AnalyticsScreen;
