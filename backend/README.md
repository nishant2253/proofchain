# ProofChain Backend

This is the backend server for the ProofChain decentralized application, which provides a multi-token voting system for content verification.

## Technology Stack

- **Node.js** with Express
- **MongoDB** with Mongoose for database
- **Redis** for caching
- **Ethers.js** for blockchain interactions

## Project Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── .env            # Environment variables (not in git)
├── .env.example    # Example environment variables
├── package.json    # Dependencies
└── server.js       # Entry point
```

## Models

The database models are designed to match the smart contract's data structures:

- **ContentItem**: Content submitted for verification
- **CommitInfo**: Commit phase of voting
- **RevealInfo**: Reveal phase of voting
- **UserProfile**: User information and reputation
- **SupportedToken**: Supported tokens for voting

## API Endpoints

### User Routes

- `POST /api/users` - Register or update user
- `GET /api/users/:address` - Get user profile by address
- `GET /api/users/me` - Get current user profile (authenticated)
- `PUT /api/users/me` - Update user profile (authenticated)
- `POST /api/users/verify` - Verify user identity with merkle proof (authenticated)
- `GET /api/users/me/votes` - Get current user voting history (authenticated)
- `GET /api/users/:address/votes` - Get user voting history by address

### Content Routes

- `GET /api/content` - Get content list with pagination and filtering
- `GET /api/content/:id` - Get content by ID
- `POST /api/content` - Create new content (authenticated)
- `POST /api/content/:id/commit` - Commit vote for content (authenticated, verified)
- `POST /api/content/:id/reveal` - Reveal vote for content (authenticated)
- `GET /api/content/:id/commit` - Get saved commit data (authenticated)
- `POST /api/content/:id/finalize` - Finalize voting for content (authenticated)

### Token Routes

- `GET /api/tokens` - Get all supported tokens
- `GET /api/tokens/:type` - Get token by type
- `POST /api/tokens/convert` - Convert token amount to USD
- `POST /api/tokens/update-prices` - Update token prices (admin)
- `POST /api/tokens/initialize` - Initialize default tokens (admin)

## Services

- **blockchainService**: Interacts with the smart contract
- **contentService**: Handles content-related operations
- **ipfsService**: Manages content storage on IPFS
- **tokenService**: Manages token-related operations
- **userService**: Handles user-related operations

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example`

3. Start the server:

```bash
npm run dev
```

## Blockchain Integration

The backend integrates with the ProofChainMultiTokenVoting smart contract through the following mechanisms:

1. **Event Listeners**: Listens for contract events and updates the database accordingly
2. **Transaction Handling**: Provides methods to submit transactions to the blockchain
3. **View Functions**: Calls contract view functions to get data from the blockchain
4. **Caching**: Caches blockchain data to reduce RPC calls

## Authentication

Authentication is handled through JWT tokens. Users authenticate by providing their wallet address and a signature proving ownership of the address.

## Rate Limiting

The API implements rate limiting to prevent abuse:

- General API: 100 requests per 15 minutes
- Authentication: 10 requests per hour
- Content Submission: 10 submissions per day
- Voting Operations: 20 operations per hour

## Port Configuration

The backend server runs on port 3000 by default. This is configured in the `.env` file:

```
PORT=3000
```

If the `PORT` environment variable is not set, the server will default to port 5000 as specified in `server.js`:

```javascript
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
  // ...
});
```

When running both frontend and backend services, it's important to maintain this port configuration to ensure proper API communication between the services.

## API Base URL

The frontend connects to this backend server using the API base URL configured in the frontend's `src/utils/api.js` file:

```javascript
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";
```

Make sure this URL points to the correct port where your backend server is running.
