// config.example.ts
// Instructions:
// 1. Copy this file to config.ts
// 2. Replace with your actual values
// 3. NEVER commit config.ts

export const config = {
    supabase: {
      url: 'https://YOUR_PROJECT_ID.supabase.co',
      anonKey: 'YOUR_ANON_KEY_HERE',
    },
    ble: {
      serviceUUID: '12345678-1234-1234-1234-123456789012',
      characteristicUUID: '87654321-4321-4321-4321-210987654321',
    },
  };