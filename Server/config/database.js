import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Enhanced MongoDB connection with advanced configuration
 * Implements connection pooling, retry logic, and monitoring
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  /**
   * Connect to MongoDB with enhanced configuration
   */
  async connect() {
    try {
      // Enhanced connection options for production-ready setup
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Connection pool settings
        maxPoolSize: 10, // Maximum number of connections
        minPoolSize: 2,  // Minimum number of connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        
        // Timeout settings
        serverSelectionTimeoutMS: 5000, // How long to try selecting a server
        socketTimeoutMS: 45000, // How long to wait for a response
        connectTimeoutMS: 10000, // How long to wait for initial connection
        
        // Heartbeat settings
        heartbeatFrequencyMS: 10000, // How often to check server status
        
        // Buffer settings
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
        
        // Write concern for data consistency
        writeConcern: {
          w: 'majority',
          j: true, // Wait for journal acknowledgment
          wtimeout: 5000
        },
        
        // Read preference
        readPreference: 'primary',
        
        // Compression
        compressors: ['zlib'],
        
        // SSL/TLS settings for production
        ...(process.env.NODE_ENV === 'production' && {
          ssl: true,
          sslValidate: true,
          sslCA: process.env.MONGO_SSL_CA,
          sslCert: process.env.MONGO_SSL_CERT,
          sslKey: process.env.MONGO_SSL_KEY
        })
      };

      // Connect with retry logic
      await this.connectWithRetry(options);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      // Set up graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('🎮 Database connection established successfully!');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect with retry logic
   */
  async connectWithRetry(options) {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        await mongoose.connect(process.env.MONGO_URL, options);
        this.isConnected = true;
        this.connectionAttempts = 0;
        return;
      } catch (error) {
        this.connectionAttempts++;
        console.error(`❌ Connection attempt ${this.connectionAttempts} failed:`, error.message);
        
        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
        }
        
        console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Exponential backoff
        this.retryDelay *= 1.5;
      }
    }
  }

  /**
   * Set up connection event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      // Attempt to reconnect
      if (process.env.NODE_ENV === 'production') {
        this.reconnect();
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Monitor connection pool
    mongoose.connection.on('fullsetup', () => {
      console.log('🔗 MongoDB replica set connection established');
    });
  }

  /**
   * Attempt to reconnect
   */
  async reconnect() {
    if (!this.isConnected && this.connectionAttempts < this.maxRetries) {
      console.log('🔄 Attempting to reconnect to database...');
      try {
        await this.connectWithRetry({});
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }
  }

  /**
   * Set up graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n📡 Received ${signal}. Closing database connection...`);
      
      try {
        await mongoose.connection.close();
        console.log('✅ Database connection closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing database connection:', error);
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections),
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Health check for monitoring
   */
  async healthCheck() {
    try {
      const adminDb = mongoose.connection.db.admin();
      const result = await adminDb.ping();
      
      return {
        status: 'healthy',
        connected: this.isConnected,
        ping: result.ok === 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection;
export { mongoose };