export interface ParsedWaterData {
  milliliters: number;
  timestamp: number;
  type: 'water_data';
}

export interface ParsedStatusData {
  status: string;
  battery: number;
  mode: string;
  type: 'status';
}

export type ParsedData = ParsedWaterData | ParsedStatusData;

/**
 * Parse ESP32 data format with strict validation
 * Water data: "ML:123,TS:456789"
 * Status data: "STATUS:OK,BATTERY:100,MODE:SIM"
 */
export const parseESP32Data = (rawData: string): ParsedData | null => {
  if (!rawData || typeof rawData !== 'string') {
    console.warn('Invalid raw data provided to parser:', rawData);
    return null;
  }

  try {
    const trimmedData = rawData.trim();
    
    // Check if it's water data format
    if (trimmedData.startsWith('ML:')) {
      const mlMatch = trimmedData.match(/ML:(\d+),TS:(\d+)/);
      if (mlMatch && mlMatch.length === 3) {
        const milliliters = parseInt(mlMatch[1]!, 10);
        const timestamp = parseInt(mlMatch[2]!, 10);
        
        // Validate parsed values
        if (isNaN(milliliters) || isNaN(timestamp) || milliliters < 0 || timestamp < 0) {
          console.warn('Invalid water data values:', { milliliters, timestamp });
          return null;
        }
        
        return {
          type: 'water_data',
          milliliters,
          timestamp,
        };
      }
    }
    
    // Check if it's status data format
    if (trimmedData.startsWith('STATUS:')) {
      const statusMatch = trimmedData.match(/STATUS:(\w+),BATTERY:(\d+),MODE:(\w+)/);
      if (statusMatch && statusMatch.length === 4) {
        const status = statusMatch[1]!;
        const battery = parseInt(statusMatch[2]!, 10);
        const mode = statusMatch[3]!;
        
        // Validate parsed values
        if (isNaN(battery) || battery < 0 || battery > 100) {
          console.warn('Invalid battery level:', battery);
          return null;
        }
        
        return {
          type: 'status',
          status,
          battery,
          mode,
        };
      }
    }
    
    // If no known format, return null
    console.debug('Unknown data format:', trimmedData);
    return null;
  } catch (error) {
    console.error('Error parsing ESP32 data:', error);
    return null;
  }
};

/**
 * Format timestamp for display with validation
 */
export const formatTimestamp = (timestamp: number): string => {
  if (isNaN(timestamp) || timestamp < 0) {
    console.warn('Invalid timestamp provided:', timestamp);
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date created from timestamp:', timestamp);
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format water data for display with validation
 */
export const formatWaterData = (data: ParsedWaterData): string => {
  if (!data || data.type !== 'water_data') {
    return 'Invalid water data';
  }
  
  return `${data.milliliters}ml at ${formatTimestamp(data.timestamp)}`;
};

/**
 * Format status data for display with validation
 */
export const formatStatusData = (data: ParsedStatusData): string => {
  if (!data || data.type !== 'status') {
    return 'Invalid status data';
  }
  
  return `Status: ${data.status}, Battery: ${data.battery}%, Mode: ${data.mode}`;
};
