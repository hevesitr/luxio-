/**
 * Database Connection Pool
 * Centralized PostgreSQL connection pool
 */
require('dotenv').config();
const { Pool } = require('pg');

// Database configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'datingapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased timeout
};

// Create pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// Test connection on startup
let isConnected = false;
let connectionError = null;

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    isConnected = true;
    connectionError = null;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error;
    console.error('❌ Database connection error:', error.message);
    console.warn('⚠️  Server will continue without database. Some features may not work.');
    return false;
  }
};

// Test connection immediately
testConnection();

// Retry connection every 30 seconds if not connected
const retryInterval = setInterval(async () => {
  if (!isConnected) {
    console.log('🔄 Retrying database connection...');
    await testConnection();
  } else {
    clearInterval(retryInterval);
  }
}, 30000);

// Helper function to check if database is available
const isDatabaseAvailable = () => {
  return isConnected;
};

// Helper function to get connection error
const getConnectionError = () => {
  return connectionError;
};

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(retryInterval);
  pool.end(() => {
    console.log('Database pool closed');
  });
});

process.on('SIGINT', () => {
  clearInterval(retryInterval);
  pool.end(() => {
    console.log('Database pool closed');
  });
});

module.exports = {
  pool,
  isDatabaseAvailable,
  getConnectionError,
  testConnection,
};

