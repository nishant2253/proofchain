const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
  try {
    console.log('Attempting to connect to MongoDB using URI:', 
      process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('No collections found (database may be empty)');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    console.log('\nDatabase stats:');
    console.log(`- Database: ${mongoose.connection.db.databaseName}`);
    console.log(`- Collections: ${stats.collections}`);
    console.log(`- Documents: ${stats.objects}`);
    console.log(`- Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\nConnection test completed successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed.');
    }
  }
}

// Run the test
testMongoDBConnection();
