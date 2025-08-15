import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'nfl-picker-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export function logDataUpdate(
  dataType: string,
  status: 'success' | 'partial' | 'failed',
  recordsProcessed: number,
  recordsUpdated: number,
  recordsCreated: number,
  errors: string[] = [],
  duration?: number
): void {
  const logData = {
    dataType,
    status,
    recordsProcessed,
    recordsUpdated,
    recordsCreated,
    errors,
    duration,
  };

  if (status === 'success') {
    logger.info(`Data update completed successfully`, logData);
  } else if (status === 'partial') {
    logger.warn(`Data update completed with partial success`, logData);
  } else {
    logger.error(`Data update failed`, logData);
  }
}

export function logAPICall(
  apiName: string,
  endpoint: string,
  status: number,
  duration: number,
  error?: string
): void {
  const logData = {
    apiName,
    endpoint,
    status,
    duration,
    error,
  };

  if (status >= 200 && status < 300) {
    logger.info(`API call successful`, logData);
  } else if (status >= 400 && status < 500) {
    logger.warn(`API call failed (client error)`, logData);
  } else {
    logger.error(`API call failed (server error)`, logData);
  }
}

export function logPrediction(
  gameId: string,
  awayTeam: string,
  homeTeam: string,
  awayProbability: number,
  homeProbability: number,
  confidence: string,
  modelVersion: string
): void {
  logger.info(`Prediction generated`, {
    gameId,
    awayTeam,
    homeTeam,
    awayProbability,
    homeProbability,
    confidence,
    modelVersion,
  });
}