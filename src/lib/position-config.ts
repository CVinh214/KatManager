// Position configuration for colors and icons
export interface PositionConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

// Default positions with predefined colors and icons
const DEFAULT_POSITION_CONFIG: Record<string, PositionConfig> = {
  'Cashier': {
    color: '#5eead4', // indigo
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    textColor: 'text-teal-800',
    icon: '💸',
  },
  'Waiter': {
    color: '#e95d00', // blue-yellow mix (light blue)
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    icon: '👟',
  },
  'Setup': {
    color: '#fda4af', // pink/rose
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-800',
    icon: '🔥',
  },
  'OFF': {
    color: '#9ca3af', // gray
    bgColor: 'bg-gray-200',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-700',
    icon: '🏖️',
  },
};

// Store for custom positions loaded from database
let customPositionConfigs: Record<string, PositionConfig> = {};

// Initialize custom positions from database
export function setCustomPositions(positions: Array<{ name: string; color: string; icon: string }>) {
  customPositionConfigs = {};
  positions.forEach(pos => {
    customPositionConfigs[pos.name] = createConfigFromColor(pos.color, pos.icon);
  });
}

// Create config from hex color
function createConfigFromColor(hexColor: string, icon: string): PositionConfig {
  // Convert hex to RGB for Tailwind-like classes (we'll use inline styles instead)
  return {
    color: hexColor,
    bgColor: '', // Will use inline style
    borderColor: '', // Will use inline style
    textColor: '', // Will use inline style
    icon: icon || '📦',
  };
}

// Get position configuration
export function getPositionConfig(positionName: string): PositionConfig {
  // Check default positions first
  if (DEFAULT_POSITION_CONFIG[positionName]) {
    return DEFAULT_POSITION_CONFIG[positionName];
  }
  
  // Check custom positions
  if (customPositionConfigs[positionName]) {
    return customPositionConfigs[positionName];
  }
  
  // Fallback to default config
  return {
    color: '#6366f1',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-800',
    icon: '📦',
  };
}

// Get position icon
export function getPositionIcon(positionName: string): string {
  return getPositionConfig(positionName).icon;
}

// Get position color (hex)
export function getPositionColor(positionName: string): string {
  return getPositionConfig(positionName).color;
}

// Get inline style for custom position
export function getPositionStyle(positionName: string): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  const config = getPositionConfig(positionName);
  
  // For default positions, return empty object (will use Tailwind classes)
  if (DEFAULT_POSITION_CONFIG[positionName]) {
    return {
      backgroundColor: '',
      borderColor: '',
      color: '',
    };
  }
  
  // For custom positions, calculate lighter/darker shades
  const hex = config.color;
  const rgb = hexToRgb(hex);
  
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
    color: `rgba(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)}, 1)`,
  };
}

// Helper: Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Predefined color palette for position selection
export const COLOR_PALETTE = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#fda4af' },
  { name: 'Blue', value: '#93c5fd' },
  { name: 'Green', value: '#86efac' },
  { name: 'Yellow', value: '#fde047' },
  { name: 'Orange', value: '#fdba74' },
  { name: 'Purple', value: '#d8b4fe' },
  { name: 'Red', value: '#fca5a5' },
  { name: 'Teal', value: '#5eead4' },
  { name: 'Gray', value: '#9ca3af' },
];

// Predefined emoji picker for positions
export const EMOJI_PICKER = [
  '💸', '💰', '💵', '💴', // Money/Cashier
  '👟', '🏃', '🚶', '🍽️', // Waiter/Service
  '🔥', '⚙️', '🔧', '🛠️', // Setup/Technical
  '🏖️', '🌴', '😴', '🏠', // OFF/Rest
  '☕', '🍔', '🍕', '🍜', // Food related
  '📦', '📋', '✅', '⭐', // General
  '🎯', '🎨', '💼', '👔', // Professional
  '🌟', '✨', '🔔', '📞', // Notification/Alert
];
