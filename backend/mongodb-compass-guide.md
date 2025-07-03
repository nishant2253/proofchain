# Viewing ProofChain Data in MongoDB Compass

## Data Successfully Seeded

The database has been successfully seeded with sample data:
- 2 Users
- 2 Content Items
- 2 Supported Tokens

## Steps to View Data in MongoDB Compass

1. **Open MongoDB Compass**
   - You already have it open as shown in your screenshot
   - Make sure you're connected to `localhost:27017`

2. **Navigate to the ProofChain Database**
   - In the list of databases on the left side, click on `proofchain`
   - If you don't see it, click the refresh button at the top of the database list

3. **View Collections**
   - You should see the following collections:
     - `userprofiles`
     - `contentitems`
     - `supportedtokens`
     - `commitinfos` (may be empty)
     - `revealinfos` (may be empty)

4. **Explore Collection Data**
   - Click on any collection name to view its documents
   - For example, click on `userprofiles` to see the user data we just created
   - You can use the filter bar at the top to search for specific documents
   - Example filter: `{ "username": "testuser2" }`

5. **View Document Details**
   - Click on any document in the list to see its full details
   - You can expand nested objects by clicking on them

6. **Run Queries**
   - In the filter bar, you can enter MongoDB queries to filter data
   - Example: `{ "isActive": true }` to find active content items
   - Click the "Find" button to execute the query

7. **Refresh Data**
   - If you make changes to the database, click the refresh button to see the updates

## Sample Queries to Try

Here are some queries you can try in MongoDB Compass:

1. **Find all active content items**
   ```json
   { "isActive": true }
   ```

2. **Find content by creator address**
   ```json
   { "creator": "0x9876543210abcdef1234567890abcdef12345678" }
   ```

3. **Find users with reputation above 50**
   ```json
   { "reputation": { "$gt": 50 } }
   ```

4. **Find Bitcoin token**
   ```json
   { "symbol": "BTC" }
   ```

## Adding More Sample Data

If you want to add more data, you can:

1. Run the seed script again:
   ```
   node seed-db.js
   ```
   It will create new content items with unique IDs each time.

2. Or use MongoDB Compass UI:
   - Click on a collection
   - Click "Add Data" button
   - Choose "Insert Document"
   - Enter your JSON document
   - Click "Insert"

## Troubleshooting

If you don't see your data:
1. Make sure you're connected to the right MongoDB instance (`localhost:27017`)
2. Check that the database name is `proofchain`
3. Refresh the collections list
4. Make sure MongoDB service is running on your system
