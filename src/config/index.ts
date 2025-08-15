import dotenv from 'dotenv';
import { APIConfig } from '../types';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: parseInt(process.env.PORT || '3001'),
  updateIntervalHours: parseInt(process.env.UPDATE_INTERVAL_HOURS || '1'),
  
  // Feature flags
  enableWeatherUpdates: process.env.ENABLE_WEATHER_UPDATES === 'true',
  enableInjuryUpdates: process.env.ENABLE_INJURY_UPDATES === 'true',
  enableStatsUpdates: process.env.ENABLE_STATS_UPDATES === 'true',
  enableNewsUpdates: process.env.ENABLE_NEWS_UPDATES === 'true',
  
  // API Configuration
  mySportsFeeds: {
    apiKey: process.env.MYSPORTSFEEDS_API_KEY || '',
    baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull/nfl',
    rateLimit: 100, // requests per minute
    timeout: 30000, // 30 seconds
  },
  
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    rateLimit: 60, // requests per minute
    timeout: 15000, // 15 seconds
  },
  
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    timeout: 30000, // 30 seconds
  },
  
  // Stadium coordinates for weather data
  stadiumCoordinates: {
    'ATL': { lat: 33.7553, lon: -84.4006 }, // Mercedes-Benz Stadium
    'BAL': { lat: 39.2783, lon: -76.6222 }, // M&T Bank Stadium
    'BUF': { lat: 42.7737, lon: -78.7870 }, // Highmark Stadium
    'CAR': { lat: 35.2253, lon: -80.8431 }, // Bank of America Stadium
    'CHI': { lat: 41.9484, lon: -87.6553 }, // Soldier Field
    'CIN': { lat: 39.0955, lon: -84.5160 }, // Paycor Stadium
    'CLE': { lat: 41.5061, lon: -81.6996 }, // FirstEnergy Stadium
    'DAL': { lat: 32.7478, lon: -97.0928 }, // AT&T Stadium
    'DEN': { lat: 39.7439, lon: -105.0200 }, // Empower Field at Mile High
    'DET': { lat: 42.3400, lon: -83.0456 }, // Ford Field
    'GB': { lat: 44.5013, lon: -88.0622 }, // Lambeau Field
    'HOU': { lat: 29.6847, lon: -95.4107 }, // NRG Stadium
    'IND': { lat: 39.7601, lon: -86.1639 }, // Lucas Oil Stadium
    'JAX': { lat: 30.3239, lon: -81.6377 }, // TIAA Bank Field
    'KC': { lat: 39.0997, lon: -94.5786 }, // Arrowhead Stadium
    'LAC': { lat: 33.9533, lon: -118.3388 }, // SoFi Stadium
    'LAR': { lat: 33.9533, lon: -118.3388 }, // SoFi Stadium
    'LV': { lat: 36.0908, lon: -115.1807 }, // Allegiant Stadium
    'MIA': { lat: 25.9580, lon: -80.2389 }, // Hard Rock Stadium
    'MIN': { lat: 44.9740, lon: -93.2583 }, // U.S. Bank Stadium
    'NE': { lat: 42.0909, lon: -71.2643 }, // Gillette Stadium
    'NO': { lat: 29.9508, lon: -90.0811 }, // Caesars Superdome
    'NYG': { lat: 40.8128, lon: -74.0741 }, // MetLife Stadium
    'NYJ': { lat: 40.8128, lon: -74.0741 }, // MetLife Stadium
    'PHI': { lat: 39.9010, lon: -75.1675 }, // Lincoln Financial Field
    'PIT': { lat: 40.4468, lon: -79.9758 }, // Heinz Field
    'SEA': { lat: 47.5952, lon: -122.3316 }, // Lumen Field
    'SF': { lat: 37.4033, lon: -121.9694 }, // Levi's Stadium
    'TB': { lat: 27.9759, lon: -82.5033 }, // Raymond James Stadium
    'TEN': { lat: 36.1664, lon: -86.7714 }, // Nissan Stadium
    'WAS': { lat: 38.9076, lon: -77.0172 }, // FedExField
  },
  
  // Default metric weights for prediction model
  defaultMetricWeights: [
    { id: 'team_strength', weight: 25, name: 'Team Strength', description: 'Overall team performance and statistics' },
    { id: 'offensive_power', weight: 20, name: 'Offensive Power', description: 'Scoring ability and offensive efficiency' },
    { id: 'defensive_power', weight: 20, name: 'Defensive Power', description: 'Defensive performance and stopping ability' },
    { id: 'injury_impact', weight: 15, name: 'Injury Impact', description: 'Effect of player injuries on team performance' },
    { id: 'weather_conditions', weight: 10, name: 'Weather Conditions', description: 'Impact of weather on game performance' },
    { id: 'schedule_strength', weight: 10, name: 'Schedule Strength', description: 'Difficulty of recent and upcoming opponents' },
  ],
  
  // Prediction model configuration
  predictionModel: {
    confidenceThresholds: {
      high: 0.75,
      medium: 0.6,
      low: 0.4,
    },
    homeFieldAdvantage: 0.03, // 3% boost for home team
    restAdvantage: 0.02, // 2% boost for teams with more rest
    momentumFactor: 0.05, // 5% boost for teams on winning streaks
  },
} as const;

export function validateConfig(): void {
  const requiredEnvVars = [
    'MYSPORTSFEEDS_API_KEY',
    'OPENWEATHER_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  if (!config.mySportsFeeds.apiKey) {
    throw new Error('MySportsFeeds API key is required');
  }
  
  if (!config.openWeather.apiKey) {
    throw new Error('OpenWeather API key is required');
  }
  
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase configuration is required');
  }
}