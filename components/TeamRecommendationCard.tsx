import { Badge } from './ui/badge';
import { TeamRecommendation } from '../constants/mockData';
import { getConfidenceColor } from '../utils/gameUtils';

interface TeamRecommendationCardProps {
  recommendation: TeamRecommendation;
  index: number;
  selectedPick: string;
  onSelect: (team: string) => void;
}

export function TeamRecommendationCard({ 
  recommendation, 
  index, 
  selectedPick, 
  onSelect 
}: TeamRecommendationCardProps) {
  return (
    <div 
      className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
        selectedPick === recommendation.team 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={() => onSelect(recommendation.team)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <h4 className="font-medium text-base text-slate-900">
              {recommendation.teamName}
            </h4>
            <Badge 
              variant="secondary"
              className={getConfidenceColor(recommendation.confidence)}
            >
              {recommendation.confidence.toUpperCase()}
            </Badge>
            {index === 0 && (
              <Badge variant="default">
                RECOMMENDED
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-2">{recommendation.opponent}</p>
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">
            {recommendation.winProbability}%
          </div>
          <div className="text-xs text-slate-500">
            Win Probability
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium text-slate-700">Reasoning:</span>
        </div>
        <ul className="text-sm text-slate-600 space-y-1">
          {recommendation.reasoning.map((reason, i) => (
            <li key={i} className="flex items-start">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
              {reason}
            </li>
          ))}
        </ul>
        
        <div className="pt-2 border-t border-slate-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Future Value Score:</span>
            <span className="font-medium text-slate-700">{recommendation.futureValue}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}