import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Target, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PoolStatsCards } from './PoolStatsCards';
import { TeamRecommendationCard } from './TeamRecommendationCard';
import { 
  mockRecommendations, 
  mockPicks, 
  PoolPick, 
  TeamRecommendation 
} from '../constants/mockData';

interface SuicidePoolTrackerProps {
  week: number;
  year: number;
  user: any;
  supabase: any;
}

export function SuicidePoolTracker({ week, year, user, supabase }: SuicidePoolTrackerProps) {
  const [picks, setPicks] = useState<PoolPick[]>([]);
  const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([]);
  const [selectedPick, setSelectedPick] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);

  useEffect(() => {
    loadPoolData();
  }, [week, year]);

  const loadPoolData = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from your server
      setTimeout(() => {
        setPicks(mockPicks);
        setRecommendations(mockRecommendations);
        setIsEliminated(false);
        setLoading(false);
      }, 800);
    } catch (error) {
      toast.error('Failed to load suicide pool data');
      setLoading(false);
    }
  };

  const submitPick = async () => {
    if (!selectedPick) {
      toast.error('Please select a team');
      return;
    }

    setLoading(true);
    try {
      const selectedRecommendation = recommendations.find(r => r.team === selectedPick);
      if (!selectedRecommendation) return;

      const newPick: PoolPick = {
        id: Date.now().toString(),
        week,
        team: selectedPick,
        teamName: selectedRecommendation.teamName,
        confidence: selectedRecommendation.winProbability,
        result: 'pending',
        gameDate: new Date().toISOString().split('T')[0]
      };

      setPicks(prev => [...prev, newPick]);
      setSelectedPick('');
      toast.success(`Pick submitted: ${selectedRecommendation.teamName}`);
    } catch (error) {
      toast.error('Failed to submit pick');
    }
    setLoading(false);
  };

  const getUsedTeams = () => picks.map(pick => pick.team);
  const getCurrentWeekPick = () => picks.find(pick => pick.week === week);
  const getRecord = () => {
    const wins = picks.filter(pick => pick.result === 'win').length;
    const losses = picks.filter(pick => pick.result === 'loss').length;
    return { wins, losses, total: picks.length };
  };

  const record = getRecord();
  const currentPick = getCurrentWeekPick();
  const usedTeams = getUsedTeams();
  const availableRecommendations = recommendations.filter(r => !usedTeams.includes(r.team));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
        <span className="text-base">Loading suicide pool data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <PoolStatsCards 
        wins={record.wins}
        currentWeek={week}
        teamsAvailable={32 - usedTeams.length}
        isEliminated={isEliminated}
      />

      {/* Current Week Pick */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Week {week} Pick
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPick ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="font-medium text-base text-slate-900">
                  {currentPick.teamName}
                </div>
                <div className="text-sm text-slate-500">
                  Confidence: {currentPick.confidence}% • {currentPick.result || 'Pending'}
                </div>
              </div>
              <Badge variant={currentPick.result === 'win' ? 'default' : currentPick.result === 'loss' ? 'destructive' : 'secondary'}>
                {currentPick.result || 'PENDING'}
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-base">
                  You haven't made a pick for Week {week} yet. Choose carefully!
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-4">
                <Select value={selectedPick} onValueChange={setSelectedPick}>
                  <SelectTrigger className="flex-1 text-base h-12">
                    <SelectValue placeholder="Select a team for this week..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRecommendations.map((rec) => (
                      <SelectItem key={rec.team} value={rec.team}>
                        {rec.teamName} ({rec.winProbability}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={submitPick}
                  disabled={!selectedPick || loading}
                  className="text-base px-8"
                >
                  Submit Pick
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Week {week} Recommendations</CardTitle>
          <p className="text-sm text-slate-500">
            Based on your metric preferences and future week considerations
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableRecommendations.map((rec, index) => (
              <TeamRecommendationCard
                key={rec.team}
                recommendation={rec}
                index={index}
                selectedPick={selectedPick}
                onSelect={setSelectedPick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pick History */}
      <Card>
        <CardHeader>
          <CardTitle>Pick History</CardTitle>
        </CardHeader>
        <CardContent>
          {picks.length === 0 ? (
            <p className="text-base text-slate-500 text-center py-6">
              No picks made yet this season.
            </p>
          ) : (
            <div className="space-y-3">
              {picks.map((pick) => (
                <div 
                  key={pick.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-slate-900">
                        Week {pick.week}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-base text-slate-900">
                        {pick.teamName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(pick.gameDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm text-slate-500">
                        {pick.confidence}% confidence
                      </div>
                    </div>
                    
                    <Badge 
                      variant={
                        pick.result === 'win' ? 'default' :
                        pick.result === 'loss' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {pick.result === 'win' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {pick.result === 'loss' && <XCircle className="w-3 h-3 mr-1" />}
                      {pick.result?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}