import cron from 'node-cron';
import { logger } from './utils/logger';
import { config } from './config';
import { DataCollectionService } from './services/DataCollectionService';

class DataScheduler {
  private dataService: DataCollectionService;
  private isRunning = false;

  constructor() {
    this.dataService = new DataCollectionService();
  }

  start(): void {
    logger.info('Starting NFL data collection scheduler');
    
    // Schedule hourly data collection
    cron.schedule('0 * * * *', async () => {
      await this.runHourlyCollection();
    }, {
      scheduled: true,
      timezone: 'America/New_York', // NFL timezone
    });

    // Schedule daily data collection at 6 AM ET
    cron.schedule('0 6 * * *', async () => {
      await this.runDailyCollection();
    }, {
      scheduled: true,
      timezone: 'America/New_York',
    });

    // Schedule weekly data collection on Monday at 9 AM ET
    cron.schedule('0 9 * * 1', async () => {
      await this.runWeeklyCollection();
    }, {
      scheduled: true,
      timezone: 'America/New_York',
    });

    // Run initial collection
    this.runInitialCollection();

    logger.info('Scheduler started successfully');
  }

  private async runInitialCollection(): Promise<void> {
    try {
      logger.info('Running initial data collection');
      await this.dataService.collectAllData();
      logger.info('Initial data collection completed');
    } catch (error) {
      logger.error('Initial data collection failed', { error: error.message });
    }
  }

  private async runHourlyCollection(): Promise<void> {
    if (this.isRunning) {
      logger.info('Hourly collection already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting hourly data collection');
      
      // Collect current week data
      await this.dataService.collectDataForCurrentWeek();
      
      const duration = Date.now() - startTime;
      logger.info(`Hourly data collection completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Hourly data collection failed', { 
        error: error.message, 
        duration 
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async runDailyCollection(): Promise<void> {
    if (this.isRunning) {
      logger.info('Daily collection already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting daily comprehensive data collection');
      
      // Collect data for multiple weeks to ensure coverage
      const currentSeason = await this.dataService['mySportsFeeds'].getCurrentSeason();
      
      // Collect data for current week and next week
      for (let week = 1; week <= 2; week++) {
        try {
          await this.dataService.collectDataForSpecificWeek(week, currentSeason.year, currentSeason.seasonType);
          logger.info(`Daily collection completed for week ${week}`);
        } catch (error) {
          logger.error(`Daily collection failed for week ${week}`, { error: error.message });
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Daily data collection completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Daily data collection failed', { 
        error: error.message, 
        duration 
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async runWeeklyCollection(): Promise<void> {
    if (this.isRunning) {
      logger.info('Weekly collection already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting weekly comprehensive data collection');
      
      // Collect data for all weeks in the current season
      const currentSeason = await this.dataService['mySportsFeeds'].getCurrentSeason();
      
      // For regular season, collect weeks 1-18
      const maxWeeks = currentSeason.seasonType === 2 ? 18 : 4;
      
      for (let week = 1; week <= maxWeeks; week++) {
        try {
          await this.dataService.collectDataForSpecificWeek(week, currentSeason.year, currentSeason.seasonType);
          logger.info(`Weekly collection completed for week ${week}`);
          
          // Add delay between weeks to avoid overwhelming APIs
          if (week < maxWeeks) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (error) {
          logger.error(`Weekly collection failed for week ${week}`, { error: error.message });
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Weekly data collection completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Weekly data collection failed', { 
        error: error.message, 
        duration 
      });
    } finally {
      this.isRunning = false;
    }
  }

  async runManualCollection(week?: number, year?: number, seasonType?: number): Promise<void> {
    if (this.isRunning) {
      throw new Error('Data collection already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting manual data collection', { week, year, seasonType });
      
      if (week && year && seasonType) {
        await this.dataService.collectDataForSpecificWeek(week, year, seasonType);
      } else {
        await this.dataService.collectAllData();
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Manual data collection completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Manual data collection failed', { 
        error: error.message, 
        duration 
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  stop(): void {
    logger.info('Stopping NFL data collection scheduler');
    // Note: node-cron doesn't have a built-in stop method
    // In a production environment, you might want to implement a more sophisticated stop mechanism
    this.isRunning = false;
  }

  getStatus(): { isRunning: boolean; lastUpdate?: Date } {
    return {
      isRunning: this.isRunning,
      lastUpdate: new Date(),
    };
  }

  getUpdateLogs() {
    return this.dataService.getUpdateLogs();
  }
}

// Start the scheduler if this file is run directly
if (require.main === module) {
  const scheduler = new DataScheduler();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    scheduler.stop();
    process.exit(0);
  });

  scheduler.start();
}

export { DataScheduler };