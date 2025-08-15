import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { logger, logAPICall } from '../utils/logger';
import { NFLGame, TeamStats, PlayerInjury, NFLTeam } from '../types';

export class MySportsFeedsAPI {
  private client: AxiosInstance;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // Reset every minute

  constructor() {
    this.client = axios.create({
      baseURL: config.mySportsFeeds.baseUrl,
      timeout: config.mySportsFeeds.timeout,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.mySportsFeeds.apiKey}:MYSPORTSFEEDS`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - this.lastRequestTime;
        logAPICall('MySportsFeeds', response.config.url || '', response.status, duration);
        return response;
      },
      (error) => {
        const duration = Date.now() - this.lastRequestTime;
        logAPICall('MySportsFeeds', error.config?.url || '', error.response?.status || 0, duration, error.message);
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
      if (this.requestCount >= config.mySportsFeeds.rateLimit) {
        const waitTime = this.resetTime - now;
        logger.info(`Rate limit reached, waiting ${waitTime}ms`);
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
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessingQueue = false;
  }

  async getCurrentSeason(): Promise<{ year: number; seasonType: number }> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // NFL season typically runs from September to February
    if (currentMonth >= 9 || currentMonth <= 2) {
      return { year: currentYear, seasonType: 2 }; // Regular season
    } else if (currentMonth >= 3 && currentMonth <= 5) {
      return { year: currentYear, seasonType: 1 }; // Preseason
    } else {
      return { year: currentYear, seasonType: 3 }; // Postseason
    }
  }

  async getTeams(): Promise<NFLTeam[]> {
    return this.rateLimitRequest(async () => {
      try {
        const response: AxiosResponse = await this.client.get('/teams.json');
        
        if (response.data && response.data.teams) {
          return response.data.teams.map((team: any) => ({
            id: team.team.id,
            name: team.team.name,
            abbreviation: team.team.abbreviation,
            city: team.team.city,
            conference: team.team.conference,
            division: team.team.division,
            logo: team.team.logos?.[0]?.href,
            primaryColor: team.team.colors?.primary,
            secondaryColor: team.team.colors?.secondary,
          }));
        }
        
        return [];
      } catch (error) {
        logger.error('Failed to fetch teams from MySportsFeeds', { error: error.message });
        throw error;
      }
    });
  }

  async getGames(week: number, year: number, seasonType: number): Promise<NFLGame[]> {
    return this.rateLimitRequest(async () => {
      try {
        const seasonTypeStr = seasonType === 1 ? 'pre' : seasonType === 2 ? 'reg' : 'post';
        const response: AxiosResponse = await this.client.get(`/${year}-${seasonTypeStr}/week/${week}/games.json`);
        
        if (response.data && response.data.games) {
          return response.data.games.map((game: any) => ({
            id: game.schedule.id,
            week: game.schedule.week,
            year: game.schedule.season,
            seasonType: game.schedule.seasonType,
            awayTeamId: game.schedule.awayTeam.id,
            homeTeamId: game.schedule.homeTeam.id,
            gameDate: game.schedule.startTime,
            gameTime: new Date(game.schedule.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            }),
            timezone: game.schedule.timezone,
            venue: game.schedule.venue?.name || 'TBD',
            venueCity: game.schedule.venue?.city || 'TBD',
            venueState: game.schedule.venue?.state || 'TBD',
            status: this.mapGameStatus(game.schedule.status),
            awayScore: game.score?.awayScoreTotal,
            homeScore: game.score?.homeScoreTotal,
            quarter: game.score?.currentQuarter,
            timeRemaining: game.score?.currentTimeRemaining,
          }));
        }
        
        return [];
      } catch (error) {
        logger.error('Failed to fetch games from MySportsFeeds', { 
          week, 
          year, 
          seasonType, 
          error: error.message 
        });
        throw error;
      }
    });
  }

  async getTeamStats(week: number, year: number, seasonType: number): Promise<TeamStats[]> {
    return this.rateLimitRequest(async () => {
      try {
        const seasonTypeStr = seasonType === 1 ? 'pre' : seasonType === 2 ? 'reg' : 'post';
        const response: AxiosResponse = await this.client.get(`/${year}-${seasonTypeStr}/week/${week}/team_stats_totals.json`);
        
        if (response.data && response.data.teamStatsTotals) {
          return response.data.teamStatsTotals.map((stat: any) => ({
            teamId: stat.team.id,
            week: stat.stats.week,
            year: stat.stats.season,
            gamesPlayed: stat.stats.gamesPlayed || 0,
            wins: stat.stats.wins || 0,
            losses: stat.stats.losses || 0,
            ties: stat.stats.ties || 0,
            pointsFor: stat.stats.pointsFor || 0,
            pointsAgainst: stat.stats.pointsAgainst || 0,
            totalYards: stat.stats.totalYards || 0,
            passingYards: stat.stats.passingYards || 0,
            rushingYards: stat.stats.rushingYards || 0,
            totalYardsAllowed: stat.stats.totalYardsAllowed || 0,
            passingYardsAllowed: stat.stats.passingYardsAllowed || 0,
            rushingYardsAllowed: stat.stats.rushingYardsAllowed || 0,
            turnovers: stat.stats.turnovers || 0,
            takeaways: stat.stats.takeaways || 0,
            sacks: stat.stats.sacks || 0,
            sacksAllowed: stat.stats.sacksAllowed || 0,
            thirdDownPercentage: stat.stats.thirdDownPercentage || 0,
            thirdDownPercentageAllowed: stat.stats.thirdDownPercentageAllowed || 0,
            redZonePercentage: stat.stats.redZonePercentage || 0,
            redZonePercentageAllowed: stat.stats.redZonePercentageAllowed || 0,
            timeOfPossession: stat.stats.timeOfPossession || 0,
            penalties: stat.stats.penalties || 0,
            penaltyYards: stat.stats.penaltyYards || 0,
          }));
        }
        
        return [];
      } catch (error) {
        logger.error('Failed to fetch team stats from MySportsFeeds', { 
          week, 
          year, 
          seasonType, 
          error: error.message 
        });
        throw error;
      }
    });
  }

  async getPlayerInjuries(week: number, year: number, seasonType: number): Promise<PlayerInjury[]> {
    return this.rateLimitRequest(async () => {
      try {
        const seasonTypeStr = seasonType === 1 ? 'pre' : seasonType === 2 ? 'reg' : 'post';
        const response: AxiosResponse = await this.client.get(`/${year}-${seasonTypeStr}/week/${week}/player_injuries.json`);
        
        if (response.data && response.data.playerInjuries) {
          return response.data.playerInjuries.map((injury: any) => ({
            id: injury.id,
            playerId: injury.player.id,
            teamId: injury.team.id,
            status: this.mapInjuryStatus(injury.status),
            injury: injury.injury || 'Unknown',
            practiceStatus: this.mapPracticeStatus(injury.practiceStatus),
            gameStatus: this.mapGameStatus(injury.gameStatus),
            lastUpdated: new Date().toISOString(),
          }));
        }
        
        return [];
      } catch (error) {
        logger.error('Failed to fetch player injuries from MySportsFeeds', { 
          week, 
          year, 
          seasonType, 
          error: error.message 
        });
        throw error;
      }
    });
  }

  private mapGameStatus(status: string): 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled' {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'in_progress':
        return 'live';
      case 'final':
      case 'closed':
        return 'final';
      case 'postponed':
        return 'postponed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }

  private mapInjuryStatus(status: string): 'questionable' | 'doubtful' | 'out' | 'injured-reserve' | 'pup' | 'healthy' {
    switch (status?.toLowerCase()) {
      case 'questionable':
        return 'questionable';
      case 'doubtful':
        return 'doubtful';
      case 'out':
        return 'out';
      case 'ir':
      case 'injured-reserve':
        return 'injured-reserve';
      case 'pup':
        return 'pup';
      default:
        return 'healthy';
    }
  }

  private mapPracticeStatus(status: string): 'full' | 'limited' | 'did-not-participate' | 'unknown' {
    switch (status?.toLowerCase()) {
      case 'full':
        return 'full';
      case 'limited':
        return 'limited';
      case 'dnp':
      case 'did-not-participate':
        return 'did-not-participate';
      default:
        return 'unknown';
    }
  }
}