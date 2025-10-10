export const SUPABASE_CONFIG = {
    url: process.env['EXPO_PUBLIC_SUPABASE_URL'] || 'https://your-project-id.supabase.co',
    anonKey: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] || 'your-anon-key-here',
    appUrl: process.env['EXPO_PUBLIC_APP_URL'] || 'exp://localhost:8081',
  };

export const BLE_CONFIG = {
  serviceUUID: '1693d55e-fc28-4cf2-ba71-2e9e1079a51b',
  WATER_CHARACTERISTIC_UUID: '3d108257-830b-4572-b7b7-328178886f66',
  COMMAND_CHARACTERISTIC_UUID: 'c1721d4d-970a-4037-956b-cf655b0cd5ef',
  BATTERY_CHARACTERISTIC_UUID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};