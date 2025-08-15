import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { DataScheduler } from './scheduler';
import { DataCollectionService } from './services/DataCollectionService';

class NFLPickerBackend {
  private app: express.Application;
  private scheduler: DataScheduler;
  private dataService: DataCollectionService;
  private server: any;

  constructor() {
    this.app = express();
    this.scheduler = new DataScheduler();
    this.dataService = new DataCollectionService();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
      credentials: true,
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'NFL Picker Backend',
        version: '1.0.0',
      });
    });

    // Scheduler status
    this.app.get('/scheduler/status', (req, res) => {
      const status = this.scheduler.getStatus();
      res.json(status);
    });

    // Manual data collection trigger
    this.app.post('/data/collect', async (req, res) => {
      try {
        const { week, year, seasonType } = req.body;
        
        if (week && year && seasonType) {
          await this.scheduler.runManualCollection(week, year, seasonType);
        } else {
          await this.scheduler.runManualCollection();
        }
        
        res.json({
          success: true,
          message: 'Data collection started successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Manual data collection failed', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Get update logs
    this.app.get('/data/logs', (req, res) => {
      const logs = this.scheduler.getUpdateLogs();
      res.json({
        logs,
        count: logs.length,
        timestamp: new Date().toISOString(),
      });
    });

    // Get current predictions
    this.app.get('/predictions/:week?', async (req, res) => {
      try {
        const week = req.params.week ? parseInt(req.params.week) : undefined;
        const year = req.query.year ? parseInt(req.query.year as string) : 2024;
        const seasonType = req.query.seasonType ? parseInt(req.query.seasonType as string) : 2;
        
        // This would fetch from your database in a real implementation
        // For now, return a placeholder response
        res.json({
          message: 'Predictions endpoint - implement database integration',
          week,
          year,
          seasonType,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get predictions', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Get team data
    this.app.get('/teams', async (req, res) => {
      try {
        const teams = await this.dataService.collectTeams();
        res.json({
          teams,
          count: teams.length,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get teams', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Get games for a specific week
    this.app.get('/games/:week', async (req, res) => {
      try {
        const week = parseInt(req.params.week);
        const year = req.query.year ? parseInt(req.query.year as string) : 2024;
        const seasonType = req.query.seasonType ? parseInt(req.query.seasonType as string) : 2;
        
        const games = await this.dataService.collectGames(week, year, seasonType);
        res.json({
          games,
          count: games.length,
          week,
          year,
          seasonType,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get games', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: err.message, stack: err.stack });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();
      
      // Start the scheduler
      this.scheduler.start();
      
      // Start the HTTP server
      this.server = this.app.listen(config.port, () => {
        logger.info(`NFL Picker Backend started on port ${config.port}`);
        logger.info(`Health check: http://localhost:${config.port}/health`);
        logger.info(`Scheduler status: http://localhost:${config.port}/scheduler/status`);
      });

      // Graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());

    } catch (error) {
      logger.error('Failed to start NFL Picker Backend', { error: error.message });
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');
    
    try {
      // Stop the scheduler
      this.scheduler.stop();
      
      // Close the HTTP server
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new NFLPickerBackend();
  app.start().catch((error) => {
    logger.error('Failed to start application', { error: error.message });
    process.exit(1);
  });
}

export { NFLPickerBackend };