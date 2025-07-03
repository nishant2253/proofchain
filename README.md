# ProofChain

ProofChain is a decentralized application for content verification using a secure multi-token voting system with a commit-reveal scheme. It enables community-based consensus on the authenticity of digital content while protecting against various manipulation attacks.

## 🌟 Features

- **Secure Two-Phase Voting**: Commit-reveal scheme to prevent front-running and vote manipulation
- **Multi-Token Support**: Stake various cryptocurrencies to participate in voting
- **Quadratic Voting**: Prevents whale manipulation by scaling voting power sub-linearly with stake
- **Decentralized Storage**: Content storage on IPFS for censorship resistance
- **Reputation System**: User reputation scores based on voting history and consensus alignment
- **Interactive Dashboards**: Data visualization of consensus progress and token distribution
- **Responsive Design**: Optimized for both desktop and mobile devices with dark/light theme support

## 🏗️ Architecture

The project consists of two main components:

### Backend (Node.js/Express/MongoDB)

- RESTful API for content, user, and voting operations
- MongoDB database with Mongoose for data modeling
- Redis caching for improved performance
- Blockchain integration with Ethers.js
- IPFS integration for decentralized content storage

### Frontend (React/TailwindCSS)

- React.js application with component-based architecture
- TailwindCSS for responsive styling
- Framer Motion for smooth animations and transitions
- Chart.js for data visualization
- Ethers.js for blockchain interactions
- Context API for global state management

## 🔧 Tech Stack

- **Backend**: Node.js, Express, MongoDB, Redis, Ethers.js
- **Frontend**: React.js, TailwindCSS, Framer Motion, Chart.js
- **Blockchain**: Ethereum (or compatible EVM chains)
- **Storage**: IPFS for decentralized content storage
- **Authentication**: JWT with wallet signature verification

## 📁 Project Structure

```
proofchain/
├── backend/           # Backend server
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Custom middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── frontend/          # Frontend application
│   ├── public/        # Static files
│   └── src/
│       ├── assets/    # Images, icons, etc.
│       ├── components/# UI components
│       ├── context/   # React context providers
│       ├── hooks/     # Custom React hooks
│       ├── pages/     # Page components
│       └── utils/     # Utility functions
└── docs/             # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- MongoDB (local or Atlas)
- Redis (optional, for caching)
- Ethereum wallet (MetaMask recommended)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/proofchain.git
cd proofchain
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env` and configure your variables

4. Start the backend server:

```bash
npm run dev
```

5. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

6. Set up frontend environment variables:

   - Copy `.env.example` to `.env` and configure your variables

7. Start the frontend development server:

```bash
npm start
```

8. Access the application at `http://localhost:3000`

## 🔗 Blockchain Integration

ProofChain integrates with Ethereum blockchain through the `ProofChainMultiTokenVoting` smart contract.

### Smart Contract Features

- **Multi-Token Support**: Vote using various cryptocurrencies (ETH, BTC, MATIC, etc.)
- **Commit-Reveal Voting**: Two-phase voting system to prevent manipulation
- **Quadratic Voting**: Prevents whale dominance using square root scaling
- **Byzantine Fault Tolerance**: Requires 67% consensus for decisions
- **Anti-Sybil Protection**: Uses merkle proofs for identity verification

### Contract Setup

1. Deploy the smart contract:

```bash
cd contracts-hardhat
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network <network-name>
```

2. Configure the frontend to connect to the deployed contract:

```
# In frontend/.env
REACT_APP_CONTRACT_ADDRESS=<deployed-contract-address>
REACT_APP_BLOCKCHAIN_NETWORK=<network-name>
```

### Testing the Contract

Run the test suite to verify contract functionality:

```bash
cd contracts-hardhat
npx hardhat test
```

## 🔒 Commit-Reveal Voting System

ProofChain implements a secure two-phase voting system:

1. **Commit Phase**:

   - Users stake tokens and submit a hash of their vote, confidence level, and a random salt
   - The actual vote remains hidden from other participants

2. **Reveal Phase**:

   - Users reveal their actual vote and salt
   - System verifies the revealed vote against the original commitment
   - Prevents manipulation as votes cannot be changed after commitment

3. **Finalization**:
   - Once voting period ends, the consensus is calculated
   - Quadratic weighting is applied based on stake amounts
   - Users who voted with the consensus earn reputation points

## 👤 User Reputation

The reputation system rewards users for:

- Participating in consensus voting
- Aligning with the final consensus outcome
- Submitting content that passes verification
- Consistent participation over time

Higher reputation unlocks features like content submission and verification finalization.

## 🪙 Multi-Token Support

The system supports multiple cryptocurrencies for staking:

- Ethereum (ETH)
- Bitcoin (BTC via wrapped tokens)
- Polygon (MATIC)
- USD Coin (USDC)
- And more configurable tokens

Each token has a configurable bonus multiplier to incentivize usage of specific tokens.

## 📊 Data Visualization

The ConsensusDashboard component provides visualizations for:

- Consensus timeline showing voting patterns over time
- Token distribution across different token types
- Content status breakdown (approved, rejected, pending)
- Key metrics including total votes, participants, and consensus rate

## 🌓 Theme System

The application supports both light and dark themes:

- Uses TailwindCSS dark mode with class strategy
- Persists theme preference in local storage
- Respects user's system preference on first visit
- Provides smooth transitions between themes

## 📱 Responsive Design

The interface is fully responsive with:

- Mobile-optimized navigation
- Flexible layouts for different screen sizes
- Touch-friendly interactions
- Accessible design patterns

## 🧪 Testing

Run tests for the backend:

```bash
cd backend
npm test
```

Run tests for the frontend:

```bash
cd frontend
npm test
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📞 Contact

For questions or support, please contact [nishantgupta1965@gmail.com](mailto:nishantgupta1965@gmail.com).

## 🏁 Project Completion Status

The ProofChain project has successfully completed all planned development phases:

### ✅ Phase 1: Backend Foundation

- Database schema design and implementation
- Core utilities for blockchain interaction
- Error handling and middleware implementation
- Environment configuration

### ✅ Phase 2: Backend Services & API

- Complete API endpoints for users, content, and tokens
- Blockchain integration with smart contract
- IPFS integration for content storage
- Security & authentication implementation
- Services layer with business logic

### ✅ Phase 3: Core Frontend Implementation

- Project structure and configuration
- Wallet connection and blockchain interaction
- Core UI components for all main functionality
- Commit-reveal voting interface implementation
- API integration and data management

### ✅ Phase 4: Advanced Frontend Features

- Interactive data visualization dashboards
- User profile and reputation system
- Theme system with dark/light mode support
- Styling and animation enhancements
- Responsive design for all screen sizes

All core features have been implemented, with recent focus on robustness improvements for the Profile component including:

- Enhanced error handling and null checks
- Chart rendering optimizations for theme changes
- Performance improvements for data visualization
- Better token identification and balance display

The next steps include adding a comprehensive testing suite, deploying to a staging environment, and implementing monitoring and analytics.
