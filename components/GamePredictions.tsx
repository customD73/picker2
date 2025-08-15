import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Grid3X3, List } from 'lucide-react';
import { toast } from 'sonner';
import { GamePredictionsTable } from './GamePredictionsTable';
import { GameDetailsModal } from './GameDetailsModal';
import { GameCard } from './GameCard';
import { mockGames, GamePrediction } from '../constants/mockData';

interface GamePredictionsProps {
  week: number;
  year: number;
  seasonType: number;
  user: any;
  supabase: any;
}

export function GamePredictions({ week, year, seasonType, user, supabase }: GamePredictionsProps) {
  const [games, setGames] = useState<GamePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedGame, setSelectedGame] = useState<GamePrediction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    loadGamePredictions();
  }, [week, year, seasonType]);

  const loadGamePredictions = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch from your server
      // Using mock data from the constants file
      setTimeout(() => {
        setGames(mockGames);
        setLastUpdated(new Date());
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to load game predictions');
      setLoading(false);
    }
  };

  const handleGameSelect = (game: GamePrediction) => {
    setSelectedGame(game);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedGame(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span className="text-base">Loading game predictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Game Predictions
          </h2>
          {lastUpdated && (
            <p className="text-sm text-slate-500 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
            >
              <List className="w-4 h-4 mr-1" />
              Cards
            </Button>
          </div>
          
          <Button 
            onClick={loadGamePredictions}
            variant="outline"
            className="text-base"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Games Display */}
      {games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-base text-slate-500">
              No games scheduled for this week.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <GamePredictionsTable 
          games={games} 
          onGameSelect={handleGameSelect}
        />
      ) : (
        <div className="grid gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Game Details Modal */}
      <GameDetailsModal
        game={selectedGame}
        isOpen={showDetailModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}