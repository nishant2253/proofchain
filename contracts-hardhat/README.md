# ProofChain Smart Contracts

This directory contains the smart contracts for the ProofChain project, along with the Hardhat development environment for testing and deployment.

## ProofChainMultiTokenVoting Contract

The `ProofChainMultiTokenVoting` contract is the core contract for the ProofChain platform. It implements a multi-token voting system with a commit-reveal scheme for content verification.

### Key Features

- **Commit-Reveal Voting**: Two-phase voting system to prevent manipulation
- **Multi-Token Support**: Stake various cryptocurrencies to participate in voting
- **Quadratic Voting**: Prevents whale dominance using square root scaling
- **Byzantine Fault Tolerance**: Requires 67% consensus for decisions
- **Anti-Sybil Protection**: Uses merkle proofs for identity verification
- **Cross-Token Attack Detection**: Identifies coordinated attacks across tokens

## Development Setup

### Prerequisites

- Node.js v14+ and npm
- Hardhat

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```
# Private key for contract deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# API keys for services
INFURA_API_KEY=your_infura_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Contract configuration
MERKLE_ROOT=0x0000000000000000000000000000000000000000000000000000000000000000

# Gas reporting
REPORT_GAS=true
```

## Testing

Run the test suite:

```bash
npx hardhat test
```

## Deployment

### Local Development

```bash
# Start a local Hardhat node
npx hardhat node

# Deploy to local node
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet/Mainnet Deployment

```bash
# Deploy to Goerli testnet
npx hardhat run scripts/deploy.js --network goerli

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

### Contract Verification

```bash
npx hardhat verify --network <network> <deployed-contract-address> "<merkle-root>"
```

## Contract Usage

After deployment, you'll need to:

1. Configure supported tokens with their price oracles
2. Set up any additional contract parameters
3. Update the frontend environment with the contract address
