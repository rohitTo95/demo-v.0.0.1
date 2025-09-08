import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  port: number;
  nextApiUrl: string;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nextApiUrl: process.env.NEXT_API_URL || 'http://localhost:3000/api',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required configuration
if (!config.nextApiUrl) {
  throw new Error('NEXT_API_URL environment variable is required');
}

export default config;
