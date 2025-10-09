/**
 * Password Input Component
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton, HelperText } from 'react-native-paper';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  disabled = false,
}) => {
  const [isSecure, setIsSecure] = useState(true);

  const toggleSecure = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isSecure}
        error={!!error}
        placeholder={placeholder}
        disabled={disabled}
        right={
          <TextInput.Icon
            icon={isSecure ? 'eye' : 'eye-off'}
            onPress={toggleSecure}
          />
        }
        style={styles.input}
      />
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
});

export default PasswordInput;
