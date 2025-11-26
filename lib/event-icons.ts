const CATEGORY_EMOJIS: Record<string, string> = {
  'Arts/Exhibits': '🎨',
  'Artisan': '🧶',
  'Celebrations': '🎉',
  'Charity/Cause': '🤝',
  'Comedy': '😂',
  'Consumer Show/Convention': '🏢',
  'Cultural': '🪅',
  'Dance': '💃',
  'Environmental': '🌱',
  'Family/Children': '👨‍👩‍👧',
  'Farmers Market': '🛒',
  "Farmers' Market": '🛒',
  'Film': '🎬',
  'Food/Culinary': '🍽️',
  'History': '📜',
  'Indigenous': '🪶',
  'Literary': '📚',
  'Live Performances': '🎭',
  'Museum': '🏛️',
  'Music': '🎵',
  'Nightlife': '🌙',
  'Parade': '🥁',
  'Public Square': '📍',
  'Run/Walk': '👟',
  'Seminars/Workshops': '📘',
  'Sports': '🏅',
  'Street Festival': '🛣️',
  'Talks': '🗣️',
  'Theatre': '🎭',
  'Tour': '🧭',
  'Trivia': '❓',
  'Virtual/Online Event': '💻',
  '2SLGBTQ+': '🏳️‍🌈',
  'Other': '✨',
};

export function getEventEmoji(categories: string[]): string {
  for (const category of categories) {
    const emoji = CATEGORY_EMOJIS[category];
    if (emoji) return emoji;
  }
  return '📅';
}
