/**
 * Quick Add Buttons Component
 * Row of buttons for common water amounts
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { formatAmount } from '../../utils/calculations';

interface QuickAddButtonsProps {
  amounts: number[];
  unit: 'ml' | 'oz' | 'cups';
  onAdd: (amount: number) => void;
  isLoading?: boolean;
}

const QuickAddButtons: React.FC<QuickAddButtonsProps> = ({
  amounts,
  unit,
  onAdd,
  isLoading = false,
}) => {
  const theme = useTheme();

  const handlePress = (amount: number) => {
    onAdd(amount);
  };

  return (
    <View style={styles.container}>
      {amounts.map((amount, index) => (
        <Button
          key={`${amount}-${index}`}
          mode="outlined"
          onPress={() => handlePress(amount)}
          disabled={isLoading}
          style={[
            styles.button,
            { borderColor: theme.colors.primary }
          ]}
          labelStyle={styles.buttonLabel}
          compact
        >
          {formatAmount(amount, unit)}
        </Button>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    minWidth: 80,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuickAddButtons;
