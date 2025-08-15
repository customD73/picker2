import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { GamePredictions } from './GamePredictions';
import { MetricConfiguration } from './MetricConfiguration';
import { SuicidePoolTracker } from './SuicidePoolTracker';
import { WeekSelector } from './WeekSelector';
import { LogOut, Settings, Trophy, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  user: any;
  supabase: any;
}

export function Dashboard({ user, supabase }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [seasonType, setSeasonType] = useState(2); // 1=preseason, 2=regular, 3=postseason
  const [userSettings, setUserSettings] = useState(null);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const tabs = [
    { id: 'predictions', label: 'Game Predictions', icon: BarChart3 },
    { id: 'suicide-pool', label: 'Suicide Pool', icon: Trophy },
    { id: 'settings', label: 'Metric Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                🏈 NFL Win Predictor
              </h1>
              <Badge variant="secondary" className="text-sm">
                Week {selectedWeek} • {selectedYear}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-slate-600 text-base">
                Welcome, {user.user_metadata?.name || user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="text-base"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 text-base transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <WeekSelector
            selectedWeek={selectedWeek}
            selectedYear={selectedYear}
            seasonType={seasonType}
            onWeekChange={setSelectedWeek}
            onYearChange={setSelectedYear}
            onSeasonTypeChange={setSeasonType}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'predictions' && (
          <GamePredictions
            week={selectedWeek}
            year={selectedYear}
            seasonType={seasonType}
            user={user}
            supabase={supabase}
          />
        )}
        
        {activeTab === 'suicide-pool' && (
          <SuicidePoolTracker
            week={selectedWeek}
            year={selectedYear}
            user={user}
            supabase={supabase}
          />
        )}
        
        {activeTab === 'settings' && (
          <MetricConfiguration
            user={user}
            supabase={supabase}
            onSettingsUpdate={setUserSettings}
          />
        )}
      </main>
    </div>
  );
}