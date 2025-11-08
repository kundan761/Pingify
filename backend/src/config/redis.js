import { createClient } from 'redis';
import logger from './logger.js';
import { config } from './env.js';

// Create Redis client configuration
let redisConfig = {};

// If Redis URL is provided (for Redis Cloud), use it
if (config.redis.url) {
  redisConfig = {
    url: config.redis.url,
  };
  logger.info('Using Redis URL configuration');
} else {
  // Otherwise, use host/port configuration
  redisConfig = {
    socket: {
      host: config.redis.host,
      port: parseInt(config.redis.port),
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis reconnection failed after 10 retries');
          return new Error('Redis reconnection failed');
        }
        const delay = Math.min(retries * 100, 3000);
        logger.info(`Redis reconnecting... attempt ${retries}, delay ${delay}ms`);
        return delay;
      },
    },
  };

  // Add password if provided
  if (config.redis.password) {
    redisConfig.password = config.redis.password;
  }

  // Add username if provided (for Redis Cloud ACL)
  if (config.redis.username) {
    redisConfig.username = config.redis.username;
  }

  logger.info(`Using Redis host/port configuration: ${config.redis.host}:${config.redis.port}`);
}

const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
  logger.error(`Redis Client Error: ${err.message}`);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready - Connection established successfully');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis Client Reconnecting...');
});

redisClient.on('end', () => {
  logger.warn('Redis Client Connection Ended');
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Redis connection established successfully');
      
      // Test the connection with a ping
      const pong = await redisClient.ping();
      logger.info(`Redis ping response: ${pong}`);
    } else {
      logger.info('Redis client already connected');
    }
  } catch (error) {
    logger.error(`Redis connection error: ${error.message}`);
    logger.error(`Redis connection error details: ${JSON.stringify({
      host: config.redis.host,
      port: config.redis.port,
      hasPassword: !!config.redis.password,
      hasUsername: !!config.redis.username,
      hasUrl: !!config.redis.url,
    })}`);
    
    // Don't throw error, let the app continue without Redis
    // Some features may not work, but the app should still run
    logger.warn('Application will continue without Redis. Some features may be limited.');
  }
};

export { redisClient, connectRedis };

