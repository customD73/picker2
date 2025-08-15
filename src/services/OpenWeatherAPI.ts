import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { logger, logAPICall } from '../utils/logger';
import { GameWeather } from '../types';

export class OpenWeatherAPI {
  private client: AxiosInstance;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // Reset every minute

  constructor() {
    this.client = axios.create({
      baseURL: config.openWeather.baseUrl,
      timeout: config.openWeather.timeout,
      params: {
        appid: config.openWeather.apiKey,
        units: 'imperial', // Use Fahrenheit
      },
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - this.lastRequestTime;
        logAPICall('OpenWeather', response.config.url || '', response.status, duration);
        return response;
      },
      (error) => {
        const duration = Date.now() - this.lastRequestTime;
        logAPICall('OpenWeather', error.config?.url || '', error.response?.status || 0, duration, error.message);
        throw error;
      }
    );
  }

  private async rateLimitRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      const now = Date.now();
      
      // Reset counter if minute has passed
      if (now >= this.resetTime) {
        this.requestCount = 0;
        this.resetTime = now + 60000;
      }

      // Check rate limit
      if (this.requestCount >= config.openWeather.rateLimit) {
        const waitTime = this.resetTime - now;
        logger.info(`OpenWeather rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
      }

      const request = this.rateLimitQueue.shift();
      if (request) {
        this.requestCount++;
        this.lastRequestTime = Date.now();
        await request();
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    this.isProcessingQueue = false;
  }

  async getCurrentWeather(teamAbbreviation: string): Promise<GameWeather | null> {
    const coordinates = config.stadiumCoordinates[teamAbbreviation as keyof typeof config.stadiumCoordinates];
    
    if (!coordinates) {
      logger.warn(`No coordinates found for team: ${teamAbbreviation}`);
      return null;
    }

    return this.rateLimitRequest(async () => {
      try {
        const response: AxiosResponse = await this.client.get('/weather', {
          params: {
            lat: coordinates.lat,
            lon: coordinates.lon,
          },
        });

        if (response.data) {
          const weather = response.data;
          return {
            temperature: weather.main.temp,
            feelsLike: weather.main.feels_like,
            humidity: weather.main.humidity,
            windSpeed: weather.wind.speed,
            windDirection: this.getWindDirection(weather.wind.deg),
            conditions: weather.weather[0]?.main || 'Unknown',
            precipitation: weather.rain?.['1h'] || weather.snow?.['1h'] || 0,
            visibility: weather.visibility / 1000, // Convert to km
            uvIndex: 0, // OpenWeather free tier doesn't include UV index
            lastUpdated: new Date().toISOString(),
          };
        }

        return null;
      } catch (error) {
        logger.error('Failed to fetch weather from OpenWeather', { 
          team: teamAbbreviation, 
          coordinates,
          error: error.message 
        });
        throw error;
      }
    });
  }

  async getForecast(teamAbbreviation: string, gameDate: string): Promise<GameWeather | null> {
    const coordinates = config.stadiumCoordinates[teamAbbreviation as keyof typeof config.stadiumCoordinates];
    
    if (!coordinates) {
      logger.warn(`No coordinates found for team: ${teamAbbreviation}`);
      return null;
    }

    // Parse game date and find the closest forecast
    const gameDateTime = new Date(gameDate);
    const now = new Date();
    const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // If game is more than 5 days away, we can't get accurate forecast
    if (hoursUntilGame > 120) {
      logger.info(`Game too far in future for accurate forecast: ${teamAbbreviation} - ${gameDate}`);
      return null;
    }

    return this.rateLimitRequest(async () => {
      try {
        const response: AxiosResponse = await this.client.get('/forecast', {
          params: {
            lat: coordinates.lat,
            lon: coordinates.lon,
          },
        });

        if (response.data && response.data.list) {
          // Find the forecast closest to game time
          const gameTime = gameDateTime.getTime();
          let closestForecast: any = null;
          let smallestDiff = Infinity;

          for (const forecast of response.data.list) {
            const forecastTime = new Date(forecast.dt * 1000).getTime();
            const diff = Math.abs(forecastTime - gameTime);
            
            if (diff < smallestDiff) {
              smallestDiff = diff;
              closestForecast = forecast;
            }
          }

          if (closestForecast) {
            return {
              temperature: closestForecast.main.temp,
              feelsLike: closestForecast.main.feels_like,
              humidity: closestForecast.main.humidity,
              windSpeed: closestForecast.wind.speed,
              windDirection: this.getWindDirection(closestForecast.wind.deg),
              conditions: closestForecast.weather[0]?.main || 'Unknown',
              precipitation: closestForecast.rain?.['3h'] || closestForecast.snow?.['3h'] || 0,
              visibility: closestForecast.visibility / 1000, // Convert to km
              uvIndex: 0, // OpenWeather free tier doesn't include UV index
              lastUpdated: new Date().toISOString(),
            };
          }
        }

        return null;
      } catch (error) {
        logger.error('Failed to fetch forecast from OpenWeather', { 
          team: teamAbbreviation, 
          gameDate,
          coordinates,
          error: error.message 
        });
        throw error;
      }
    });
  }

  async getWeatherImpact(weather: GameWeather): Promise<number> {
    // Calculate weather impact score (0-100, higher = better conditions)
    let impact = 50; // Base score

    // Temperature impact (optimal range: 50-70°F)
    if (weather.temperature >= 50 && weather.temperature <= 70) {
      impact += 20;
    } else if (weather.temperature >= 40 && weather.temperature <= 80) {
      impact += 10;
    } else if (weather.temperature < 20 || weather.temperature > 90) {
      impact -= 30;
    } else if (weather.temperature < 30 || weather.temperature > 85) {
      impact -= 15;
    }

    // Wind impact (optimal: < 10 mph)
    if (weather.windSpeed < 10) {
      impact += 15;
    } else if (weather.windSpeed < 20) {
      impact += 5;
    } else if (weather.windSpeed > 30) {
      impact -= 25;
    } else if (weather.windSpeed > 20) {
      impact -= 10;
    }

    // Precipitation impact
    if (weather.precipitation === 0) {
      impact += 15;
    } else if (weather.precipitation < 0.1) {
      impact += 5;
    } else if (weather.precipitation > 0.5) {
      impact -= 20;
    } else if (weather.precipitation > 0.1) {
      impact -= 10;
    }

    // Visibility impact
    if (weather.visibility >= 10) {
      impact += 10;
    } else if (weather.visibility < 5) {
      impact -= 15;
    }

    // Conditions impact
    const badConditions = ['Thunderstorm', 'Snow', 'Sleet', 'Hail'];
    const moderateConditions = ['Rain', 'Drizzle', 'Mist', 'Fog'];
    
    if (badConditions.includes(weather.conditions)) {
      impact -= 25;
    } else if (moderateConditions.includes(weather.conditions)) {
      impact -= 10;
    } else if (weather.conditions === 'Clear') {
      impact += 10;
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, impact));
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  async getBulkWeather(teamAbbreviations: string[]): Promise<Record<string, GameWeather | null>> {
    const results: Record<string, GameWeather | null> = {};
    
    // Process teams in batches to respect rate limits
    const batchSize = 10;
    for (let i = 0; i < teamAbbreviations.length; i += batchSize) {
      const batch = teamAbbreviations.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (team) => {
        try {
          const weather = await this.getCurrentWeather(team);
          return { team, weather };
        } catch (error) {
          logger.error(`Failed to get weather for team: ${team}`, { error: error.message });
          return { team, weather: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ team, weather }) => {
        results[team] = weather;
      });

      // Add delay between batches
      if (i + batchSize < teamAbbreviations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}