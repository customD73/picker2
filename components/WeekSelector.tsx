import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  selectedWeek: number;
  selectedYear: number;
  seasonType: number;
  onWeekChange: (week: number) => void;
  onYearChange: (year: number) => void;
  onSeasonTypeChange: (type: number) => void;
}

export function WeekSelector({
  selectedWeek,
  selectedYear,
  seasonType,
  onWeekChange,
  onYearChange,
  onSeasonTypeChange,
}: WeekSelectorProps) {
  const getMaxWeeks = () => {
    if (seasonType === 1) return 4; // Preseason
    if (seasonType === 2) return 18; // Regular season
    return 4; // Postseason
  };

  const getSeasonTypeLabel = (type: number) => {
    switch (type) {
      case 1: return 'Preseason';
      case 2: return 'Regular Season';
      case 3: return 'Postseason';
      default: return 'Regular Season';
    }
  };

  const canGoPrevious = () => {
    if (seasonType === 1) return selectedWeek > 1;
    if (seasonType === 2) return selectedWeek > 1;
    return selectedWeek > 1;
  };

  const canGoNext = () => {
    return selectedWeek < getMaxWeeks();
  };

  const handlePrevious = () => {
    if (canGoPrevious()) {
      onWeekChange(selectedWeek - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      onWeekChange(selectedWeek + 1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Select value={seasonType.toString()} onValueChange={(value) => {
          onSeasonTypeChange(parseInt(value));
          onWeekChange(1); // Reset to week 1 when changing season type
        }}>
          <SelectTrigger className="w-48 text-base h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Preseason</SelectItem>
            <SelectItem value="2">Regular Season</SelectItem>
            <SelectItem value="3">Postseason</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
          <SelectTrigger className="w-24 text-base h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious()}
          className="text-base"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="text-center">
          <div className="text-lg font-medium text-slate-900">
            Week {selectedWeek}
          </div>
          <div className="text-sm text-slate-500">
            {getSeasonTypeLabel(seasonType)}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext()}
          className="text-base"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Select value={selectedWeek.toString()} onValueChange={(value) => onWeekChange(parseInt(value))}>
          <SelectTrigger className="w-32 text-base h-10">
            <SelectValue placeholder="Jump to..." />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: getMaxWeeks() }, (_, i) => i + 1).map(week => (
              <SelectItem key={week} value={week.toString()}>
                Week {week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}