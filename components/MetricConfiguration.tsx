import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Save, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { defaultMetrics, MetricWeight } from '../constants/mockData';
import { getCategoryColor } from '../utils/gameUtils';

interface MetricConfigurationProps {
  user: any;
  supabase: any;
  onSettingsUpdate: (settings: any) => void;
}

export function MetricConfiguration({ user, supabase, onSettingsUpdate }: MetricConfigurationProps) {
  const [metrics, setMetrics] = useState<MetricWeight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c6567478/user-settings`, {
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then((s: any) => s.data.session?.access_token)}`
        }
      });

      if (response.ok) {
        const settings = await response.json();
        if (settings.metricWeights) {
          const updatedMetrics = defaultMetrics.map(metric => ({
            ...metric,
            weight: settings.metricWeights[metric.id] ?? metric.defaultWeight
          }));
          setMetrics(updatedMetrics);
        } else {
          setMetrics(defaultMetrics);
        }
      } else {
        setMetrics(defaultMetrics);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setMetrics(defaultMetrics);
    }
    setLoading(false);
  };

  const handleWeightChange = (metricId: string, newWeight: number[]) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === metricId 
        ? { ...metric, weight: newWeight[0] }
        : metric
    ));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setMetrics(defaultMetrics.map(metric => ({ ...metric, weight: metric.defaultWeight })));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const metricWeights = metrics.reduce((acc, metric) => {
        acc[metric.id] = metric.weight;
        return acc;
      }, {} as Record<string, number>);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c6567478/user-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then((s: any) => s.data.session?.access_token)}`
        },
        body: JSON.stringify({ metricWeights })
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        setHasChanges(false);
        onSettingsUpdate({ metricWeights });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
    setLoading(false);
  };

  const getTotalWeight = () => {
    return metrics.reduce((sum, metric) => sum + metric.weight, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Metric Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Adjust the importance of different factors in game predictions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-slate-500">Total Weight</div>
            <div className={`text-lg font-medium ${getTotalWeight() === 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {getTotalWeight()}%
            </div>
          </div>
          
          <Button 
            onClick={resetToDefaults}
            variant="outline"
            className="text-base"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            onClick={saveSettings}
            disabled={!hasChanges || loading}
            className="text-base"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Weight Total Warning */}
      {getTotalWeight() !== 100 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center p-4">
            <Info className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0" />
            <p className="text-base text-orange-800">
              Total weight should equal 100% for optimal predictions. Current total: {getTotalWeight()}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metrics Configuration */}
      <div className="grid gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <CardTitle className="text-lg">{metric.name}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getCategoryColor(metric.category)}`}
                    >
                      {metric.category.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {metric.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-slate-900">
                    {metric.weight}%
                  </div>
                  {metric.weight !== metric.defaultWeight && (
                    <div className="text-xs text-slate-500">
                      Default: {metric.defaultWeight}%
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Slider
                  value={[metric.weight]}
                  onValueChange={(value) => handleWeightChange(metric.id, value)}
                  max={50}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Configuration Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Team Metrics:</strong> Focus on overall team performance and capabilities
          </div>
          <div>
            <strong>Player Metrics:</strong> Account for individual player impacts like injuries
          </div>
          <div>
            <strong>External Metrics:</strong> Consider outside factors like weather and schedule
          </div>
          <div className="pt-2 border-t border-slate-200">
            <strong>Recommendation:</strong> Keep total weights at 100% and adjust based on your analysis preferences. Higher weights mean more influence on predictions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}