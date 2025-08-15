import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GamePrediction } from '../constants/mockData';
import { getConfidenceBadgeVariant, formatGameDate } from '../utils/gameUtils';

interface GamePredictionsTableProps {
  games: GamePrediction[];
  onGameSelect?: (game: GamePrediction) => void;
}

export function GamePredictionsTable({ games, onGameSelect }: GamePredictionsTableProps) {
  const getRecommendationIcon = (recommendation: string, confidence: string) => {
    if (recommendation === 'none') return null;
    
    const iconClass = confidence === 'high' ? 'text-green-600' : 
                     confidence === 'medium' ? 'text-yellow-600' : 
                     'text-orange-600';
    
    return recommendation === 'away' ? 
      <TrendingUp className={`w-4 h-4 ${iconClass}`} /> :
      <TrendingDown className={`w-4 h-4 ${iconClass}`} />;
  };

  const formatTime = (gameTime: string) => {
    // Extract time part and convert to simpler format
    return gameTime.replace(' EST', '').replace(' PST', '').replace(' CST', '').replace(' MST', '');
  };

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="text-base font-medium w-32">Date/Time</TableHead>
            <TableHead className="text-base font-medium w-48">Away Team</TableHead>
            <TableHead className="text-base font-medium text-center w-20">@</TableHead>
            <TableHead className="text-base font-medium w-48">Home Team</TableHead>
            <TableHead className="text-base font-medium text-center w-24">Prediction</TableHead>
            <TableHead className="text-base font-medium text-center w-32">Confidence</TableHead>
            <TableHead className="text-base font-medium text-center w-28">Overall</TableHead>
            <TableHead className="text-base font-medium text-center w-20">Rec.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow 
              key={game.id}
              className="hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onGameSelect?.(game)}
            >
              {/* Date/Time */}
              <TableCell className="py-4">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">
                    {formatGameDate(game.gameDate).split(',')[1]?.trim() || formatGameDate(game.gameDate)}
                  </div>
                  <div className="text-slate-500">
                    {formatTime(game.gameTime)}
                  </div>
                </div>
              </TableCell>

              {/* Away Team */}
              <TableCell className="py-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{game.awayTeam.logo}</span>
                  <div>
                    <div className="font-medium text-base text-slate-900">
                      {game.awayTeam.abbreviation}
                    </div>
                    <div className="text-sm text-slate-500 truncate max-w-32">
                      {game.awayTeam.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {game.predictions.awayWinProbability}%
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* VS */}
              <TableCell className="text-center py-4">
                <span className="text-slate-400 font-medium">@</span>
              </TableCell>

              {/* Home Team */}
              <TableCell className="py-4">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {game.predictions.homeWinProbability}%
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-base text-slate-900">
                      {game.homeTeam.abbreviation}
                    </div>
                    <div className="text-sm text-slate-500 truncate max-w-32">
                      {game.homeTeam.name}
                    </div>
                  </div>
                  <span className="text-2xl">{game.homeTeam.logo}</span>
                </div>
              </TableCell>

              {/* Prediction Winner */}
              <TableCell className="text-center py-4">
                <div className="font-bold text-lg text-slate-900">
                  {game.predictions.awayWinProbability > game.predictions.homeWinProbability 
                    ? game.awayTeam.abbreviation 
                    : game.homeTeam.abbreviation}
                </div>
                <div className="text-sm text-slate-500">
                  {Math.max(game.predictions.awayWinProbability, game.predictions.homeWinProbability)}%
                </div>
              </TableCell>

              {/* Confidence */}
              <TableCell className="text-center py-4">
                <Badge 
                  variant={getConfidenceBadgeVariant(game.predictions.confidence)}
                  className="text-sm"
                >
                  {game.predictions.confidence.toUpperCase()}
                </Badge>
              </TableCell>

              {/* Overall Score */}
              <TableCell className="text-center py-4">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-slate-900">
                    {game.metrics.overall}
                  </div>
                  <Progress value={game.metrics.overall} className="h-2 w-20" />
                </div>
              </TableCell>

              {/* Recommendation */}
              <TableCell className="text-center py-4">
                <div className="flex items-center justify-center">
                  {getRecommendationIcon(game.predictions.recommendation, game.predictions.confidence)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}