# Step-by-Step ProofChain User Guide

## Initial Setup

### Step 1: Start the Backend Server

1. Open a terminal window
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies if not already done:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
5. Verify that you see messages indicating:
   - Server running on port 3000
   - MongoDB connection established
   - Redis connection (if enabled)
   - Blockchain services initialization

### Step 2: Start the Frontend Server

1. Open a new terminal window
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies if not already done:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm start
   ```
5. The frontend will start on port 5003

### Step 3: Deploy Smart Contract (if not already deployed)

1. Open a new terminal window
2. Navigate to the contracts-hardhat directory:
   ```bash
   cd contracts-hardhat
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```
5. In a separate terminal, deploy the contract:
   ```bash
   cd contracts-hardhat
   npx hardhat run scripts/deploy.js --network localhost
   ```
6. Note the deployed contract address for configuration
7. Update the contract address in the backend .env file:
   ```bash
   cd ../backend
   # Edit .env file and replace CONTRACT_ADDRESS with the new address
   # Example: CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```
8. Update the contract address in the frontend .env file:
   ```bash
   cd ../frontend
   # Edit .env file and replace REACT_APP_CONTRACT_ADDRESS with the new address
   # Example: REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```
9. Restart both backend and frontend servers to apply the changes:

   ```bash
   # In backend terminal
   npm restart

   # In frontend terminal
   npm start
   ```

## User Journey

### Step 1: Access the Application

1. Open your web browser
2. Navigate to http://localhost:5003
3. You should see the ProofChain homepage with a list of content items (if any)

### Step 2: Connect Your Wallet

1. Click the "Connect Wallet" button in the top-right corner
2. MetaMask will prompt you to connect
3. Select the account you want to use
4. Approve the connection request
5. Behind the scenes:
   - The application requests access to your Ethereum address
   - The backend creates/retrieves your user profile
   - A JWT token is generated and stored in localStorage
   - The UI updates to show your connected address

### Step 3: Browse Content

1. On the homepage, you'll see content items submitted for verification
2. Each content card shows:
   - Title and description
   - Creator address
   - Submission date
   - Current voting phase (commit, reveal, finalized)
   - Time remaining in the current phase
3. Use the filters above the content list to:
   - Filter by content type (article, image, video, etc.)
   - Filter by voting phase
   - Sort by submission date, popularity, or stake amount
4. Scroll down to load more content items

### Step 4: Submit Content for Verification

1. Click the "Submit New Content" button
2. Fill in the submission form:
   - Title: Enter a descriptive title
   - Description: Provide detailed information about your content
   - Content URL: Enter the URL to the content you want to verify
   - Content Type: Select the appropriate type (article, image, video, etc.)
   - Voting Duration: Select how long the voting period should last (1-30 days)
3. Click "Submit" to initiate the submission process
4. Behind the scenes:
   - The content URL is registered
   - A metadata file is created and stored
   - A transaction is sent to the blockchain to register the content
   - The backend creates a database entry linking to the blockchain record
   - The content enters the commit phase of voting

### Step 5: Participate in Commit Phase Voting

1. Find a content item in the commit phase
2. Click on the content to view its details
3. Click "Vote" to open the voting interface
4. Select your vote option:
   - Real: You believe the content is authentic
   - Fake: You believe the content is fabricated
   - AI-Generated: You believe the content was created by AI
5. Set your confidence level (1-100%)
6. Select the token type you want to stake (ETH, DAI, LINK, etc.)
7. Enter the stake amount (the minimum depends on the token)
8. Click "Commit Vote"
9. Approve the transaction in your wallet
10. Behind the scenes:
    - A cryptographic hash is generated from your vote, confidence, and a random salt
    - This hash is submitted to the blockchain, hiding your actual vote
    - Your tokens are staked and locked until the reveal phase ends
    - The backend stores your commit information securely

### Step 6: Participate in Reveal Phase Voting

1. Once the commit phase ends, the content enters the reveal phase
2. Navigate to a content item in the reveal phase
3. Click on the content to view its details
4. Click "Reveal Vote"
5. The system automatically retrieves your vote details
6. Confirm the reveal transaction in your wallet
7. Behind the scenes:
   - Your original vote, confidence level, and salt are submitted to the blockchain
   - The smart contract verifies that the hash matches your commit
   - Your vote is counted toward the final result
   - If you don't reveal your vote during this phase, you forfeit your stake

### Step 7: Finalization and Results

1. After the reveal phase ends, the content is ready for finalization
2. Navigate to a content item pending finalization
3. Click "Finalize Voting"
4. Approve the transaction in your wallet
5. The final result is determined based on the weighted votes
6. View the verification status and vote distribution
7. Behind the scenes:
   - The smart contract calculates the weighted vote totals
   - Tokens are distributed to winning voters proportional to their stake and confidence
   - The content's status is updated in both the blockchain and the database
   - Events are emitted that update the UI automatically

### Step 8: Check Your Profile and Rewards

1. Click on your address in the header
2. View your profile information:
   - Account information
   - Reputation score
   - Voting history
   - Token balances and rewards
   - Content submissions
3. Your reputation score updates based on your voting history:
   - Increases when you vote with the majority
   - Decreases when you vote against the majority
   - Higher stakes and confidence levels have more impact

## Additional Features

### Toggle Theme

1. Look for the sun/moon icon in the header
2. Click to toggle between light and dark modes
3. Your preference will be saved for future visits

### View Consensus Dashboard

1. Navigate to the Dashboard section
2. View visualizations of:
   - Consensus timeline showing voting patterns
   - Token distribution across different token types
   - Content status breakdown
   - Key metrics including total votes and consensus rate

This comprehensive guide covers the entire user journey from setting up the application to participating in the full voting cycle and checking results.
