# ProofChain Frontend

This is the frontend application for the ProofChain decentralized content verification system.

## Features

- Connect to Ethereum wallets (MetaMask, WalletConnect, etc.)
- Submit content for verification
- Participate in the commit-reveal voting scheme
- View content verification status and results

## Technology Stack

- React.js
- TailwindCSS for styling
- Framer Motion for animations
- Ethers.js for blockchain interactions
- React Router for navigation

## Project Structure

```
frontend/
├── public/             # Static files
├── src/
│   ├── assets/         # Images, icons, etc.
│   ├── components/     # Reusable UI components
│   │   ├── ConsensusDashboard/ # Data visualization dashboard
│   │   ├── Layout/     # Page layout components
│   │   ├── ThemeToggle/ # Dark/light theme toggle
│   │   ├── WalletConnect/ # Wallet connection component
│   │   └── VotingInterface/ # Two-state voting interface
│   ├── context/        # React context providers
│   │   ├── ThemeContext.js # Theme state management
│   │   └── WalletContext.js # Wallet state management
│   ├── hooks/          # Custom React hooks
│   │   ├── useTheme.js # Theme hook
│   │   └── useWallet.js # Wallet hook
│   ├── pages/          # Page components
│   │   ├── HomePage.js  # Main page with content listing
│   │   ├── ContentSubmitPage.js # Content submission form
│   │   ├── ContentDetailPage.js # Content details and voting
│   │   └── Profile/    # User profile and voting history
│   ├── utils/          # Utility functions
│   │   ├── api.js      # API client
│   │   ├── blockchain.js # Blockchain interactions
│   │   └── helpers.js  # Helper functions
│   ├── App.js          # Main application component
│   ├── index.js        # Application entry point
│   └── index.css       # Global styles
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # TailwindCSS configuration
└── postcss.config.js   # PostCSS configuration
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example`

3. Start the development server:

```bash
npm start
```

## Environment Variables

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_BLOCKCHAIN_NETWORK`: Ethereum network to connect to
- `REACT_APP_CONTRACT_ADDRESS`: Address of the ProofChain smart contract
- `REACT_APP_IPFS_GATEWAY`: IPFS gateway URL
- `REACT_APP_INFURA_ID`: Infura project ID for blockchain connections
- `REACT_APP_CHAIN_ID`: Ethereum chain ID

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Connecting to the Backend

The frontend connects to the ProofChain backend API for data retrieval and submission. Make sure the backend server is running and the `REACT_APP_API_URL` environment variable is set correctly.

## Blockchain Integration

The application uses ethers.js to interact with the Ethereum blockchain. It connects to the ProofChain smart contract for content submission, voting, and verification.

## Wallet Connection

The WalletConnect component and WalletContext provide wallet connection functionality. The application supports MetaMask and other Ethereum wallets.

## Commit-Reveal Voting System

The application implements a secure two-phase voting system:

1. **Commit Phase**: Users submit an encrypted hash of their vote, confidence level, and a random salt
2. **Reveal Phase**: Users reveal their actual vote and salt, which is verified against the commitment

This prevents front-running and other manipulation attacks by ensuring votes cannot be known until the reveal phase.

## Components

### WalletConnect

Handles wallet connection and displays the current connection status. It shows the connected address when a wallet is connected and provides a button to connect or disconnect.

### VotingInterface

A dynamic component that adapts to the current voting phase:

- **Commit Phase**: Form for submitting encrypted votes with token selection
- **Reveal Phase**: Form for revealing previously committed votes
- **Pending Finalization**: Interface for finalizing voting
- **Finalized**: Display of voting results

### Layout

Provides a consistent layout for all pages with header, navigation, and footer. Includes responsive mobile navigation and theme toggle.

### ConsensusDashboard

Data visualization dashboard that displays:

- Consensus statistics (total votes, participants, confidence, consensus rate)
- Consensus timeline chart showing voting patterns over time
- Token distribution doughnut chart
- Content status breakdown
- Recent activity list

### ThemeToggle

Toggle button for switching between dark and light themes with smooth animations.

## Pages

### HomePage

Displays a list of content items with their status, voting phase, and deadlines. Supports pagination and filtering.

### ContentSubmitPage

Form for submitting new content for verification. Includes fields for title, description, content URL, and voting duration.

### ContentDetailPage

Displays detailed information about a content item and provides the appropriate voting interface based on the current voting phase.

### Profile

User profile page showing:

- User information and reputation level
- Voting statistics (total votes, accuracy, staked amounts)
- Recent activity
- Complete voting history with filtering and sorting

## Theme System

The application supports both light and dark themes:

- Uses TailwindCSS dark mode with class strategy
- Persists theme preference in local storage
- Respects user's system preference on first visit
- Provides smooth transitions between themes
- Includes glass morphism effects and gradients

## Styling & Animations

The application uses a combination of technologies for styling and animations:

- TailwindCSS for utility-based styling
- Framer Motion for animations and transitions
- Custom animations for micro-interactions
- Responsive design for all screen sizes
- Glass morphism effects for cards and modals

## Port Configuration

The frontend development server runs on port 5003 by default to avoid conflicts with the backend server (which runs on port 3000). This configuration is set in the `package.json` file:

```json
"scripts": {
  "start": "PORT=5003 react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
```

## API Configuration

The frontend connects to the backend API running on port 3000. The API base URL is configured in `src/utils/api.js`:

```javascript
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";
```

## Recent Updates

- Fixed API connection issues by updating the API base URL to point to the correct backend port
- Resolved React Router warnings by adding future flags to BrowserRouter:
  ```javascript
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  ```
- Fixed manifest.json to remove references to missing logo files
- Implemented proper port configuration to avoid conflicts between frontend and backend servers
