export interface GamePrediction {
  id: string;
  awayTeam: {
    name: string;
    abbreviation: string;
    logo: string;
  };
  homeTeam: {
    name: string;
    abbreviation: string;
    logo: string;
  };
  gameDate: string;
  gameTime: string;
  predictions: {
    awayWinProbability: number;
    homeWinProbability: number;
    confidence: 'high' | 'medium' | 'low';
    recommendation: 'away' | 'home' | 'none';
  };
  metrics: {
    teamStrength: number;
    injuries: number;
    weather: number;
    schedule: number;
    overall: number;
    // Team-specific metrics
    awayTeam: {
      teamStrength: number;
      injuries: number;
      weather: number;
      schedule: number;
      overall: number;
    };
    homeTeam: {
      teamStrength: number;
      injuries: number;
      weather: number;
      schedule: number;
      overall: number;
    };
  };
}

export interface PoolPick {
  id: string;
  week: number;
  team: string;
  teamName: string;
  confidence: number;
  result: 'pending' | 'win' | 'loss' | null;
  gameDate: string;
}

export interface TeamRecommendation {
  team: string;
  teamName: string;
  opponent: string;
  winProbability: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  futureValue: number;
}

export interface MetricWeight {
  id: string;
  name: string;
  description: string;
  weight: number;
  defaultWeight: number;
  category: 'team' | 'player' | 'external';
}

export const mockGames: GamePrediction[] = [
  {
    id: '1',
    awayTeam: {
      name: 'Kansas City Chiefs',
      abbreviation: 'KC',
      logo: '🏆'
    },
    homeTeam: {
      name: 'Buffalo Bills',
      abbreviation: 'BUF',
      logo: '🦬'
    },
    gameDate: '2025-01-12',
    gameTime: '4:30 PM EST',
    predictions: {
      awayWinProbability: 62,
      homeWinProbability: 38,
      confidence: 'high',
      recommendation: 'away'
    },
    metrics: {
      teamStrength: 85,
      injuries: 72,
      weather: 45,
      schedule: 78,
      overall: 76,
      awayTeam: {
        teamStrength: 92,
        injuries: 85,
        weather: 45,
        schedule: 88,
        overall: 82
      },
      homeTeam: {
        teamStrength: 78,
        injuries: 58,
        weather: 45,
        schedule: 68,
        overall: 70
      }
    }
  },
  {
    id: '2',
    awayTeam: {
      name: 'Philadelphia Eagles',
      abbreviation: 'PHI',
      logo: '🦅'
    },
    homeTeam: {
      name: 'Green Bay Packers',
      abbreviation: 'GB',
      logo: '🟢'
    },
    gameDate: '2025-01-12',
    gameTime: '8:15 PM EST',
    predictions: {
      awayWinProbability: 54,
      homeWinProbability: 46,
      confidence: 'medium',
      recommendation: 'away'
    },
    metrics: {
      teamStrength: 78,
      injuries: 85,
      weather: 35,
      schedule: 62,
      overall: 68,
      awayTeam: {
        teamStrength: 85,
        injuries: 90,
        weather: 35,
        schedule: 72,
        overall: 75
      },
      homeTeam: {
        teamStrength: 71,
        injuries: 80,
        weather: 35,
        schedule: 52,
        overall: 61
      }
    }
  },
  {
    id: '3',
    awayTeam: {
      name: 'Detroit Lions',
      abbreviation: 'DET',
      logo: '🦁'
    },
    homeTeam: {
      name: 'San Francisco 49ers',
      abbreviation: 'SF',
      logo: '⭐'
    },
    gameDate: '2025-01-13',
    gameTime: '1:00 PM EST',
    predictions: {
      awayWinProbability: 48,
      homeWinProbability: 52,
      confidence: 'medium',
      recommendation: 'home'
    },
    metrics: {
      teamStrength: 82,
      injuries: 68,
      weather: 90,
      schedule: 71,
      overall: 75,
      awayTeam: {
        teamStrength: 84,
        injuries: 62,
        weather: 90,
        schedule: 75,
        overall: 73
      },
      homeTeam: {
        teamStrength: 80,
        injuries: 74,
        weather: 90,
        schedule: 67,
        overall: 77
      }
    }
  },
  {
    id: '4',
    awayTeam: {
      name: 'Baltimore Ravens',
      abbreviation: 'BAL',
      logo: '🐦‍⬛'
    },
    homeTeam: {
      name: 'Pittsburgh Steelers',
      abbreviation: 'PIT',
      logo: '⚫'
    },
    gameDate: '2025-01-13',
    gameTime: '4:30 PM EST',
    predictions: {
      awayWinProbability: 58,
      homeWinProbability: 42,
      confidence: 'high',
      recommendation: 'away'
    },
    metrics: {
      teamStrength: 88,
      injuries: 80,
      weather: 55,
      schedule: 77,
      overall: 79,
      awayTeam: {
        teamStrength: 95,
        injuries: 88,
        weather: 55,
        schedule: 85,
        overall: 84
      },
      homeTeam: {
        teamStrength: 81,
        injuries: 72,
        weather: 55,
        schedule: 69,
        overall: 74
      }
    }
  },
  {
    id: '5',
    awayTeam: {
      name: 'Tampa Bay Buccaneers',
      abbreviation: 'TB',
      logo: '🏴‍☠️'
    },
    homeTeam: {
      name: 'Washington Commanders',
      abbreviation: 'WAS',
      logo: '🔴'
    },
    gameDate: '2025-01-13',
    gameTime: '8:15 PM EST',
    predictions: {
      awayWinProbability: 44,
      homeWinProbability: 56,
      confidence: 'low',
      recommendation: 'home'
    },
    metrics: {
      teamStrength: 74,
      injuries: 85,
      weather: 78,
      schedule: 63,
      overall: 72,
      awayTeam: {
        teamStrength: 69,
        injuries: 82,
        weather: 78,
        schedule: 58,
        overall: 68
      },
      homeTeam: {
        teamStrength: 79,
        injuries: 88,
        weather: 78,
        schedule: 68,
        overall: 76
      }
    }
  },
  {
    id: '6',
    awayTeam: {
      name: 'Los Angeles Rams',
      abbreviation: 'LAR',
      logo: '🐏'
    },
    homeTeam: {
      name: 'Minnesota Vikings',
      abbreviation: 'MIN',
      logo: '⚔️'
    },
    gameDate: '2025-01-14',
    gameTime: '7:15 PM EST',
    predictions: {
      awayWinProbability: 41,
      homeWinProbability: 59,
      confidence: 'medium',
      recommendation: 'home'
    },
    metrics: {
      teamStrength: 76,
      injuries: 72,
      weather: 25,
      schedule: 69,
      overall: 68,
      awayTeam: {
        teamStrength: 71,
        injuries: 65,
        weather: 25,
        schedule: 64,
        overall: 63
      },
      homeTeam: {
        teamStrength: 81,
        injuries: 79,
        weather: 25,
        schedule: 74,
        overall: 73
      }
    }
  },
  {
    id: '7',
    awayTeam: {
      name: 'Houston Texans',
      abbreviation: 'HOU',
      logo: '🐂'
    },
    homeTeam: {
      name: 'Los Angeles Chargers',
      abbreviation: 'LAC',
      logo: '⚡'
    },
    gameDate: '2025-01-14',
    gameTime: '1:00 PM EST',
    predictions: {
      awayWinProbability: 53,
      homeWinProbability: 47,
      confidence: 'medium',
      recommendation: 'away'
    },
    metrics: {
      teamStrength: 80,
      injuries: 75,
      weather: 95,
      schedule: 66,
      overall: 73,
      awayTeam: {
        teamStrength: 83,
        injuries: 78,
        weather: 95,
        schedule: 71,
        overall: 75
      },
      homeTeam: {
        teamStrength: 77,
        injuries: 72,
        weather: 95,
        schedule: 61,
        overall: 71
      }
    }
  },
  {
    id: '8',
    awayTeam: {
      name: 'Denver Broncos',
      abbreviation: 'DEN',
      logo: '🐎'
    },
    homeTeam: {
      name: 'Cincinnati Bengals',
      abbreviation: 'CIN',
      logo: '🐅'
    },
    gameDate: '2025-01-14',
    gameTime: '4:30 PM EST',
    predictions: {
      awayWinProbability: 39,
      homeWinProbability: 61,
      confidence: 'high',
      recommendation: 'home'
    },
    metrics: {
      teamStrength: 71,
      injuries: 88,
      weather: 60,
      schedule: 74,
      overall: 77,
      awayTeam: {
        teamStrength: 64,
        injuries: 85,
        weather: 60,
        schedule: 69,
        overall: 71
      },
      homeTeam: {
        teamStrength: 78,
        injuries: 91,
        weather: 60,
        schedule: 79,
        overall: 83
      }
    }
  }
];

export const mockRecommendations: TeamRecommendation[] = [
  {
    team: 'KC',
    teamName: 'Kansas City Chiefs',
    opponent: 'vs Buffalo Bills',
    winProbability: 62,
    confidence: 'high',
    reasoning: [
      'Strong offensive performance this season',
      'Home field advantage',
      'Opponent dealing with key injuries'
    ],
    futureValue: 85
  },
  {
    team: 'SF',
    teamName: 'San Francisco 49ers',
    opponent: 'vs Seattle Seahawks',
    winProbability: 58,
    confidence: 'medium',
    reasoning: [
      'Solid defensive metrics',
      'Better recent form',
      'Favorable matchup history'
    ],
    futureValue: 75
  },
  {
    team: 'DAL',
    teamName: 'Dallas Cowboys',
    opponent: 'at Philadelphia Eagles',
    winProbability: 45,
    confidence: 'low',
    reasoning: [
      'Away game disadvantage',
      'Inconsistent recent performance',
      'Tough divisional matchup'
    ],
    futureValue: 60
  }
];

export const mockPicks: PoolPick[] = [
  {
    id: '1',
    week: 1,
    team: 'BUF',
    teamName: 'Buffalo Bills',
    confidence: 78,
    result: 'win',
    gameDate: '2024-09-08'
  },
  {
    id: '2',
    week: 2,
    team: 'MIA',
    teamName: 'Miami Dolphins',
    confidence: 65,
    result: 'win',
    gameDate: '2024-09-15'
  }
];

export const defaultMetrics: MetricWeight[] = [
  {
    id: 'team_strength',
    name: 'Team Strength',
    description: 'Overall team performance and statistics',
    weight: 25,
    defaultWeight: 25,
    category: 'team'
  },
  {
    id: 'offensive_power',
    name: 'Offensive Power',
    description: 'Scoring ability and offensive efficiency',
    weight: 20,
    defaultWeight: 20,
    category: 'team'
  },
  {
    id: 'defensive_power',
    name: 'Defensive Power',
    description: 'Defensive performance and stopping ability',
    weight: 20,
    defaultWeight: 20,
    category: 'team'
  },
  {
    id: 'injury_impact',
    name: 'Injury Impact',
    description: 'Effect of player injuries on team performance',
    weight: 15,
    defaultWeight: 15,
    category: 'player'
  },
  {
    id: 'weather_conditions',
    name: 'Weather Conditions',
    description: 'Impact of weather on game performance',
    weight: 10,
    defaultWeight: 10,
    category: 'external'
  },
  {
    id: 'schedule_strength',
    name: 'Schedule Strength',
    description: 'Difficulty of recent and upcoming opponents',
    weight: 10,
    defaultWeight: 10,
    category: 'team'
  }
];