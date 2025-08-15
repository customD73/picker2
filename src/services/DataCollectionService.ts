import { logger, logDataUpdate } from '../utils/logger';
import { config } from '../config';
import { MySportsFeedsAPI } from './MySportsFeedsAPI';
import { OpenWeatherAPI } from './OpenWeatherAPI';
import { PredictionEngine } from './PredictionEngine';
import { 
  NFLGame, 
  TeamStats, 
  PlayerInjury, 
  GameWeather, 
  NFLTeam,
  GamePrediction,
  DataUpdateLog 
} from '../types';

export class DataCollectionService {
  private mySportsFeeds: MySportsFeedsAPI;
  private weatherAPI: OpenWeatherAPI;
  private predictionEngine: PredictionEngine;
  private updateLogs: DataUpdateLog[] = [];

  constructor() {
    this.mySportsFeeds = new MySportsFeedsAPI();
    this.weatherAPI = new OpenWeatherAPI();
    this.predictionEngine = new PredictionEngine();
  }

  async collectAllData(week?: number, year?: number, seasonType?: number): Promise<void> {
    const startTime = Date.now();
    logger.info('Starting comprehensive data collection');

    try {
      // Get current season info if not provided
      if (!week || !year || !seasonType) {
        const currentSeason = await this.mySportsFeeds.getCurrentSeason();
        week = week || currentSeason.year === 2024 ? 18 : 1; // Default to current week
        year = year || currentSeason.year;
        seasonType = seasonType || currentSeason.seasonType;
      }

      logger.info(`Collecting data for Week ${week}, ${year}, Season Type ${seasonType}`);

      // Collect data in parallel where possible
      const [teams, games, teamStats, injuries] = await Promise.all([
        this.collectTeams(),
        this.collectGames(week, year, seasonType),
        this.collectTeamStats(week, year, seasonType),
        this.collectPlayerInjuries(week, year, seasonType),
      ]);

      // Collect weather data for all games
      const weatherData = await this.collectWeatherData(games);

      // Generate predictions
      const predictions = await this.generatePredictions(games, teamStats, injuries, teams);

      // Update database with all collected data
      await this.updateDatabase({
        teams,
        games,
        teamStats,
        injuries,
        weatherData,
        predictions,
      });

      const duration = Date.now() - startTime;
      logger.info(`Data collection completed successfully in ${duration}ms`, {
        teams: teams.length,
        games: games.length,
        stats: teamStats.length,
        injuries: injuries.length,
        predictions: predictions.length,
        duration,
      });

      // Log successful update
      this.logUpdate('comprehensive', 'success', {
        teams: teams.length,
        games: games.length,
        stats: teamStats.length,
        injuries: injuries.length,
        predictions: predictions.length,
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Data collection failed', { error: error.message, duration });
      
      this.logUpdate('comprehensive', 'failed', {
        teams: 0,
        games: 0,
        stats: 0,
        injuries: 0,
        predictions: 0,
      }, duration, [error.message]);
      
      throw error;
    }
  }

  async collectTeams(): Promise<NFLTeam[]> {
    try {
      logger.info('Collecting NFL teams data');
      const teams = await this.mySportsFeeds.getTeams();
      
      this.logUpdate('teams', 'success', { teams: teams.length });
      return teams;
    } catch (error) {
      logger.error('Failed to collect teams data', { error: error.message });
      this.logUpdate('teams', 'failed', { teams: 0 }, undefined, [error.message]);
      throw error;
    }
  }

  async collectGames(week: number, year: number, seasonType: number): Promise<NFLGame[]> {
    try {
      logger.info(`Collecting games data for Week ${week}, ${year}`);
      const games = await this.mySportsFeeds.getGames(week, year, seasonType);
      
      this.logUpdate('games', 'success', { games: games.length });
      return games;
    } catch (error) {
      logger.error('Failed to collect games data', { error: error.message });
      this.logUpdate('games', 'failed', { games: 0 }, undefined, [error.message]);
      throw error;
    }
  }

  async collectTeamStats(week: number, year: number, seasonType: number): Promise<TeamStats[]> {
    try {
      logger.info(`Collecting team stats for Week ${week}, ${year}`);
      const stats = await this.mySportsFeeds.getTeamStats(week, year, seasonType);
      
      this.logUpdate('stats', 'success', { stats: stats.length });
      return stats;
    } catch (error) {
      logger.error('Failed to collect team stats', { error: error.message });
      this.logUpdate('stats', 'failed', { stats: 0 }, undefined, [error.message]);
      throw error;
    }
  }

  async collectPlayerInjuries(week: number, year: number, seasonType: number): Promise<PlayerInjury[]> {
    try {
      logger.info(`Collecting player injuries for Week ${week}, ${year}`);
      const injuries = await this.mySportsFeeds.getPlayerInjuries(week, year, seasonType);
      
      this.logUpdate('injuries', 'success', { injuries: injuries.length });
      return injuries;
    } catch (error) {
      logger.error('Failed to collect player injuries', { error: error.message });
      this.logUpdate('injuries', 'failed', { injuries: 0 }, undefined, [error.message]);
      throw error;
    }
  }

  async collectWeatherData(games: NFLGame[]): Promise<Record<string, GameWeather | null>> {
    if (!config.enableWeatherUpdates) {
      logger.info('Weather updates disabled, skipping weather collection');
      return {};
    }

    try {
      logger.info('Collecting weather data for all games');
      
      // Get unique home teams for weather data
      const homeTeamAbbreviations = [...new Set(games.map(g => g.homeTeamId))];
      
      // For now, we'll use a simplified approach - in reality you'd map team IDs to abbreviations
      // This would require a lookup table or additional API call
      const weatherData: Record<string, GameWeather | null> = {};
      
      // Process weather collection in smaller batches to avoid overwhelming APIs
      const batchSize = 5;
      for (let i = 0; i < homeTeamAbbreviations.length; i += batchSize) {
        const batch = homeTeamAbbreviations.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (teamId) => {
          try {
            // This is a placeholder - you'd need to implement team ID to abbreviation mapping
            const teamAbbr = this.getTeamAbbreviation(teamId);
            if (teamAbbr) {
              const weather = await this.weatherAPI.getCurrentWeather(teamAbbr);
              return { teamId, weather };
            }
            return { teamId, weather: null };
          } catch (error) {
            logger.warn(`Failed to get weather for team ${teamId}`, { error: error.message });
            return { teamId, weather: null };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ teamId, weather }) => {
          weatherData[teamId] = weather;
        });

        // Add delay between batches
        if (i + batchSize < homeTeamAbbreviations.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.logUpdate('weather', 'success', { weather: Object.keys(weatherData).length });
      return weatherData;
    } catch (error) {
      logger.error('Failed to collect weather data', { error: error.message });
      this.logUpdate('weather', 'failed', { weather: 0 }, undefined, [error.message]);
      throw error;
    }
  }

  async generatePredictions(
    games: NFLGame[],
    teamStats: TeamStats[],
    injuries: PlayerInjury[],
    teams: NFLTeam[]
  ): Promise<GamePrediction[]> {
    try {
      logger.info('Generating game predictions');
      const predictions = await this.predictionEngine.generatePredictions(
        games,
        teamStats,
        injuries,
        teams
      );
      
      this.logUpdate('predictions', 'success', { predictions: predictions.length });
      return predictions;
    } catch (error) {
      logger.error('Failed to generate predictions', { error: error.message });
      this.logUpdate('predictions', 'failed', { predictions: 0 }, undefined, [error.message]);
      throw error;
    }
  }

  private async updateDatabase(data: {
    teams: NFLTeam[];
    games: NFLGame[];
    teamStats: TeamStats[];
    injuries: PlayerInjury[];
    weatherData: Record<string, GameWeather | null>;
    predictions: GamePrediction[];
  }): Promise<void> {
    try {
      logger.info('Updating database with collected data');
      
      // This is where you'd implement the actual database updates
      // For now, we'll just log what would be updated
      
      logger.info('Database update summary', {
        teams: data.teams.length,
        games: data.games.length,
        teamStats: data.teamStats.length,
        injuries: data.injuries.length,
        weatherRecords: Object.keys(data.weatherData).length,
        predictions: data.predictions.length,
      });

      // TODO: Implement actual database updates
      // - Update teams table
      // - Update games table
      // - Update team_stats table
      // - Update player_injuries table
      // - Update weather table
      // - Update predictions table

    } catch (error) {
      logger.error('Failed to update database', { error: error.message });
      throw error;
    }
  }

  private getTeamAbbreviation(teamId: string): string | null {
    // This is a placeholder - you'd need to implement proper team ID to abbreviation mapping
    // This could come from a teams lookup table or be part of the team data structure
    const teamAbbreviationMap: Record<string, string> = {
      // Add your team ID to abbreviation mappings here
      // Example: 'team_1': 'KC'
    };
    
    return teamAbbreviationMap[teamId] || null;
  }

  private logUpdate(
    dataType: string,
    status: 'success' | 'partial' | 'failed',
    counts: Record<string, number>,
    duration?: number,
    errors: string[] = []
  ): void {
    const updateLog: DataUpdateLog = {
      id: `update_${Date.now()}_${dataType}`,
      dataType: dataType as any,
      status,
      recordsProcessed: Object.values(counts).reduce((sum, count) => sum + count, 0),
      recordsUpdated: status === 'success' ? Object.values(counts).reduce((sum, count) => sum + count, 0) : 0,
      recordsCreated: status === 'success' ? Object.values(counts).reduce((sum, count) => sum + count, 0) : 0,
      errors,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: duration || 0,
    };

    this.updateLogs.push(updateLog);
    logDataUpdate(
      dataType,
      status,
      updateLog.recordsProcessed,
      updateLog.recordsUpdated,
      updateLog.recordsCreated,
      errors,
      duration
    );
  }

  getUpdateLogs(): DataUpdateLog[] {
    return [...this.updateLogs];
  }

  async collectDataForSpecificWeek(week: number, year: number, seasonType: number): Promise<void> {
    logger.info(`Collecting data for specific week: Week ${week}, ${year}, Season Type ${seasonType}`);
    await this.collectAllData(week, year, seasonType);
  }

  async collectDataForCurrentWeek(): Promise<void> {
    const currentSeason = await this.mySportsFeeds.getCurrentSeason();
    logger.info(`Collecting data for current week: ${currentSeason.year}, Season Type ${currentSeason.seasonType}`);
    
    // You'd need to determine the current week based on the season
    // This is a simplified approach
    await this.collectAllData(1, currentSeason.year, currentSeason.seasonType);
  }
}