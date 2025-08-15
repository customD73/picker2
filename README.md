# NFL Picker Backend

A comprehensive backend system for the NFL picker app that collects real-time data from multiple sources and generates win probability predictions for NFL games.

## Features

- **Real-time Data Collection**: Automatically collects data from MySportsFeeds and OpenWeather APIs
- **Intelligent Predictions**: Advanced algorithm combining team stats, injuries, weather, and more
- **Scheduled Updates**: Hourly, daily, and weekly data collection schedules
- **Comprehensive Metrics**: Team strength, offensive/defensive power, injury impact, weather conditions
- **RESTful API**: HTTP endpoints for data access and manual operations
- **Robust Logging**: Structured logging with Winston
- **Rate Limiting**: Built-in API rate limiting and request queuing
- **Error Handling**: Comprehensive error handling and graceful degradation

## Data Sources

- **MySportsFeeds API**: NFL schedules, team stats, player injuries, team records
- **OpenWeather API**: Stadium weather forecasts and current conditions
- **Additional Sources**: Team strength rankings, historical matchup data

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Data Sources  │
│   (React App)   │◄──►│   (Express)      │◄──►│   (APIs)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Scheduler      │
                       │   (node-cron)    │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Data Collection│
                       │   Service        │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Prediction     │
                       │   Engine         │
                       └──────────────────┘
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/customD73/picker2.git
   cd picker2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   MYSPORTSFEEDS_API_KEY=your_mysportsfeeds_api_key_here
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   SUPABASE_URL=https://gxdxmnivpbqbdilweamx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Scheduler Only
```bash
npm run schedule
```

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /scheduler/status` - Scheduler status and last update

### Data Collection
- `POST /data/collect` - Manually trigger data collection
- `GET /data/logs` - Get data collection logs

### Data Access
- `GET /teams` - Get all NFL teams
- `GET /games/:week` - Get games for a specific week
- `GET /predictions/:week?` - Get predictions for a specific week

### Example API Calls

```bash
# Check service health
curl http://localhost:3001/health

# Get teams
curl http://localhost:3001/teams

# Get games for week 1
curl "http://localhost:3001/games/1?year=2024&seasonType=2"

# Manually trigger data collection
curl -X POST http://localhost:3001/data/collect \
  -H "Content-Type: application/json" \
  -d '{"week": 1, "year": 2024, "seasonType": 2}'
```

## Configuration

The system is configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | HTTP server port | `3001` |
| `LOG_LEVEL` | Logging level | `info` |
| `UPDATE_INTERVAL_HOURS` | Data update frequency | `1` |
| `ENABLE_WEATHER_UPDATES` | Enable weather data collection | `true` |
| `ENABLE_INJURY_UPDATES` | Enable injury data collection | `true` |
| `ENABLE_STATS_UPDATES` | Enable stats data collection | `true` |
| `ENABLE_NEWS_UPDATES` | Enable news data collection | `true` |

## Data Collection Schedule

- **Hourly**: Current week data updates
- **Daily (6 AM ET)**: Comprehensive data for current and next week
- **Weekly (Monday 9 AM ET)**: Full season data collection

## Prediction Algorithm

The prediction engine combines multiple weighted factors:

1. **Team Strength (25%)**: Overall performance and win/loss record
2. **Offensive Power (20%)**: Scoring ability and offensive efficiency
3. **Defensive Power (20%)**: Defensive performance and stopping ability
4. **Injury Impact (15%)**: Effect of player injuries on team performance
5. **Weather Conditions (10%)**: Impact of weather on game performance
6. **Schedule Strength (10%)**: Difficulty of recent and upcoming opponents

Additional factors include:
- Home field advantage (3% boost)
- Rest advantage (2% boost for teams with more rest)
- Momentum factor (5% boost for teams on winning streaks)

## Database Integration

The system is designed to work with Supabase. You'll need to:

1. Create tables for teams, games, stats, injuries, weather, and predictions
2. Implement the database update methods in `DataCollectionService`
3. Configure your Supabase connection

## Logging

Logs are written to:
- Console (development mode)
- `logs/combined.log` - All log levels
- `logs/error.log` - Error level only

Log rotation is configured with 5MB file size limit and 5 file retention.

## Error Handling

The system includes comprehensive error handling:
- API rate limiting and retry logic
- Graceful degradation when data sources are unavailable
- Detailed error logging and monitoring
- Automatic recovery from transient failures

## Development

### Project Structure
```
src/
├── config/          # Configuration and environment variables
├── services/        # API services and data collection
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and logging
├── index.ts         # Main application entry point
└── scheduler.ts     # Data collection scheduler
```

### Adding New Data Sources

1. Create a new service class in `src/services/`
2. Implement the data collection methods
3. Add the service to `DataCollectionService`
4. Update the types in `src/types/`
5. Add configuration options in `src/config/`

### Testing

```bash
npm test
```

## Troubleshooting

### Common Issues

1. **API Rate Limits**: The system includes built-in rate limiting, but check your API quotas
2. **Missing API Keys**: Ensure all required environment variables are set
3. **Database Connection**: Verify Supabase credentials and network access
4. **Memory Issues**: Monitor log file sizes and implement log rotation if needed

### Debug Mode

Set `LOG_LEVEL=debug` in your environment for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in `logs/` directory
3. Open an issue on GitHub

## Roadmap

- [ ] Machine learning model integration
- [ ] Real-time game updates
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Social features and leaderboards
- [ ] Historical prediction accuracy tracking
