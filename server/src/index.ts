/**
 * Fish Selling Management System Server
 * Main entry point for the Express.js server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { serverConfig, rateLimitConfig } from '../config/environment.js';
import { testConnection, closePool } from '../config/database.js';
import { testCloudinaryConnection } from '../config/cloudinary.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { notFoundHandler } from '../middleware/notFoundHandler.js';
import { requestLogger } from '../middleware/requestLogger.js';

// Import route handlers
import authRoutes from '../routes/auth.js';
import userRoutes from '../routes/users.js';
import workerRoutes from '../routes/workers.js';
import productRoutes from '../routes/products.js';
import categoriesRoutes from '../routes/categories.js';
import salesRoutes from '../routes/sales.js';
import expenseRoutes from '../routes/expenses.js';
import contactRoutes from '../routes/contacts.js';
import messageRoutes from '../routes/messages.js';
import fileRoutes from '../routes/files.js';
import folderRoutes from '../routes/folders.js';
import dashboardRoutes from '../routes/dashboard.js';
import reportRoutes from '../routes/reports.js';

/**
 * Create Express application instance
 */
const app = express();

/**
 * Security middleware configuration
 * Implements security best practices for production deployment
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/**
 * CORS configuration
 * Allows cross-origin requests from the frontend application
 */
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * Rate limiting configuration
 * Prevents abuse and ensures fair usage of the API
 */
const limiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/**
 * Body parsing middleware
 * Handles JSON and URL-encoded request bodies
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Compression middleware
 * Reduces response size for better performance
 */
app.use(compression());

/**
 * Logging middleware
 * Logs HTTP requests for monitoring and debugging
 */
if (serverConfig.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * Custom request logging middleware
 * Adds additional request tracking and monitoring
 */
app.use(requestLogger);

/**
 * Health check endpoint
 * Provides server status and database connectivity information
 */
app.get('/health', async (_req, res) => {
  try {
    const dbConnected = await testConnection();

    res.status(200).json({
      success: true,
      message: 'Fish Management Server is running',
      data: {
        server: 'online',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date(),
        version: '1.0.0',
        environment: serverConfig.nodeEnv,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'HEALTH_CHECK_FAILED',
      timestamp: new Date(),
    });
  }
});

/**
 * API route configuration
 * Organizes all API endpoints under /api prefix
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

/**
 * Root endpoint
 * Provides basic API information
 */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Fish Selling Management System API',
    data: {
      version: '1.0.0',
      environment: serverConfig.nodeEnv,
      documentation: '/api/docs',
      health: '/health',
    },
    timestamp: new Date(),
  });
});

/**
 * Error handling middleware
 * Must be defined after all routes and middleware
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Graceful shutdown handling
 * Ensures proper cleanup when the server is terminated
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await closePool();
    console.log('✅ Database connections closed');
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Start the server
 * Initializes the Express server and database connection
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Test Cloudinary connection
    const cloudinaryConnected = await testCloudinaryConnection();
    if (!cloudinaryConnected) {
      console.warn('⚠️  Cloudinary connection test failed - file uploads may not work properly');
    }

    // Start the server
    app.listen(serverConfig.port, () => {
      console.log('🚀 Fish Management Server started successfully!');
      console.log(`📍 Server running on port ${serverConfig.port}`);
      console.log(`🌍 Environment: ${serverConfig.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${serverConfig.port}/health`);
      console.log(`📊 API endpoints: http://localhost:${serverConfig.port}/api`);
      console.log('✅ Database connection established');
      console.log(`${cloudinaryConnected ? '✅' : '⚠️ '} Cloudinary ${cloudinaryConnected ? 'connected' : 'connection failed'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  console.error('❌ Unhandled error during server startup:', error);
  process.exit(1);
});

export default app;
