export const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'bg-green-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export const getConfidenceBadgeVariant = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'destructive';
    default: return 'outline';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'team': return 'bg-blue-100 text-blue-800';
    case 'player': return 'bg-green-100 text-green-800';
    case 'external': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatGameDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

export const getMaxWeeks = (seasonType: number) => {
  if (seasonType === 1) return 4; // Preseason
  if (seasonType === 2) return 18; // Regular season
  return 4; // Postseason
};

export const getSeasonTypeLabel = (type: number) => {
  switch (type) {
    case 1: return 'Preseason';
    case 2: return 'Regular Season';
    case 3: return 'Postseason';
    default: return 'Regular Season';
  }
};