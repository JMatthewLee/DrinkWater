/**
 * Calendar Screen - Monthly view of water intake
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { useWaterTracking } from '../../context/WaterTrackingContext';
import { getLogsForDate, formatAmount } from '../../utils/calculations';

const CalendarScreen: React.FC = () => {
  const theme = useTheme();
  const { logs, settings, selectedDate, setSelectedDate } = useWaterTracking();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayLogs = getLogsForDate(logs, date);
      const totalMl = dayLogs.reduce((sum, log) => sum + log.amountMl, 0);
      const percentage = (totalMl / settings.dailyGoalMl) * 100;
      
      days.push({
        date,
        day,
        totalMl,
        percentage,
        logs: dayLogs,
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDayColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // Green
    if (percentage >= 50) return '#f59e0b'; // Amber
    if (percentage > 0) return '#ef4444'; // Red
    return '#e5e7eb'; // Gray
  };

  const getDayTextColor = (percentage: number) => {
    return percentage > 0 ? '#ffffff' : '#6b7280';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Month Navigation */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.monthHeader}>
            <Button
              mode="outlined"
              onPress={() => navigateMonth('prev')}
              icon="chevron-left"
              compact
            >
              Prev
            </Button>
            <Text style={styles.monthTitle}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigateMonth('next')}
              icon="chevron-right"
              compact
            >
              Next
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Calendar Grid */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.calendarGrid}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.dayHeader}>
                {day}
              </Text>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((dayData, index) => {
              if (!dayData) {
                return <View key={index} style={styles.dayCell} />;
              }
              
              const { day, totalMl, percentage } = dayData;
              const isToday = dayData.date.toDateString() === new Date().toDateString();
              
              return (
                <View
                  key={day}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: getDayColor(percentage),
                    },
                    isToday && styles.todayCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: getDayTextColor(percentage) },
                    ]}
                  >
                    {day}
                  </Text>
                  {totalMl > 0 && (
                    <Text
                      style={[
                        styles.dayAmount,
                        { color: getDayTextColor(percentage) },
                      ]}
                    >
                      {formatAmount(totalMl, settings.unitPreference)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      {/* Legend */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Legend</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Goal Met (100%+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Partial (50-99%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Low (1-49%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e5e7eb' }]} />
              <Text style={styles.legendText}>No Data</Text>
            </View>
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    borderRadius: 4,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayAmount: {
    fontSize: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default CalendarScreen;
