/**
 * Index Screen - Handles authentication routing
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import LoadingScreen from '../components/common/LoadingScreen';
import OfflineBanner from '../components/common/OfflineBanner';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const router = useRouter();

  console.log('IndexScreen - Auth state:', { isAuthenticated, isLoading, userEmail: user?.email });
  console.log('IndexScreen - Component rendered');

  useEffect(() => {
    console.log('IndexScreen - useEffect triggered:', { isAuthenticated, isLoading });
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('IndexScreen - Redirecting to home page...');
        router.replace('/(tabs)');
      } else {
        console.log('IndexScreen - Redirecting to login page...');
        router.replace('/(auth)/login');
      }
    } else {
      console.log('IndexScreen - Still loading, not redirecting yet');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <>
      <OfflineBanner isVisible={!isOnline} />
      <LoadingScreen message="Redirecting..." />
    </>
  );
}
