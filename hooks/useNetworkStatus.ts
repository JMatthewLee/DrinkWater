/**
 * Network status hook
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  type: string | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: false,
    isConnected: false,
    type: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isOnline: state.isConnected ?? false,
        isConnected: state.isConnected ?? false,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};
