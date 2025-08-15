import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { GamePrediction } from '../constants/mockData';
import { getConfidenceBadgeVariant, formatGameDate } from '../utils/gameUtils';

interface GameDetailsModalProps {
  game: GamePrediction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GameDetailsModal({ game, isOpen, onClose }: GameDetailsModalProps) {
  if (!game) return null;

  const TeamMetricsCard = ({ 
    teamName, 
    teamAbbr, 
    teamLogo, 
    metrics, 
    winProbability 
  }: {
    teamName: string;
    teamAbbr: string;
    teamLogo: string;
    metrics: {
      teamStrength: number;
      injuries: number;
      weather: number;
      schedule: number;
      overall: number;
    };
    winProbability: number;
  }) => (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Team Header */}
      <div className="text-center">
        <div className="text-3xl mb-2">{teamLogo}</div>
        <div className="font-medium text-lg text-slate-900 mb-1">
          {teamName}
        </div>
        <div className="text-sm text-slate-500 mb-3">
          {teamAbbr}
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">
          {winProbability}%
        </div>
        <div className="text-sm text-slate-500">Win Probability</div>
      </div>

      {/* Team Metrics */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h5 className="font-medium text-base text-slate-900 mb-3">
          Team Metrics
        </h5>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Team Strength</span>
            <span className="font-bold">{metrics.teamStrength}/100</span>
          </div>
          <Progress value={metrics.teamStrength} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Injury Impact</span>
            <span className="font-bold">{metrics.injuries}/100</span>
          </div>
          <Progress value={metrics.injuries} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Weather Factor</span>
            <span className="font-bold">{metrics.weather}/100</span>
          </div>
          <Progress value={metrics.weather} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Schedule Strength</span>
            <span className="font-bold">{metrics.schedule}/100</span>
          </div>
          <Progress value={metrics.schedule} className="h-2" />
        </div>
        
        <div className="pt-3 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-base">Overall Score</span>
            <span className="text-xl font-bold text-slate-900">
              {metrics.overall}/100
            </span>
          </div>
          <Progress value={metrics.overall} className="h-3 mt-2" />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="game-details-description">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">
              Game Details
            </DialogTitle>
            <DialogDescription id="game-details-description" className="text-sm text-slate-500 mt-1">
              Detailed prediction metrics and analysis for {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
            </DialogDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Header */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600">
              {formatGameDate(game.gameDate)} • {game.gameTime}
            </div>
            <Badge 
              variant={getConfidenceBadgeVariant(game.predictions.confidence)}
              className="text-sm"
            >
              {game.predictions.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>

          {/* Prediction Summary */}
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-xl font-medium text-slate-900 mb-2">
              {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
            </div>
            {game.predictions.recommendation !== 'none' && (
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="text-center">
                  <div className="font-medium text-green-600 text-base">
                    RECOMMENDED: {game.predictions.recommendation === 'away' ? game.awayTeam.abbreviation : game.homeTeam.abbreviation}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Team-Specific Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Away Team Metrics */}
            <TeamMetricsCard
              teamName={game.awayTeam.name}
              teamAbbr={game.awayTeam.abbreviation}
              teamLogo={game.awayTeam.logo}
              metrics={game.metrics.awayTeam}
              winProbability={game.predictions.awayWinProbability}
            />

            {/* Home Team Metrics */}
            <TeamMetricsCard
              teamName={game.homeTeam.name}
              teamAbbr={game.homeTeam.abbreviation}
              teamLogo={game.homeTeam.logo}
              metrics={game.metrics.homeTeam}
              winProbability={game.predictions.homeWinProbability}
            />
          </div>

          {/* Overall Game Metrics Summary */}
          <div className="space-y-4 bg-slate-50 rounded-lg p-6">
            <h4 className="font-medium text-lg text-slate-900 mb-4">
              Game-Wide Factors
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-base mb-2">
                  <span className="font-medium">Weather Impact</span>
                  <span className="font-bold">{game.metrics.weather}/100</span>
                </div>
                <Progress value={game.metrics.weather} className="h-3" />
                <div className="text-sm text-slate-500 mt-1">
                  Affects both teams equally
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-base mb-2">
                  <span className="font-medium">Overall Matchup</span>
                  <span className="font-bold">{game.metrics.overall}/100</span>
                </div>
                <Progress value={game.metrics.overall} className="h-3" />
                <div className="text-sm text-slate-500 mt-1">
                  Composite prediction score
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}