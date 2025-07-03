const mongoose = require("mongoose");

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise} MongoDB connection
 */
const connectDB = async () => {
  try {
    // Use default MongoDB URI if environment variable is not set
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/proofchain";

    // Check if MongoDB connection should be skipped (for testing)
    if (process.env.DISABLE_MONGODB === "true") {
      console.log("MongoDB connection disabled. Running in test mode.");
      return null;
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);

    // Don't exit in development mode
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.log(
        "Running without MongoDB connection. Some features will be unavailable."
      );
      return null;
    }
  }
};

module.exports = connectDB;
