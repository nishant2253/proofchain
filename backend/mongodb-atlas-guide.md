# MongoDB Atlas Setup Guide for ProofChain

## Step 1: Create a MongoDB Atlas Account and Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account
2. Create a new project named "ProofChain"
3. Click "Build a Database" and select the FREE tier
4. Choose your preferred cloud provider and region
5. Name your cluster (e.g., "ProofChain-Cluster")
6. Click "Create Cluster" (this may take a few minutes)

## Step 2: Set Up Database Access

1. In the left sidebar, click "Database Access" under SECURITY
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Enter a username and password (save these securely!)
5. Under "Database User Privileges", select "Atlas admin" for simplicity
6. Click "Add User"

## Step 3: Configure Network Access

1. In the left sidebar, click "Network Access" under SECURITY
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (not recommended for production)
4. Click "Confirm"

## Step 4: Get Your Connection String

1. In the left sidebar, click "Database" under DEPLOYMENTS
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string (it will look like this):
   ```
   mongodb+srv://<username>:<password>@proofchain-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with the credentials you created
6. Add your database name after the hostname (before the `?`):
   ```
   mongodb+srv://username:password@proofchain-cluster.xxxxx.mongodb.net/proofchain?retryWrites=true&w=majority
   ```

## Step 5: Update Your .env File

1. Open your project's `.env` file
2. Replace the existing MONGODB_URI with your Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@proofchain-cluster.xxxxx.mongodb.net/proofchain?retryWrites=true&w=majority
   ```

## Step 6: Test Your Connection

1. Run the test script we created:
   ```
   node test-mongodb-connection.js
   ```
2. If successful, you should see "MongoDB connection successful!" and information about your database

## Step 7: View Your Data in MongoDB Atlas

1. Go back to the MongoDB Atlas dashboard
2. Click on "Browse Collections" on your cluster
3. Here you can view all collections and documents in your database
4. As you use the application, data will appear here

## Common Issues and Solutions

### Connection Failed

If you see "MongoDB connection failed", check:
1. Your network connection
2. That you've replaced `<username>` and `<password>` with actual values
3. That the IP address you're connecting from is allowed in Network Access
4. That your database user has the correct permissions

### Empty Database

If you see "No collections found":
1. This is normal for a new database
2. Collections will be created automatically when you start using the application

## Required API Keys Summary

For the current phase of development, you need:

1. **MongoDB Atlas**:
   - Database username and password (included in connection string)

2. **Redis** (optional for development):
   - No API key needed for local development
   - For Redis Cloud: host, port, and password

3. **Blockchain Provider** (when DISABLE_BLOCKCHAIN=false):
   - Infura or Alchemy API key for Ethereum RPC access

4. **IPFS Provider** (for production):
   - Pinata or Infura IPFS API key and secret
