export const FEATURE_ICONS: Record<string, string> = {
  'Free Parking': '🅿️',
  'Paid Parking': '💲',
  'Public Washrooms': '🚻',
  'Bike Racks': '🚲',
  'Family Friendly': '👨‍👩‍👧',
  'Food Available': '🍽️',
  'Cash Only': '💵',
  'Accessible Washrooms': '♿',
  'Public Wi-Fi': '📶',
  'Parent Friendly': '🍼',
};

export const THEME_ICONS: Record<string, string> = {
  'Winter Holidays': '❄️',
  Music: '🎵',
  'Art & Exhibits': '🎨',
  'Family & Kids': '🧸',
  Film: '🎬',
  Sports: '🏅',
  Community: '🏘️',
  'Food & Drink': '🍴',
  Cultural: '🪅',
};

export function getFeatureIcon(feature: string): string {
  return FEATURE_ICONS[feature] || '✨';
}

export function getThemeIcon(theme: string): string {
  return THEME_ICONS[theme] || '🎉';
}
