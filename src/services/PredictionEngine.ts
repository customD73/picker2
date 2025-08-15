import { logger, logPrediction } from '../utils/logger';
import { config } from '../config';
import { 
  GamePrediction, 
  PredictionMetrics, 
  NFLGame, 
  TeamStats, 
  PlayerInjury, 
  GameWeather,
  NFLTeam 
} from '../types';
import { OpenWeatherAPI } from './OpenWeatherAPI';

export class PredictionEngine {
  private weatherAPI: OpenWeatherAPI;
  private modelVersion = '1.0.0';

  constructor() {
    this.weatherAPI = new OpenWeatherAPI();
  }

  async generatePredictions(
    games: NFLGame[],
    teamStats: TeamStats[],
    injuries: PlayerInjury[],
    teams: NFLTeam[]
  ): Promise<GamePrediction[]> {
    const predictions: GamePrediction[] = [];

    for (const game of games) {
      try {
        const prediction = await this.predictGame(game, teamStats, injuries, teams);
        predictions.push(prediction);
        
        logPrediction(
          game.id,
          game.awayTeamId,
          game.homeTeamId,
          prediction.awayWinProbability,
          prediction.homeWinProbability,
          prediction.confidence,
          this.modelVersion
        );
      } catch (error) {
        logger.error(`Failed to generate prediction for game ${game.id}`, { error: error.message });
      }
    }

    return predictions;
  }

  private async predictGame(
    game: NFLGame,
    teamStats: TeamStats[],
    injuries: PlayerInjury[],
    teams: NFLTeam[]
  ): Promise<GamePrediction> {
    const awayTeam = teams.find(t => t.id === game.awayTeamId);
    const homeTeam = teams.find(t => t.id === game.homeTeamId);
    
    if (!awayTeam || !homeTeam) {
      throw new Error(`Team not found for game ${game.id}`);
    }

    // Get team stats
    const awayStats = teamStats.find(s => s.teamId === game.awayTeamId);
    const homeStats = teamStats.find(s => s.teamId === game.homeTeamId);

    // Get injuries for both teams
    const awayInjuries = injuries.filter(i => i.teamId === game.awayTeamId);
    const homeInjuries = injuries.filter(i => i.teamId === game.homeTeamId);

    // Get weather data
    const weather = await this.getGameWeather(game, homeTeam.abbreviation);

    // Calculate metrics for both teams
    const awayMetrics = this.calculateTeamMetrics(awayStats, awayInjuries, weather, false);
    const homeMetrics = this.calculateTeamMetrics(homeStats, homeInjuries, weather, true);

    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(awayMetrics, homeMetrics);

    // Calculate win probabilities
    const { awayWinProbability, homeWinProbability } = this.calculateWinProbabilities(
      awayMetrics,
      homeMetrics,
      overallMetrics
    );

    // Determine confidence level
    const confidence = this.determineConfidence(awayWinProbability, homeWinProbability);

    // Determine recommendation
    const recommendation = this.determineRecommendation(awayWinProbability, homeWinProbability, confidence);

    // Generate factors explaining the prediction
    const factors = this.generateFactors(awayMetrics, homeMetrics, weather, awayTeam, homeTeam);

    return {
      id: `pred_${game.id}`,
      gameId: game.id,
      week: game.week,
      year: game.year,
      awayTeamId: game.awayTeamId,
      homeTeamId: game.homeTeamId,
      awayWinProbability,
      homeWinProbability,
      confidence,
      recommendation,
      metrics: {
        awayTeam: awayMetrics,
        homeTeam: homeMetrics,
        overall: overallMetrics,
      },
      factors,
      lastUpdated: new Date().toISOString(),
      modelVersion: this.modelVersion,
    };
  }

  private async getGameWeather(game: NFLGame, homeTeamAbbr: string): Promise<GameWeather | null> {
    try {
      // Try to get forecast first, fall back to current weather
      let weather = await this.weatherAPI.getForecast(homeTeamAbbr, game.gameDate);
      
      if (!weather) {
        weather = await this.weatherAPI.getCurrentWeather(homeTeamAbbr);
      }

      return weather;
    } catch (error) {
      logger.warn(`Failed to get weather for game ${game.id}`, { error: error.message });
      return null;
    }
  }

  private calculateTeamMetrics(
    stats: TeamStats | undefined,
    injuries: PlayerInjury[],
    weather: GameWeather | null,
    isHomeTeam: boolean
  ): PredictionMetrics {
    const teamStrength = this.calculateTeamStrength(stats);
    const offensivePower = this.calculateOffensivePower(stats);
    const defensivePower = this.calculateDefensivePower(stats);
    const injuryImpact = this.calculateInjuryImpact(injuries);
    const weatherImpact = weather ? this.calculateWeatherImpact(weather, isHomeTeam) : 50;
    const scheduleStrength = this.calculateScheduleStrength(stats);
    const homeFieldAdvantage = isHomeTeam ? config.predictionModel.homeFieldAdvantage * 100 : 0;
    const restAdvantage = this.calculateRestAdvantage(stats);
    const momentum = this.calculateMomentum(stats);

    const overall = (
      teamStrength * 0.25 +
      offensivePower * 0.20 +
      defensivePower * 0.20 +
      injuryImpact * 0.15 +
      weatherImpact * 0.10 +
      scheduleStrength * 0.10
    );

    return {
      teamStrength,
      offensivePower,
      defensivePower,
      injuryImpact,
      weatherImpact,
      scheduleStrength,
      homeFieldAdvantage,
      restAdvantage,
      momentum,
      overall: Math.round(overall),
    };
  }

  private calculateTeamStrength(stats: TeamStats | undefined): number {
    if (!stats) return 50;

    const winPercentage = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 50;
    const pointDifferential = stats.gamesPlayed > 0 ? (stats.pointsFor - stats.pointsAgainst) / stats.gamesPlayed : 0;
    
    // Normalize point differential to 0-100 scale
    const normalizedPointDiff = Math.max(0, Math.min(100, 50 + (pointDifferential * 2)));
    
    return Math.round((winPercentage * 0.7) + (normalizedPointDiff * 0.3));
  }

  private calculateOffensivePower(stats: TeamStats | undefined): number {
    if (!stats || stats.gamesPlayed === 0) return 50;

    const pointsPerGame = stats.pointsFor / stats.gamesPlayed;
    const yardsPerGame = stats.totalYards / stats.gamesPlayed;
    const thirdDownPercentage = stats.thirdDownPercentage;
    const redZonePercentage = stats.redZonePercentage;

    // Normalize to 0-100 scale
    const normalizedPoints = Math.min(100, (pointsPerGame / 30) * 100);
    const normalizedYards = Math.min(100, (yardsPerGame / 400) * 100);
    const normalizedThirdDown = thirdDownPercentage;
    const normalizedRedZone = redZonePercentage;

    return Math.round(
      (normalizedPoints * 0.4) +
      (normalizedYards * 0.3) +
      (normalizedThirdDown * 0.2) +
      (normalizedRedZone * 0.1)
    );
  }

  private calculateDefensivePower(stats: TeamStats | undefined): number {
    if (!stats || stats.gamesPlayed === 0) return 50;

    const pointsAllowedPerGame = stats.pointsAgainst / stats.gamesPlayed;
    const yardsAllowedPerGame = stats.totalYardsAllowed / stats.gamesPlayed;
    const thirdDownPercentageAllowed = stats.thirdDownPercentageAllowed;
    const redZonePercentageAllowed = stats.redZonePercentageAllowed;
    const takeaways = stats.takeaways;
    const sacks = stats.sacks;

    // Normalize to 0-100 scale (lower is better for defensive stats)
    const normalizedPoints = Math.max(0, 100 - (pointsAllowedPerGame / 30) * 100);
    const normalizedYards = Math.max(0, 100 - (yardsAllowedPerGame / 400) * 100);
    const normalizedThirdDown = 100 - thirdDownPercentageAllowed;
    const normalizedRedZone = 100 - redZonePercentageAllowed;
    const normalizedTakeaways = Math.min(100, (takeaways / stats.gamesPlayed) * 50);
    const normalizedSacks = Math.min(100, (sacks / stats.gamesPlayed) * 20);

    return Math.round(
      (normalizedPoints * 0.3) +
      (normalizedYards * 0.25) +
      (normalizedThirdDown * 0.2) +
      (normalizedRedZone * 0.15) +
      (normalizedTakeaways * 0.05) +
      (normalizedSacks * 0.05)
    );
  }

  private calculateInjuryImpact(injuries: PlayerInjury[]): number {
    if (injuries.length === 0) return 100;

    let totalImpact = 0;
    let totalWeight = 0;

    for (const injury of injuries) {
      let weight = 1;
      let impact = 100;

      // Weight by position importance
      if (['QB', 'RB', 'WR', 'TE'].includes(injury.position)) {
        weight = 3; // Offensive skill positions
      } else if (['DE', 'DT', 'LB', 'CB', 'S'].includes(injury.position)) {
        weight = 2; // Defensive positions
      } else {
        weight = 1; // Other positions
      }

      // Weight by injury status
      switch (injury.status) {
        case 'out':
          impact = 0;
          break;
        case 'doubtful':
          impact = 25;
          break;
        case 'questionable':
          impact = 50;
          break;
        case 'injured-reserve':
          impact = 0;
          break;
        case 'pup':
          impact = 0;
          break;
        default:
          impact = 100;
      }

      totalImpact += impact * weight;
      totalWeight += weight;
    }

    return Math.round(totalWeight > 0 ? totalImpact / totalWeight : 100);
  }

  private calculateWeatherImpact(weather: GameWeather, isHomeTeam: boolean): number {
    return this.weatherAPI.getWeatherImpact(weather);
  }

  private calculateScheduleStrength(stats: TeamStats | undefined): number {
    if (!stats) return 50;

    // This is a simplified calculation - in a real system you'd analyze opponent strength
    // For now, we'll use the team's performance as a proxy
    return this.calculateTeamStrength(stats);
  }

  private calculateRestAdvantage(stats: TeamStats | undefined): number {
    if (!stats) return 0;

    // This would require additional data about when teams last played
    // For now, return 0 (no advantage)
    return 0;
  }

  private calculateMomentum(stats: TeamStats | undefined): number {
    if (!stats || stats.gamesPlayed < 3) return 50;

    // Calculate recent performance trend
    // This is simplified - in reality you'd need recent game-by-game data
    const winPercentage = stats.wins / stats.gamesPlayed;
    
    if (winPercentage >= 0.75) return 90;
    if (winPercentage >= 0.6) return 75;
    if (winPercentage >= 0.4) return 50;
    if (winPercentage >= 0.25) return 25;
    return 10;
  }

  private calculateOverallMetrics(
    awayMetrics: PredictionMetrics,
    homeMetrics: PredictionMetrics
  ): PredictionMetrics {
    return {
      teamStrength: Math.round((awayMetrics.teamStrength + homeMetrics.teamStrength) / 2),
      offensivePower: Math.round((awayMetrics.offensivePower + homeMetrics.offensivePower) / 2),
      defensivePower: Math.round((awayMetrics.defensivePower + homeMetrics.defensivePower) / 2),
      injuryImpact: Math.round((awayMetrics.injuryImpact + homeMetrics.injuryImpact) / 2),
      weatherImpact: Math.round((awayMetrics.weatherImpact + homeMetrics.weatherImpact) / 2),
      scheduleStrength: Math.round((awayMetrics.scheduleStrength + homeMetrics.scheduleStrength) / 2),
      homeFieldAdvantage: homeMetrics.homeFieldAdvantage,
      restAdvantage: Math.round((awayMetrics.restAdvantage + homeMetrics.restAdvantage) / 2),
      momentum: Math.round((awayMetrics.momentum + homeMetrics.momentum) / 2),
      overall: Math.round((awayMetrics.overall + homeMetrics.overall) / 2),
    };
  }

  private calculateWinProbabilities(
    awayMetrics: PredictionMetrics,
    homeMetrics: PredictionMetrics,
    overallMetrics: PredictionMetrics
  ): { awayWinProbability: number; homeWinProbability: number } {
    // Start with base probabilities based on overall team strength
    let awayBase = awayMetrics.overall;
    let homeBase = homeMetrics.overall;

    // Apply home field advantage
    homeBase += homeMetrics.homeFieldAdvantage;

    // Apply rest advantage
    awayBase += awayMetrics.restAdvantage;
    homeBase += homeMetrics.restAdvantage;

    // Apply momentum
    awayBase += (awayMetrics.momentum - 50) * 0.1;
    homeBase += (homeMetrics.momentum - 50) * 0.1;

    // Normalize to ensure probabilities sum to 100
    const total = awayBase + homeBase;
    const awayWinProbability = Math.round((awayBase / total) * 100);
    const homeWinProbability = 100 - awayWinProbability;

    return { awayWinProbability, homeWinProbability };
  }

  private determineConfidence(awayProbability: number, homeProbability: number): 'high' | 'medium' | 'low' {
    const probabilityDiff = Math.abs(awayProbability - homeProbability);
    
    if (probabilityDiff >= 25) return 'high';
    if (probabilityDiff >= 15) return 'medium';
    return 'low';
  }

  private determineRecommendation(
    awayProbability: number,
    homeProbability: number,
    confidence: 'high' | 'medium' | 'low'
  ): 'away' | 'home' | 'none' {
    if (confidence === 'low') return 'none';
    
    if (awayProbability > homeProbability) return 'away';
    if (homeProbability > awayProbability) return 'home';
    return 'none';
  }

  private generateFactors(
    awayMetrics: PredictionMetrics,
    homeMetrics: PredictionMetrics,
    weather: GameWeather | null,
    awayTeam: NFLTeam,
    homeTeam: NFLTeam
  ): string[] {
    const factors: string[] = [];

    // Team strength factors
    if (awayMetrics.teamStrength > homeMetrics.teamStrength + 10) {
      factors.push(`${awayTeam.name} has significantly stronger overall team performance`);
    } else if (homeMetrics.teamStrength > awayMetrics.teamStrength + 10) {
      factors.push(`${homeTeam.name} has significantly stronger overall team performance`);
    }

    // Offensive factors
    if (awayMetrics.offensivePower > homeMetrics.offensivePower + 15) {
      factors.push(`${awayTeam.name} has superior offensive firepower`);
    } else if (homeMetrics.offensivePower > awayMetrics.offensivePower + 15) {
      factors.push(`${homeTeam.name} has superior offensive firepower`);
    }

    // Defensive factors
    if (awayMetrics.defensivePower > homeMetrics.defensivePower + 15) {
      factors.push(`${awayTeam.name} has stronger defensive unit`);
    } else if (homeMetrics.defensivePower > awayMetrics.defensivePower + 15) {
      factors.push(`${homeTeam.name} has stronger defensive unit`);
    }

    // Injury factors
    if (awayMetrics.injuryImpact < homeMetrics.injuryImpact - 20) {
      factors.push(`${awayTeam.name} dealing with significant injuries`);
    } else if (homeMetrics.injuryImpact < awayMetrics.injuryImpact - 20) {
      factors.push(`${homeTeam.name} dealing with significant injuries`);
    }

    // Weather factors
    if (weather) {
      if (weather.conditions === 'Rain' || weather.conditions === 'Snow') {
        factors.push(`Weather conditions may favor ${homeMetrics.weatherImpact > awayMetrics.weatherImpact ? homeTeam.name : awayTeam.name}`);
      }
      if (weather.windSpeed > 20) {
        factors.push('High winds may impact passing game');
      }
    }

    // Home field advantage
    if (homeMetrics.homeFieldAdvantage > 0) {
      factors.push(`${homeTeam.name} benefits from home field advantage`);
    }

    // Momentum factors
    if (awayMetrics.momentum > homeMetrics.momentum + 20) {
      factors.push(`${awayTeam.name} has strong momentum coming into this game`);
    } else if (homeMetrics.momentum > awayMetrics.momentum + 20) {
      factors.push(`${homeTeam.name} has strong momentum coming into this game`);
    }

    return factors;
  }
}