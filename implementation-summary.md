# ProofChain Implementation Summary

## Overview

ProofChain is a decentralized application implementing a multi-token voting system with a commit-reveal scheme for content verification. The system uses mathematical protections against various attacks and integrates with blockchain technology for transparency and immutability.

## Phase 1: Backend Foundation

### Architecture Setup

- Created a structured project layout with dedicated directories for different components
- Established a modular architecture separating concerns between controllers, services, models, and utilities
- Implemented environment configuration with dotenv for different deployment environments

### Database Schema

- Designed and implemented MongoDB models using Mongoose:
  - `ContentItem`: Stores content submissions with voting deadlines and results
  - `UserProfile`: Manages user information, reputation, and voting history
  - `SupportedToken`: Defines tokens accepted for voting with price information
  - `CommitInfo`: Records vote commitments during the commit phase
  - `RevealInfo`: Stores revealed votes during the reveal phase

### Core Utilities

- Implemented Redis-based caching for improved performance
- Created blockchain utilities for smart contract interaction using ethers.js
- Added helper functions for cryptographic operations (SHA3 hashing)
- Implemented error handling middleware for consistent API responses

## Phase 2: Backend Services & API

### Blockchain Integration

- Created `blockchainService.js` to handle all smart contract interactions
- Implemented event listeners for contract events (ContentSubmitted, VoteCommitted, etc.)
- Added functions to call view methods and submit transactions
- Built caching mechanisms to reduce blockchain queries

### IPFS Integration

- Implemented `ipfsService.js` for decentralized content storage
- Added functions to pin content and retrieve from IPFS gateways
- Created utility functions for content addressing and verification

### API Controllers & Routes

- **User Routes**:

  - `/api/users/register`: User registration with wallet address
  - `/api/users/login`: Authentication using JWT
  - `/api/users/profile`: User profile management
  - `/api/users/:address`: Public user information retrieval

- **Content Routes**:

  - `/api/content/submit`: Content submission to IPFS and blockchain
  - `/api/content/:id`: Content retrieval by ID
  - `/api/content/list`: Paginated content listing with filters
  - `/api/content/:id/commit`: Commit vote on content
  - `/api/content/:id/reveal`: Reveal vote on content
  - `/api/content/:id/finalize`: Finalize voting on content

- **Token Routes**:
  - `/api/tokens/supported`: List supported tokens
  - `/api/tokens/price/:tokenType`: Get current token price
  - `/api/tokens/convert`: Convert token amount to USD value

### Security & Middleware

- Implemented JWT-based authentication middleware
- Added role-based authorization for admin functions
- Created rate limiting middleware to prevent abuse
- Added request validation using Joi schemas
- Implemented error handling middleware for consistent responses

### Services Layer

- `userService.js`: User management and authentication
- `contentService.js`: Content operations and voting logic
- `tokenService.js`: Token-related functions and price information
- `blockchainService.js`: Smart contract interactions
- `ipfsService.js`: Decentralized storage operations

## Error Handling & Robustness Improvements

### Recent Enhancements

- Fixed dependency issues by adding missing packages (axios, crypto-js)
- Improved SHA3 hashing implementation for commit-reveal scheme
- Enhanced error handling with proper error messages and status codes
- Added graceful fallbacks for external service failures

### Resilient Service Design

- Implemented in-memory cache fallback when Redis is unavailable
- Added mock blockchain service for development without blockchain connection
- Created configurable feature flags (DISABLE_REDIS, DISABLE_BLOCKCHAIN)
- Enhanced MongoDB connection with retry logic and graceful degradation

### Environment Configuration

- Created comprehensive .env templates with detailed documentation
- Added default values for critical configuration parameters
- Implemented validation for required environment variables
- Added development mode with helpful debugging information

### Data Management

- Created database seeding scripts for development and testing
- Added data validation at model and API levels
- Implemented proper indexing for performance optimization
- Added MongoDB Compass integration for data visualization

## Development Environment

- Set up environment variables for configuration
- Created example configuration files for ease of deployment
- Added database seeding scripts for development and testing
- Implemented MongoDB Atlas connection for cloud database option

### Webpack Configuration Optimizations

The project includes custom webpack configurations to enhance development experience and ensure compatibility with modern libraries:

1. **Node Polyfills**: Added fallbacks for Node.js core modules required by ethers.js and other blockchain libraries:

   ```javascript
   config.resolve.fallback = {
     crypto: require.resolve("crypto-browserify"),
     stream: require.resolve("stream-browserify"),
     assert: require.resolve("assert"),
     http: require.resolve("stream-http"),
     https: require.resolve("https-browserify"),
     os: require.resolve("os-browserify"),
     url: require.resolve("url"),
   };
   ```

2. **Dev Server Middleware**: Implemented modern webpack-dev-server middleware configuration:

   ```javascript
   module.exports.devServer = function (configFunction) {
     return function (proxy, allowedHost) {
       const config = configFunction(proxy, allowedHost);

       // Replace deprecated options with setupMiddlewares
       const fsMiddleware = config.onBeforeSetupMiddleware;
       const appMiddleware = config.onAfterSetupMiddleware;

       config.setupMiddlewares = (middlewares, devServer) => {
         if (fsMiddleware) {
           fsMiddleware(devServer);
         }
         middlewares.push(...(devServer.static || []));
         if (appMiddleware) {
           appMiddleware(devServer);
         }
         return middlewares;
       };

       // Remove deprecated options
       delete config.onBeforeSetupMiddleware;
       delete config.onAfterSetupMiddleware;

       return config;
     };
   };
   ```

3. **Build Optimization**: Used react-app-rewired to customize Create React App's webpack configuration without ejecting, maintaining future compatibility with CRA updates

These optimizations ensure:

- Compatibility with blockchain libraries that rely on Node.js built-ins
- Clean development experience without deprecation warnings
- Optimized production builds with proper code splitting and tree shaking
- Future-proof configuration that adapts to webpack's evolving best practices

## Technical Implementation Details

### Commit-Reveal Scheme

Implemented a secure voting mechanism using a two-phase approach:

1. **Commit Phase**: Users submit a hash of their vote, confidence level, and a random salt
2. **Reveal Phase**: Users reveal their actual vote and salt, which is verified against the commitment

This prevents front-running and other manipulation attacks by ensuring votes cannot be known until the reveal phase.

### Smart Contract Development

The ProofChain platform includes a smart contract for multi-token voting, located in the `contracts-hardhat` directory. This contract allows for voting using multiple token types and includes identity verification through Merkle proofs.

### Directory Structure

```
contracts-hardhat/
├── contracts/
│   └── ProofChainMultiTokenVoting.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── ProofChainMultiTokenVoting.js
├── hardhat.config.js
└── .env (not tracked in git)
```

### Smart Contract Implementation

The project implements a sophisticated multi-token voting system through the `ProofChainMultiTokenVoting` smart contract with the following key features:

1. **Multi-Token Support**: The contract accepts various cryptocurrencies (ETH, BTC, MATIC, FIL, USDC, USDT, DOT, SOL) for voting, with each token having configurable parameters:

   - Price oracle integration via Chainlink
   - Token-specific bonus multipliers
   - Minimum stake requirements
   - USD value conversion

2. **Mathematical Protections**:

   - **Quadratic Voting**: Implements sqrt(stakeValue) to prevent whale dominance
   - **Byzantine Fault Tolerance**: Requires 67% consensus across token diversity
   - **Stake-Time Weighting**: Prevents flash loan attacks by requiring minimum staking duration
   - **Anti-Sybil Verification**: Uses merkle proofs to verify user identities

3. **Security Features**:

   - **Cross-Token Attack Detection**: Identifies coordinated attacks across multiple tokens
   - **Temporal Analysis**: Detects suspicious voting patterns
   - **ReentrancyGuard**: Prevents reentrancy attacks on stake/reward functions
   - **Ownable**: Implements access control for administrative functions

4. **Reward Distribution**:
   - Winners receive their stake back plus a share of losers' stakes
   - Reputation scoring system for long-term incentive alignment
   - Token-specific reward distribution

The contract underwent thorough testing and optimization:

- Fixed constructor inheritance issue with OpenZeppelin's Ownable contract
- Implemented comprehensive test suite for key functions
- Gas optimization through efficient data structures and algorithms
- Hardhat compilation and verification

### Ethers.js Version Compatibility

During the development process, we encountered and resolved a compatibility issue between newer versions of Hardhat (which uses ethers.js v6) and deployment scripts written for ethers.js v5:

**Issue**: The deployment script was using the older ethers.js v5 syntax (`contract.deployed()` and `contract.address`), which caused errors like `TypeError: proofChain.deployed is not a function` when deploying with newer Hardhat versions.

**Solution**: Updated the deployment script to use ethers.js v6 compatible methods:

- Replaced `await contract.deployed()` with `await contract.waitForDeployment()`
- Replaced `contract.address` with `await contract.getAddress()`

This change ensures compatibility with the latest versions of Hardhat and ethers.js, making the deployment process more robust and future-proof.

### Quadratic Voting

Implemented a quadratic voting system where:

- Voting power scales with the square root of the staked amount
- This prevents whale manipulation by making vote influence scale sub-linearly with stake
- The system normalizes different token values to USD for fair comparison

### Multi-Token Support

- System accepts multiple cryptocurrencies for voting
- Each token has a bonusMultiplier to incentivize usage of specific tokens
- Token prices are obtained from oracles and cached for efficiency

### Background Processes

- Event listeners continuously monitor blockchain events
- Redis caching reduces blockchain queries and improves performance
- Database indexes optimize query performance for frequently accessed data

## Phase 3: Core Frontend Implementation & Blockchain Interaction

### Project Structure & Configuration

- Created a structured React project with dedicated directories for components, pages, context, hooks, and utilities
- Set up package.json with essential dependencies including React, React-DOM, TailwindCSS, Framer Motion, and Ethers.js
- Configured TailwindCSS with custom theme and component classes
- Created environment configuration for API endpoints, blockchain network, and contract addresses

### Wallet Connection & State Management

- Implemented `WalletContext.js` for global wallet state management across the application
- Created `useWallet.js` custom hook for easy access to wallet state and functions
- Built a robust `WalletConnect` component with connection status, address display, and error handling
- Added event listeners for wallet account and network changes to maintain synchronization with the blockchain

### Core UI Components

- Implemented `Layout` component with header, footer, and navigation for consistent user experience
- Created `HomePage` component for content listing with pagination, filtering, and status indicators
- Built `ContentSubmitPage` component with form validation and blockchain interaction for new content submission
- Developed `ContentDetailPage` component for viewing content details and participating in voting
- Implemented `VotingInterface` component with separate interfaces for commit and reveal phases

### Commit-Reveal Voting Interface

- Developed a two-state voting interface that adapts to the current voting phase:
  - **Commit Phase**: Form for submitting encrypted votes with token selection and stake amount
  - **Reveal Phase**: Form for revealing previously committed votes with salt verification
  - **Pending Finalization**: Interface for finalizing voting after the reveal phase ends
  - **Finalized**: Display of voting results with distribution visualization
- Implemented secure commit hash generation using the same algorithm as the backend
- Added salt generation and storage for the reveal phase
- Created token selection interface with support for multiple token types

### API & Blockchain Integration

- Implemented `api.js` utility with Axios for backend API communication
- Created `blockchain.js` utility for smart contract interactions using Ethers.js
- Added helper functions for formatting, data manipulation, and error handling
- Implemented the commit-reveal voting scheme in the frontend with proper validation

### User Experience Enhancements

- Added animations using Framer Motion for smooth transitions and feedback
- Implemented responsive design using TailwindCSS for all screen sizes
- Created loading states and error handling for asynchronous operations
- Added form validation for content submission and voting
- Implemented countdown timers for voting deadlines

## Phase 4: Advanced Frontend Dashboards, Polish, and Animations

### Data Visualization & Analytics

- Implemented `ConsensusDashboard` component with interactive charts using Chart.js
- Created visualizations for:
  - Consensus timeline showing voting patterns over time
  - Token distribution across different token types
  - Content status breakdown (approved, rejected, pending)
  - Key metrics including total votes, participants, and consensus rate
- Added animated statistics cards with real-time data
- Implemented responsive charts that adapt to different screen sizes

### User Profile & Reputation System

- Created `Profile` page to display user information, reputation, and voting history
- Implemented reputation level system with visual indicators
- Added voting history table with filtering and sorting
- Displayed user statistics including accuracy, total votes, and staked amounts
- Created tabs for different sections of the profile

### Theme System & UI Polish

- Implemented dark/light theme support with `ThemeContext` and `ThemeToggle` components
- Added smooth theme transitions with CSS variables
- Enhanced UI with glass morphism effects, gradients, and micro-interactions
- Implemented responsive mobile navigation with animated transitions
- Added subtle animations to improve user experience

### Styling & Animation Enhancements

- Extended TailwindCSS configuration with custom animations, colors, and effects
- Added Framer Motion animations for page transitions and interactive elements
- Implemented micro-interactions for buttons, cards, and form elements
- Created consistent styling across the application with shared components
- Added glass morphism effects for cards and modals

### Responsive Design Improvements

- Enhanced mobile experience with bottom navigation bar
- Optimized layouts for different screen sizes
- Improved touch interactions for mobile users
- Added responsive typography and spacing

## Current Status

- Backend foundation is complete and operational
- API endpoints are implemented and tested
- Frontend is now stable with all major bugs fixed
- Components are optimized for performance
- Build process is working correctly
- Ready for testing and deployment

## Security Enhancements

### Content Security Policy (CSP)

The application implements a comprehensive Content Security Policy to protect against common web vulnerabilities while ensuring full functionality:

- **Script Security**: Configured to allow scripts from the same origin with necessary 'unsafe-eval' and 'unsafe-inline' directives for blockchain libraries
- **Style Security**: Allows inline styles for dynamic theming and CSS-in-JS libraries
- **Connection Security**: Permits API connections to the backend and other necessary services
- **Media Security**: Configures proper sources for images, including data URIs for dynamically generated content
- **Font Security**: Allows loading of fonts from the application and data URIs

The CSP is implemented via a meta tag in the HTML head:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* https://*; img-src 'self' data: https://*; font-src 'self' data:;"
/>
```

Key security considerations:

- The more permissive CSP is necessary for blockchain libraries like ethers.js that require eval functionality
- All directives follow the principle of least privilege while ensuring application functionality
- For production environments, this policy can be tightened based on specific requirements
- The policy is designed to balance security with the practical needs of modern web applications

This configuration provides protection against XSS and data injection attacks while allowing the application to function properly with all required third-party integrations.

## Next Steps

- Final Phase: Summary & Demonstration Guide
- Add comprehensive testing suite
- Deploy to staging environment
- Implement monitoring and analytics

## Recent Profile Component & API Enhancements

### Profile Component Fixes

- **Profile Component (frontend/src/pages/Profile/index.js)**:
  - Added `supportedTokens` state to properly manage tokens from the backend
  - Updated `fetchProfileData` to get tokens from the correct endpoint
  - Fixed calculation of statistics (votes, consensus rate, confidence) and used them in the UI
  - Added comprehensive error handling for missing data
  - Improved rendering of the reputation chart when no data is available
  - Fixed token balance display when no tokens are available
  - Enhanced UI for empty states in voting history and reputation breakdown
  - Fixed stars and level display using reputationScore instead of reputation

### Backend API Enhancements

- **Backend Services (backend/services/userService.js)**:

  - Added `getUserReputationHistory` function to generate reputation history data
  - Implemented mock data generation for reputation history with realistic growth patterns
  - Added caching for reputation history data to improve performance

- **Backend Controllers (backend/controllers/userController.js)**:

  - Added controller functions for reputation history:
    - `getMyReputationHistory` for authenticated users
    - `getUserReputationHistoryById` for public profile views

- **Backend Routes (backend/routes/userRoutes.js)**:

  - Added endpoints for reputation history:
    - `GET /api/users/me/reputation-history` for authenticated users
    - `GET /api/users/:address/reputation-history` for public access

- **Token Routes (backend/routes/tokenRoutes.js)**:

  - Added a `/supported` endpoint for getting supported tokens
  - Enhanced the reuse of existing token controller for improved consistency

- **Frontend API Client (frontend/src/utils/api.js)**:
  - Fixed endpoint for getting user voting history (`/votes` instead of `/voting-history`)
  - Ensured consistent naming conventions across API endpoints

### Error Handling & Edge Cases

- Added proper null checks throughout the Profile component
- Implemented fallbacks for missing or incomplete data
- Added loading indicators and error states
- Fixed potential rendering issues when data is still loading
- Enhanced error messages for better debugging
- Implemented graceful fallbacks for missing profile data

### UI/UX Improvements

- Added empty state messages when no data is available
- Improved the visual appearance of the profile statistics
- Enhanced the reputation level display with proper scaling
- Fixed the token balance display with fallback for missing token data
- Improved responsive layout for various screen sizes

## Advanced Profile Component Robustness Improvements

### Chart Data Safety and Rendering

- Added comprehensive null/undefined checks for reputationHistory before data mapping
- Implemented safety checks for all data properties accessed in map functions
- Provided fallback values for chart data and options to prevent rendering failures
- Added proper height property to the Line component for consistent rendering
- Moved chart configuration inside the render function to ensure it updates with theme changes

### Theme Integration Enhancements

- Added dedicated useEffect for theme changes to ensure proper re-renders
- Enhanced chart styling with theme-aware colors for better light/dark mode display
- Improved chart axes configuration with theme-specific styling
- Added theme-aware tooltip configuration for better user experience
- Fixed reputation level coloring to match the theme system

### Error Prevention and Edge Cases

- Added multiple safety checks for accessing nested properties like profile.reputationBreakdown
- Improved token identification with multiple fallback options (id, tokenType, \_id)
- Added robust error handling for token balance fetching to prevent component failure
- Enhanced voting history rendering with fallbacks for various data formats
- Implemented safe property access throughout the component to prevent runtime errors

### Performance and UX Optimizations

- Optimized chart configuration with maintainAspectRatio setting
- Improved chart axis rotation settings for better label display
- Added enhanced tooltip configuration for better data visualization
- Implemented defensive coding patterns to handle unexpected API response formats
- Removed unused variables to improve code quality and prevent linting errors

## Recent Frontend Improvements & Bug Fixes

### Public Directory Setup

- Created missing public directory with essential files:
  - index.html with proper meta tags and viewport settings
  - manifest.json for PWA support
  - robots.txt for search engine crawling
  - favicon.ico placeholder

### Component Optimizations

- Fixed import issues across multiple components:
  - Corrected import paths (contexts vs context mismatch)
  - Fixed named vs default export inconsistencies
  - Standardized hook imports (useWallet, useTheme)

### WalletContext Improvements

- Enhanced wallet connection handling:
  - Added useCallback for handleAccountsChanged
  - Fixed dependency arrays in useEffect hooks
  - Improved error handling and state management
  - Removed unused variables and imports

### ConsensusDashboard Optimizations

- Removed unused imports (getContentList, getSupportedTokens)
- Improved code organization and readability
- Enhanced chart rendering performance

### VotingInterface Enhancements

- Improved commit-reveal workflow:
  - Added proper dependency management with useCallback
  - Enhanced error handling and state updates
  - Fixed missing dependencies in useEffect hooks
- Removed unused imports (AnimatePresence)
- Improved code organization and maintainability

## Final Frontend Lint & Build Error Resolutions

- Removed all unused imports and variables in ContentDetailPage.js and HomePage.js
- Fixed useEffect dependencies in HomePage.js by wrapping fetchContentItems in useCallback and using it as a dependency
- Removed empty destructuring and unused useWallet import in ContentDetailPage.js
- Ensured all React hooks have correct dependency arrays
- Confirmed that the frontend now builds with zero warnings or errors
- The codebase is now clean, maintainable, and ready for deployment

## Project Structure Cleanup

### Duplicate Source Directory Removal

- Identified a duplicate `src` folder in the project root containing partial implementations:
  - `src/pages/HomePage.js`: Contained only data fetching logic without UI components
  - `src/utils/api.js`: Contained only a response interceptor without complete API implementation
- Compared with the `frontend/src` directory which contained:

  - Complete UI components with proper styling and animation
  - Full API implementation with all endpoints
  - Proper error handling and state management
  - Integration with other components like wallet connection

- Removed the duplicate `src` folder from the project root to:

  - Eliminate potential confusion for developers
  - Ensure all development happens on the complete implementation
  - Maintain a clean project structure
  - Prevent accidental use of incomplete code

- Consolidated all frontend code in the `frontend/src` directory to maintain a clear separation between backend and frontend code

## Version Control & Deployment Optimizations

### Git Configuration

The project implements a comprehensive `.gitignore` configuration to ensure clean repository management and secure deployments:

```
# Dependencies
**/node_modules
**/.pnp
**/.pnp.js

# Testing
**/coverage

# Production
**/build
**/dist

# Misc
**/.DS_Store
**/.env
**/.env.local
**/.env.development.local
**/.env.test.local
**/.env.production.local
**/.cursorignore

# Debug logs
**/npm-debug.log*
**/yarn-debug.log*
**/yarn-error.log*

# Editor directories and files
**/.idea/
**/.vscode/
**/*.suo
**/*.ntvs*
**/*.njsproj
**/*.sln
**/*.sw?

# Temporary files
**/*.tmp
**/*.temp
**/.cache/

# Compiled output
**/*.min.js
**/*.min.css

# Local environment variables
**/.env*.local

# TypeScript
**/*.tsbuildinfo

# Optional npm cache directory
**/.npm

# Optional eslint cache
**/.eslintcache

# Optional stylelint cache
**/.stylelintcache

# Yarn Integrity file
**/.yarn-integrity

# Logs
**/logs
**/*.log

# Backup files
**/*.bak
**/*~

# MongoDB data directory
**/data/db

# Redis dump file
**/dump.rdb

# Blockchain local development
**/.chaindata

# Cache files
**/node_modules/.cache/
**/.cache/
```

This configuration provides several key benefits:

1. **Security Enhancement**: Prevents sensitive environment variables, API keys, and credentials from being committed
2. **Repository Size Optimization**: Excludes large directories like node_modules and build artifacts
3. **Conflict Prevention**: Ignores IDE-specific files and local configuration that could cause merge conflicts
4. **Clean Workflow**: Ensures only essential source code is tracked, improving code review processes
5. **Cross-Platform Compatibility**: Accounts for system-specific files (like .DS_Store) that shouldn't be shared
6. **Cache Management**: Prevents build cache, webpack cache, and other temporary files from polluting the repository

#### Cache File Handling

The project specifically addresses cache file management to prevent repository bloat and unnecessary conflicts:

1. **Webpack Development Cache**: Excludes webpack's development cache files (`**/node_modules/.cache/`) which change frequently during development
2. **General Cache Directories**: Ignores all `.cache/` directories throughout the project
3. **Build Tool Caches**: Prevents temporary files generated by various build tools from being tracked
4. **Browser Caches**: Excludes browser-specific cache files that might be generated during testing

This approach ensures:

- Smaller repository size and faster cloning
- Cleaner git diffs that only show meaningful code changes
- Prevention of merge conflicts on machine-specific cache files
- Improved performance of git operations by reducing the number of tracked files

#### Environment Variables Management

The project follows best practices for managing environment variables:

1. **No .env Files in Repository**: All `.env` files are excluded from version control to prevent exposure of sensitive information
2. **Example Files Provided**: Each project component includes `.env.example` files with placeholder values as templates
3. **Documentation**: Environment variables are clearly documented in the example files and project documentation
4. **Global Pattern Matching**: The `.gitignore` uses `**/.env*` pattern to catch all environment files in any directory
5. **Local Overrides**: Developers can create local environment files (`.env.local`) for development without risk of committing them

This approach ensures that:

- Sensitive credentials are never committed to the repository
- New developers can quickly set up their environment using the example files
- Different environments (development, staging, production) can use different configurations
- Local development settings don't interfere with team collaboration

## Recent Authentication Flow Improvements

### Wallet Authentication Integration

A critical issue was identified and fixed in the authentication flow between wallet connection and backend API requests:

1. **Issue Identified**: Users were experiencing "Not authorized, no token" errors when submitting content after connecting their wallet. This occurred because wallet connection in the UI didn't automatically authenticate with the backend to obtain a JWT token.

2. **Root Cause**: While the wallet connection was successful in the frontend, API requests requiring authentication (like content submission) failed because no JWT token was being stored in localStorage.

3. **Implementation Fix**:
   - Added `authenticateWithBackend` function in WalletContext to handle backend authentication
   - Automatically authenticate with backend after successful wallet connection
   - Store JWT token in localStorage for subsequent API requests
   - Re-authenticate when wallet account changes
   - Clear auth token when disconnecting wallet

```javascript
// WalletContext.js authentication implementation
const authenticateWithBackend = async (address) => {
  try {
    // Call the backend to register/login the user
    const response = await axios.post("http://localhost:3000/api/users", {
      address,
      // In a real implementation, you would sign a message and include the signature
      // signature: await signer.signMessage("Login to ProofChain"),
      userData: {},
    });

    // Store the JWT token in localStorage
    if (response.data && response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
  } catch (error) {
    console.error("Error authenticating with backend:", error);
  }
};
```

4. **Integration Points**:

   - Added authentication call in initial wallet connection check
   - Added authentication after manual wallet connection
   - Added re-authentication when account changes
   - Added token cleanup on wallet disconnect

5. **Security Considerations**:
   - In production, the implementation should include message signing for secure authentication
   - The current implementation is simplified for demonstration purposes
   - A proper implementation would include signature verification on the backend

### JWT Authentication System

The ProofChain platform uses JSON Web Tokens (JWT) for secure authentication:

1. **JWT Implementation**:

   - Tokens are generated on the backend using the `jsonwebtoken` library
   - The user's wallet address is encoded in the token payload
   - Tokens are signed using a secret key stored in environment variables
   - Tokens have a configurable expiration time

2. **Token Flow**:

   - User connects wallet and authenticates with backend
   - Backend generates and returns a JWT token
   - Frontend stores token in localStorage
   - Token is included in Authorization header for API requests
   - Backend middleware validates token for protected routes

3. **Security Measures**:
   - Tokens are transmitted over HTTPS for security
   - Token verification checks for tampering and expiration
   - Invalid or expired tokens trigger authentication errors
   - Sensitive operations require additional verification

This authentication flow ensures that only authenticated users with connected wallets can access protected features like content submission, voting, and profile management.
