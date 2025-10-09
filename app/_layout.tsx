import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { WaterTrackingProvider } from '../context/WaterTrackingContext';
import { PaperProvider } from 'react-native-paper';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <PaperProvider>
        <AuthProvider>
          <WaterTrackingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen 
                name="index" 
                options={{ 
                  title: 'Water Tracker',
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="(auth)" 
                options={{ 
                  title: 'Authentication',
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="(tabs)" 
                options={{ 
                  title: 'Water Tracker',
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="+not-found" 
                options={{ 
                  title: 'Not Found',
                  headerShown: false,
                }} 
              />
            </Stack>
          </WaterTrackingProvider>
        </AuthProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
