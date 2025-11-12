/**
 * KEY CONCEPTS EXPLAINED:
 * 
 * 1. Environment Variables (.env file):
 *    - Store sensitive configuration outside of code
 *    - Typical .env content:
 *        MONGODB_URI=mongodb://localhost:27017/science
 *        DB_USER=username
 *        DB_PASS=password
 * 
 * 2. MongoDB Connection String Breakdown:
 *    - mongodb:// - Protocol for MongoDB connections
 *    - localhost - Database server hostname
 *    - 27017 - Default MongoDB port
 *    - science - Database name
 * 
 * 3. Error Handling Strategy:
 *    - Try/catch for async/await error handling
 *    - Process termination on critical failure
 *    - Detailed logging for debugging
 * 
 * 4. Mongoose Connection Pooling:
 *    - By default, mongoose maintains a connection pool
 *    - Multiple requests share the same connection
 *    - Improves performance by reusing connections
 * 
 * 5. Connection Events (available on mongoose.connection):
 *    - connected: When successfully connected
 *    - error: When connection fails
 *    - disconnected: When connection is lost
 *    - reconnected: When connection is re-established after being lost
 */

/**
 * ADVANCED USAGE EXAMPLES:
 * 
 * // With connection options for production:
 * const conn = await mongoose.connect(process.env.MONGODB_URI, {
 *   useNewUrlParser: true,          // Use new URL string parser
 *   useUnifiedTopology: true,       // Use new server discovery and monitoring engine
 *   maxPoolSize: 10,                // Maximum number of sockets in connection pool
 *   serverSelectionTimeoutMS: 5000, // Timeout for server selection
 *   socketTimeoutMS: 45000,         // Socket timeout
 * });
 * 
 * // With event listeners for connection monitoring:
 * mongoose.connection.on('connected', () => {
 *   console.log('Mongoose connected to DB');
 * });
 * 
 * mongoose.connection.on('error', (err) => {
 *   console.log('Mongoose connection error:', err);
 * });
 * 
 * mongoose.connection.on('disconnected', () => {
 *   console.log('Mongoose disconnected');
 * });
 */

/**
 * TROUBLESHOOTING COMMON ISSUES:
 * 
 * 1. "Authentication Failed":
 *    - Check username/password in connection string
 *    - Verify database user has correct permissions
 * 
 * 2. "Connection Refused":
 *    - MongoDB service not running
 *    - Wrong port or hostname
 *    - Firewall blocking connection
 * 
 * 3. "Invalid Schema":
 *    - Incorrect connection string format
 *    - Missing mongodb:// protocol prefix
 * 
 * 4. "Environment Variable Not Loaded":
 *    - .env file not in project root
 *    - dotenv.config() not called early enough
 *    - Variable name mismatch
 */

// mongoose: MongoDB object modeling tool designed to work in an asynchronous environment
import mongoose from 'mongoose';

// dotenv: Zero-dependency module that loads environment variables from a .env file into process.env, making configuration management cleaner and more secure
import dotenv from 'dotenv';

import mongoosePaginate from 'mongoose-paginate-v2';

// Aplicar paginação a todos os modelos
mongoose.plugin(mongoosePaginate);

// Load environment variables from .env file into process.env. The .env file typically contains sensitive information like database URIs, API keys, etc.
dotenv.config();

/**
 * connectDB - Asynchronous function to establish connection to MongoDB database
 * This function handles the complete database connection lifecycle including:
 * - Reading connection URI from environment variables
 * - Establishing the connection
 * - Handling connection success and errors
 * - Ensuring proper application termination on connection failure
 * @returns {Promise<object>} MongoDB connection object if successful
 * @throws {Error} Terminates process with exit code 1 on connection failure
 */
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB database
        // mongoose.connect() returns a Promise that resolves to a connection object
        // Common MongoDB URI patterns:
        // - Local: 'mongodb://localhost:27017/database_name'
        // - Atlas: 'mongodb+srv://username:password@cluster.mongodb.net/database_name'
        // - With authentication: 'mongodb://username:password@host:port/database_name'
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/frotaVeiculos');

        // Connection successful - log confirmation message
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Return the connection object for potential use elsewhere in the application. While mongoose maintains the connection internally, returning it can be useful for advanced scenarios where you need direct access to the connection
        return conn;

    }
    catch (error) {
        console.error('Database connection error:', error);

        // Terminate the Node.js process with exit code 1 (error)
        // This is a critical failure - without database connection, the application cannot function properly, so it's better to exit gracefully
        // Why process.exit(1)?
        // - Prevents the application from running in an invalid state
        // - Allows process managers (like PM2, Docker, Kubernetes) to restart the application
        // - Provides clear indication that startup failed
        // - Exit code 1 indicates an error (0 would indicate success)
        process.exit(1);
    }
};

// Export the connectDB function as the default export. This allows other modules to import and use this function
export default connectDB;