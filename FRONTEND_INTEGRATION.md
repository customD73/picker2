# Frontend Integration Guide

This guide explains how to integrate your existing React frontend with the new NFL Picker Backend.

## Overview

Your existing frontend already has a well-structured UI with components for:
- Game predictions
- Suicide pool tracking
- Metric configuration
- Week selection

The backend provides real-time data to replace the mock data currently used.

## Integration Steps

### 1. Update API Configuration

Create a new API service file to replace mock data calls:

```typescript
// src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export class APIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Game Predictions
  async getGamePredictions(week: number, year: number, seasonType: number) {
    return this.request(`/predictions/${week}?year=${year}&seasonType=${seasonType}`);
  }

  // Teams
  async getTeams() {
    return this.request('/teams');
  }

  // Games
  async getGames(week: number, year: number, seasonType: number) {
    return this.request(`/games/${week}?year=${year}&seasonType=${seasonType}`);
  }

  // Manual data collection
  async triggerDataCollection(week?: number, year?: number, seasonType?: number) {
    return this.request('/data/collect', {
      method: 'POST',
      body: JSON.stringify({ week, year, seasonType }),
    });
  }
}

export const apiService = new APIService();
```

### 2. Update GamePredictions Component

Replace the mock data loading with real API calls:

```typescript
// src/components/GamePredictions.tsx
import { apiService } from '../services/api';

export function GamePredictions({ week, year, seasonType, user, supabase }: GamePredictionsProps) {
  // ... existing state ...

  const loadGamePredictions = async () => {
    setLoading(true);
    try {
      // Fetch real data from backend
      const predictions = await apiService.getGamePredictions(week, year, seasonType);
      setGames(predictions);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Failed to load game predictions');
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component ...
}
```

### 3. Update Mock Data Structure

Your existing mock data structure is already well-designed and matches the backend types. The main changes needed are:

- Replace `mockGames` with real API data
- Update the `GamePrediction` interface to match backend types
- Ensure team abbreviations and IDs are consistent

### 4. Add Real-time Updates

Add a refresh mechanism to keep data current:

```typescript
// Add to GamePredictions component
useEffect(() => {
  // Initial load
  loadGamePredictions();

  // Set up auto-refresh every 5 minutes
  const interval = setInterval(loadGamePredictions, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [week, year, seasonType]);
```

### 5. Update Environment Variables

Add backend URL to your frontend environment:

```env
# .env.local
REACT_APP_API_URL=http://localhost:3001
```

## Data Flow

```
Frontend Component → API Service → Backend API → Database
       ↑                                                    ↓
       └─────────────── Real-time Updates ←────────────────┘
```

## Key Integration Points

### 1. Game Predictions
- **Current**: Uses `mockGames` from constants
- **New**: Fetches from `/predictions/:week` endpoint
- **Update**: Replace `loadGamePredictions()` function

### 2. Team Data
- **Current**: Hardcoded team information
- **New**: Fetches from `/teams` endpoint
- **Update**: Create teams context/provider

### 3. Week Selection
- **Current**: Static week options
- **New**: Dynamic based on current season
- **Update**: Fetch available weeks from backend

### 4. Metric Configuration
- **Current**: Uses `defaultMetrics` from constants
- **New**: Fetches user preferences from Supabase
- **Update**: Integrate with existing Supabase setup

## Error Handling

Add proper error handling for API failures:

```typescript
const loadGamePredictions = async () => {
  setLoading(true);
  try {
    const predictions = await apiService.getGamePredictions(week, year, seasonType);
    setGames(predictions);
    setLastUpdated(new Date());
  } catch (error) {
    toast.error('Failed to load game predictions');
    
    // Fallback to cached data if available
    if (games.length > 0) {
      toast.info('Using cached data');
    }
  } finally {
    setLoading(false);
  }
};
```

## Loading States

Enhance loading states to show data freshness:

```typescript
const [dataStatus, setDataStatus] = useState<'fresh' | 'stale' | 'loading'>('loading');

// In your component
{dataStatus === 'stale' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
    <p className="text-yellow-800 text-sm">
      Data may be outdated. Click refresh to get latest predictions.
    </p>
  </div>
)}
```

## Testing Integration

1. **Start Backend**: Run `npm run dev` in backend directory
2. **Start Frontend**: Run `npm start` in frontend directory
3. **Test Endpoints**: Use browser dev tools to verify API calls
4. **Check Data**: Verify real data appears in your components

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for your frontend URL
2. **API Timeouts**: Check backend is running and accessible
3. **Data Mismatch**: Verify data structure matches between frontend and backend
4. **Authentication**: Ensure Supabase integration still works

### Debug Steps

1. Check browser network tab for API calls
2. Verify backend logs for errors
3. Test API endpoints directly with curl/Postman
4. Check environment variables are set correctly

## Performance Considerations

1. **Caching**: Implement client-side caching for frequently accessed data
2. **Debouncing**: Debounce refresh requests to avoid API spam
3. **Lazy Loading**: Load data only when components are visible
4. **Optimistic Updates**: Show immediate feedback for user actions

## Next Steps

After basic integration:

1. **Real-time Updates**: Implement WebSocket connections for live data
2. **Offline Support**: Add service worker for offline functionality
3. **Advanced Analytics**: Add prediction accuracy tracking
4. **User Preferences**: Sync user settings across devices

## Support

For integration issues:
1. Check backend logs in `logs/` directory
2. Verify API endpoints are responding
3. Check browser console for errors
4. Review network requests in dev tools