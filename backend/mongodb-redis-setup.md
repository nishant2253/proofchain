# MongoDB Atlas and API Keys Setup Guide

## MongoDB Atlas Setup

To connect your ProofChain application to MongoDB Atlas:

1. **Create a MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up or log in
   - Create a new project (if needed)

2. **Create a Cluster**:
   - Click "Build a Cluster" (free tier is available)
   - Select your preferred cloud provider and region
   - Choose the free tier option (M0)
   - Name your cluster (e.g., "ProofChain")

3. **Set Up Database Access**:
   - Go to "Database Access" under Security
   - Click "Add New Database User"
   - Create a username and password (save these securely)
   - Select "Read and write to any database" for user privileges
   - Click "Add User"

4. **Configure Network Access**:
   - Go to "Network Access" under Security
   - Click "Add IP Address"
   - For development: Add your current IP or use "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add only specific IP addresses

5. **Get Your Connection String**:
   - Go to "Clusters" and click "Connect"
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your actual values

6. **Update Your .env File**:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

## Redis Configuration

For Redis, you have several options:

1. **Local Development**:
   - Install Redis locally
   - No password is required (leave REDIS_PASSWORD empty)
   - Use default host (localhost) and port (6379)

2. **Redis Cloud Services** (for production):
   - Sign up for [Redis Cloud](https://redis.com/try-free/), [Upstash](https://upstash.com/), or similar
   - They will provide you with:
     - Host URL
     - Port
     - Password
   - Update your .env file with these values

3. **Using Docker** (for development):
   - Run Redis in a Docker container
   - Set a password using the command:
     ```
     docker run --name redis -p 6379:6379 -d redis redis-server --requirepass yourpassword
     ```
   - Update your .env file:
     ```
     REDIS_PASSWORD=yourpassword
     ```

## Required API Keys

For the current phase of development, you need the following API keys:

1. **MongoDB Atlas**:
   - Database username and password (included in connection string)

2. **Redis** (optional for development):
   - Redis password (if using a hosted service or if you set one locally)

3. **Blockchain Provider** (when DISABLE_BLOCKCHAIN=false):
   - Infura, Alchemy, or similar provider API key
   - Update BLOCKCHAIN_RPC_URL in .env:
     ```
     BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY
     ```

4. **IPFS Provider** (for production):
   - Pinata, Infura IPFS, or similar
   - Add to .env:
     ```
     IPFS_API_KEY=your_ipfs_api_key
     IPFS_API_SECRET=your_ipfs_api_secret
     ```

## Viewing MongoDB Data in Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your project and cluster
3. Click "Collections" button
4. Here you can browse and query all your collections
5. Use the "Find" operation to query specific documents
6. You can also create indexes, analyze performance, and more

## Testing Your Connection

To test if your MongoDB Atlas connection is working:

```javascript
// Add this to a test file
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connection successful!');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    await mongoose.disconnect();
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error);
  }
}

testConnection();
```

Run this with Node.js to verify your connection.
