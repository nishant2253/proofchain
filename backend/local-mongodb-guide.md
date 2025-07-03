# Viewing ProofChain Data in MongoDB Compass

## Current Setup

Your application is already configured to use a local MongoDB instance at:
```
mongodb://localhost:27017/proofchain
```

This is correctly set in your `.env` file, and MongoDB Compass is already connected to your local MongoDB server.

## Steps to View Your Data

1. **Launch MongoDB Compass** (which you've already done)

2. **Connect to your local MongoDB**
   - Click on the `localhost:27017` connection in the left sidebar
   - This connects to your local MongoDB server

3. **Navigate to the ProofChain Database**
   - In the list of databases, find and click on `proofchain`
   - If you don't see it, make sure your application has run and created the database

4. **Explore Collections**
   - You should see the following collections:
     - `contentitems` - Stores content submitted to the platform
     - `userprofiles` - User account information
     - `commitinfos` - Vote commitment information
     - `revealinfos` - Vote reveal information
     - `supportedtokens` - Information about supported tokens

5. **View Documents**
   - Click on any collection to view its documents
   - Use the filter bar at the top to search for specific documents
   - Click on any document to view its details

## Creating Sample Data

If you don't see any data yet, you can create some sample data:

1. **Start your application**
   ```
   npm start
   ```

2. **Use the API endpoints** to create users, submit content, etc.

3. **Or run a script to seed the database**:
   Create a file called `seed-db.js`:

   ```javascript
   const mongoose = require('mongoose');
   const { UserProfile, ContentItem, SupportedToken } = require('./models');
   require('dotenv').config();

   async function seedDatabase() {
     try {
       // Connect to MongoDB
       await mongoose.connect(process.env.MONGODB_URI);
       console.log('Connected to MongoDB');
       
       // Create a sample user
       const user = new UserProfile({
         address: '0x1234567890abcdef1234567890abcdef12345678',
         username: 'testuser',
         email: 'test@example.com',
         reputation: 100,
         joinDate: new Date(),
         lastLoginTime: new Date(),
         totalVotes: 5,
         successfulVotes: 3
       });
       
       await user.save();
       console.log('Sample user created');
       
       // Create a sample content item
       const content = new ContentItem({
         contentId: '1',
         ipfsHash: 'QmXyZ123456789',
         title: 'Test Content',
         description: 'This is a test content item',
         creator: '0x1234567890abcdef1234567890abcdef12345678',
         submissionTime: new Date(),
         commitDeadline: new Date(Date.now() + 86400000),
         revealDeadline: new Date(Date.now() + 172800000),
         isActive: true,
         isFinalized: false,
         participantCount: 0,
         winningOption: null
       });
       
       await content.save();
       console.log('Sample content created');
       
       // Create sample supported tokens
       const tokens = [
         {
           tokenType: 0,
           name: 'Bitcoin',
           symbol: 'BTC',
           tokenAddress: '0x0000000000000000000000000000000000000000',
           decimals: 8,
           isActive: true,
           currentPriceUSD: '30000.00'
         },
         {
           tokenType: 1,
           name: 'Ethereum',
           symbol: 'ETH',
           tokenAddress: '0x0000000000000000000000000000000000000000',
           decimals: 18,
           isActive: true,
           currentPriceUSD: '2000.00'
         }
       ];
       
       await SupportedToken.insertMany(tokens);
       console.log('Sample tokens created');
       
       console.log('Database seeded successfully');
     } catch (error) {
       console.error('Error seeding database:', error);
     } finally {
       await mongoose.disconnect();
       console.log('Disconnected from MongoDB');
     }
   }

   seedDatabase();
   ```

   Run the script:
   ```
   node seed-db.js
   ```

4. **Refresh MongoDB Compass** to see the new data

## Troubleshooting

If you don't see your database or collections:

1. **Check MongoDB Service**
   Make sure MongoDB is running:
   ```
   sudo systemctl status mongodb
   ```
   If not running:
   ```
   sudo systemctl start mongodb
   ```

2. **Check Connection String**
   Ensure your `.env` file has:
   ```
   MONGODB_URI=mongodb://localhost:27017/proofchain
   ```

3. **Check Application Logs**
   Look for any database connection errors in your application logs.

4. **Manual Collection Creation**
   You can manually create collections in MongoDB Compass by clicking the "+" button next to the database name.
