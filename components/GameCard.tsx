import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp } from 'lucide-react';
import { GamePrediction } from '../constants/mockData';
import { getConfidenceBadgeVariant, formatGameDate } from '../utils/gameUtils';

interface GameCardProps {
  game: GamePrediction;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {formatGameDate(game.gameDate)} • {game.gameTime}
          </div>
          <Badge 
            variant={getConfidenceBadgeVariant(game.predictions.confidence)}
            className="text-sm"
          >
            {game.predictions.confidence.toUpperCase()} CONFIDENCE
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Team Matchup */}
        <div className="grid grid-cols-3 gap-6 items-center mb-6">
          {/* Away Team */}
          <div className="text-center">
            <div className="text-3xl mb-2">{game.awayTeam.logo}</div>
            <div className="font-medium text-base text-slate-900">
              {game.awayTeam.name}
            </div>
            <div className="text-sm text-slate-500">
              {game.awayTeam.abbreviation}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {game.predictions.awayWinProbability}%
              </div>
              <div className="text-sm text-slate-500">Win Probability</div>
            </div>
          </div>

          {/* VS and Recommendation */}
          <div className="text-center">
            <div className="text-lg font-medium text-slate-400 mb-4">VS</div>
            {game.predictions.recommendation !== 'none' && (
              <div className="flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-base font-medium text-green-600">
                  Recommended: {game.predictions.recommendation === 'away' ? game.awayTeam.abbreviation : game.homeTeam.abbreviation}
                </span>
              </div>
            )}
          </div>

          {/* Home Team */}
          <div className="text-center">
            <div className="text-3xl mb-2">{game.homeTeam.logo}</div>
            <div className="font-medium text-base text-slate-900">
              {game.homeTeam.name}
            </div>
            <div className="text-sm text-slate-500">
              {game.homeTeam.abbreviation}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {game.predictions.homeWinProbability}%
              </div>
              <div className="text-sm text-slate-500">Win Probability</div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3 bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-base text-slate-900 mb-3">
            Prediction Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Strength</span>
                <span className="font-medium">{game.metrics.teamStrength}/100</span>
              </div>
              <Progress value={game.metrics.teamStrength} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Injury Impact</span>
                <span className="font-medium">{game.metrics.injuries}/100</span>
              </div>
              <Progress value={game.metrics.injuries} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Weather Factor</span>
                <span className="font-medium">{game.metrics.weather}/100</span>
              </div>
              <Progress value={game.metrics.weather} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Schedule Strength</span>
                <span className="font-medium">{game.metrics.schedule}/100</span>
              </div>
              <Progress value={game.metrics.schedule} className="h-2" />
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-base">Overall Score</span>
              <span className="text-xl font-bold text-slate-900">
                {game.metrics.overall}/100
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}