# MongoDB Atlas and API Keys Summary

## Current Setup Status

Your backend is currently configured to use:

1. **Local MongoDB**: `mongodb://localhost:27017/proofchain`
2. **Local Redis**: No password required (disabled with `DISABLE_REDIS=true`)
3. **Blockchain Services**: Disabled with `DISABLE_BLOCKCHAIN=true`

## Required API Keys for Production

To move to a production environment, you'll need:

### 1. MongoDB Atlas
- **What you need**: Connection string with username and password
- **Where to get it**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **How to use it**: Update `MONGODB_URI` in your `.env` file
- **Example**: 
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/proofchain?retryWrites=true&w=majority
  ```

### 2. Redis (Optional for Development)
- **What you need**: Host, port, and password
- **Where to get it**: [Redis Cloud](https://redis.com/try-free/) or [Upstash](https://upstash.com/)
- **How to use it**: Update Redis settings in your `.env` file
- **Example**:
  ```
  REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
  REDIS_PORT=12345
  REDIS_PASSWORD=your_redis_password
  DISABLE_REDIS=false
  ```

### 3. Blockchain Provider (When Ready)
- **What you need**: RPC URL with API key
- **Where to get it**: [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/)
- **How to use it**: Update `BLOCKCHAIN_RPC_URL` in your `.env` file
- **Example**:
  ```
  BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your_infura_api_key
  DISABLE_BLOCKCHAIN=false
  ```

### 4. IPFS Provider (For Content Storage)
- **What you need**: API key and secret
- **Where to get it**: [Pinata](https://pinata.cloud/) or [Infura IPFS](https://infura.io/product/ipfs)
- **How to use it**: Add IPFS settings to your `.env` file
- **Example**:
  ```
  IPFS_API_URL=https://api.pinata.cloud/pinning
  IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
  IPFS_API_KEY=your_pinata_api_key
  IPFS_API_SECRET=your_pinata_api_secret
  ```

## Viewing MongoDB Data

### Local MongoDB
- Use MongoDB Compass: Connect to `mongodb://localhost:27017`
- Or use MongoDB Shell: `mongosh "mongodb://localhost:27017/proofchain"`

### MongoDB Atlas
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your project and cluster
3. Click "Browse Collections"
4. Navigate through your database and collections
5. Use the query interface to search for specific documents

## Testing Your Connection

We've created a test script that you can use to verify your MongoDB connection:

```bash
node test-mongodb-connection.js
```

This script will:
1. Connect to your MongoDB database (local or Atlas)
2. List all available collections
3. Show basic database statistics
4. Confirm successful connection

## Next Steps

1. Create a MongoDB Atlas account and set up a cluster
2. Update your `.env` file with the Atlas connection string
3. Test the connection using the provided script
4. When ready for production:
   - Set up Redis (if needed)
   - Configure IPFS storage
   - Enable blockchain services with appropriate provider

Refer to the detailed guides we've created:
- `mongodb-atlas-guide.md` for step-by-step MongoDB Atlas setup
- `mongodb-redis-setup.md` for comprehensive setup information
- `.env.atlas.example` for a template with Atlas configuration
