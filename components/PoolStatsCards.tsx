import { Card, CardContent } from './ui/card';
import { Trophy, Target, CheckCircle, XCircle } from 'lucide-react';

interface PoolStatsCardsProps {
  wins: number;
  currentWeek: number;
  teamsAvailable: number;
  isEliminated: boolean;
}

export function PoolStatsCards({ wins, currentWeek, teamsAvailable, isEliminated }: PoolStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold text-slate-900">{wins}</div>
          <div className="text-sm text-slate-500">Wins</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold text-slate-900">{currentWeek}</div>
          <div className="text-sm text-slate-500">Current Week</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold text-slate-900">{teamsAvailable}</div>
          <div className="text-sm text-slate-500">Teams Available</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 text-center">
          {isEliminated ? (
            <>
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-lg font-bold text-red-600">Eliminated</div>
            </>
          ) : (
            <>
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-bold text-green-600">Active</div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}