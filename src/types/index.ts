export interface NFLTeam {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface NFLPlayer {
  id: string;
  name: string;
  teamId: string;
  position: string;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  experience?: number;
  college?: string;
}

export interface NFLGame {
  id: string;
  week: number;
  year: number;
  seasonType: number; // 1=preseason, 2=regular, 3=postseason
  awayTeamId: string;
  homeTeamId: string;
  gameDate: string;
  gameTime: string;
  timezone: string;
  venue: string;
  venueCity: string;
  venueState: string;
  weather?: GameWeather;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';
  awayScore?: number;
  homeScore?: number;
  quarter?: string;
  timeRemaining?: string;
}

export interface GameWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  conditions: string;
  precipitation: number;
  visibility: number;
  uvIndex: number;
  lastUpdated: string;
}

export interface TeamStats {
  teamId: string;
  week: number;
  year: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  totalYards: number;
  passingYards: number;
  rushingYards: number;
  totalYardsAllowed: number;
  passingYardsAllowed: number;
  rushingYardsAllowed: number;
  turnovers: number;
  takeaways: number;
  sacks: number;
  sacksAllowed: number;
  thirdDownPercentage: number;
  thirdDownPercentageAllowed: number;
  redZonePercentage: number;
  redZonePercentageAllowed: number;
  timeOfPossession: number;
  penalties: number;
  penaltyYards: number;
}

export interface PlayerInjury {
  id: string;
  playerId: string;
  teamId: string;
  status: 'questionable' | 'doubtful' | 'out' | 'injured-reserve' | 'pup' | 'healthy';
  injury: string;
  practiceStatus: 'full' | 'limited' | 'did-not-participate' | 'unknown';
  gameStatus: 'questionable' | 'doubtful' | 'out' | 'probable' | 'healthy';
  lastUpdated: string;
}

export interface TeamNews {
  id: string;
  teamId: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  categories: string[];
}

export interface PredictionMetrics {
  teamStrength: number;
  offensivePower: number;
  defensivePower: number;
  injuryImpact: number;
  weatherImpact: number;
  scheduleStrength: number;
  homeFieldAdvantage: number;
  restAdvantage: number;
  momentum: number;
  overall: number;
}

export interface GamePrediction {
  id: string;
  gameId: string;
  week: number;
  year: number;
  awayTeamId: string;
  homeTeamId: string;
  awayWinProbability: number;
  homeWinProbability: number;
  confidence: 'high' | 'medium' | 'low';
  recommendation: 'away' | 'home' | 'none';
  metrics: {
    awayTeam: PredictionMetrics;
    homeTeam: PredictionMetrics;
    overall: PredictionMetrics;
  };
  factors: string[];
  lastUpdated: string;
  modelVersion: string;
}

export interface MetricWeight {
  id: string;
  name: string;
  description: string;
  weight: number;
  defaultWeight: number;
  category: 'team' | 'player' | 'external' | 'situational';
  minValue: number;
  maxValue: number;
}

export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  version: string;
  metricWeights: MetricWeight[];
  algorithm: string;
  accuracy: number;
  lastUpdated: string;
  isActive: boolean;
}

export interface DataUpdateLog {
  id: string;
  dataType: 'games' | 'stats' | 'injuries' | 'weather' | 'news' | 'predictions';
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsUpdated: number;
  recordsCreated: number;
  errors: string[];
  startedAt: string;
  completedAt: string;
  duration: number;
}

export interface APIConfig {
  mySportsFeeds: {
    apiKey: string;
    baseUrl: string;
    rateLimit: number;
    timeout: number;
  };
  openWeather: {
    apiKey: string;
    baseUrl: string;
    rateLimit: number;
    timeout: number;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
    timeout: number;
  };
}