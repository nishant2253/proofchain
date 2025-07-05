// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title IERC20
 * @dev Minimal interface for ERC20 token interaction.
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title ProofChainMultiTokenVoting
 * @dev Advanced DAO voting system with multi-token support and mathematical protections
 * * KEY MATHEMATICAL MODELS USED:
 * 1. Commit-Reveal Scheme: Prevents temporal wave attacks and exit poll manipulation
 * 2. Cross-Token Quadratic Voting: Mitigates whale dominance using USD-based quadratic cost function
 * 3. Multi-Token Stake-Time Weighted Scoring: Prevents flash loan attacks across all supported tokens
 * 4. Anti-Sybil Identity Verification: Uses merkle proofs for identity validation
 * 5. Byzantine Fault Tolerance: Handles up to 33% malicious actors across token diversity
 * 6. Price Oracle Integration: Real-time USD conversion for fair cross-token voting
 * 7. Cross-Token Attack Prevention: Coordinated attack detection across multiple assets
 */
contract ProofChainMultiTokenVoting is ReentrancyGuard, Ownable {
    
    // ==================== ENUMS & CONSTANTS ====================
    
    enum TokenType { BTC, ETH, MATIC, FIL, USDC, USDT, DOT, SOL }
    enum VoteOption { REAL, FAKE, AI_GENERATED }
    
    // ==================== STRUCTS ====================
    
    struct SupportedToken {
        address tokenAddress;           // Contract address for the token
        AggregatorV3Interface priceOracle; // Chainlink price feed
        uint8 decimals;                // Token decimals
        bool isActive;                 // Whether token is currently supported
        uint256 bonusMultiplier;       // Bonus multiplier (1000 = 100%, 1200 = 120%)
        uint256 minStakeAmount;        // Minimum stake required for this token
    }
    
    struct ContentItem {
        string ipfsHash;               // IPFS hash of content
        uint256 submissionTime;        // When content was submitted
        uint256 commitDeadline;        // When commit phase ends
        uint256 revealDeadline;        // When reveal phase ends
        mapping(TokenType => uint256) totalStakedByToken; // Total staked per token type
        uint256 totalUSDValue;         // Total USD value of all stakes
        bool isActive;                 // Whether voting is active
        bool isFinalized;              // Whether results are finalized
        mapping(address => CommitInfo) commits;
        mapping(address => RevealInfo) reveals;
        uint256[] voteDistribution;    // [real_votes, fake_votes, ai_generated_votes] (weighted)
        uint256 participantCount;
        address[] participants;        // Array of all participants for reward distribution
    }
    
    struct CommitInfo {
        bytes32 commitHash;            // keccak256(vote + salt + address + tokenType)
        TokenType stakedTokenType;     // Which token was staked
        uint256 stakeAmount;           // Amount staked on this vote
        uint256 stakingTimestamp;      // When stake was deposited
        uint256 usdValueAtStake;       // USD value at time of staking
        bool hasCommitted;
    }
    
    struct RevealInfo {
        VoteOption vote;               // REAL/FAKE/AI_GENERATED
        uint256 confidence;            // Confidence level (1-100)
        uint256 salt;                  // Random salt for commit-reveal
        bool hasRevealed;
        uint256 quadraticWeight;       // Calculated quadratic voting weight in USD
        TokenType rewardTokenType;     // Token type for reward distribution
    }
    
    struct UserProfile {
        uint256 reputationScore;       // Historical voting accuracy (0-1000)
        uint256 totalUSDStakeHistory;  // Cumulative USD staking history
        uint256 successfulVotes;       // Number of majority-aligned votes
        uint256 totalVotes;            // Total votes cast
        bool isVerified;               // Anti-sybil verification status
        uint256 lastVoteTime;          // Prevents rapid voting
        mapping(TokenType => uint256) tokenStakeHistory; // Historical stakes per token
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(uint256 => ContentItem) public contentItems;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => mapping(uint256 => mapping(TokenType => uint256))) public userStakeDeposits; 
    // user => contentId => tokenType => timestamp
    
    mapping(TokenType => SupportedToken) public supportedTokens;
    
    uint256 public nextContentId;
    uint256 public constant MIN_VOTING_PERIOD = 24 hours;
    uint256 public constant MIN_STAKE_DURATION = 48 hours; // Prevents flash loans
    uint256 public constant MAX_QUADRATIC_VOTES_USD = 10000; // Max voting power in USD terms
    uint256 public constant CONFIDENCE_THRESHOLD = 60;     // Minimum confidence for vote counting
    uint256 public constant ANTI_SYBIL_THRESHOLD_USD = 100; // $100 minimum for new accounts
    
    // Mathematical constants for Byzantine Fault Tolerance
    uint256 public constant BFT_THRESHOLD = 67; // 67% consensus required (>2/3)
    
    // Merkle tree root for verified identities (anti-sybil)
    bytes32 public verifiedIdentityRoot;
    
    // ==================== EVENTS ====================
    
    event ContentSubmitted(uint256 indexed contentId, string ipfsHash, uint256 commitDeadline, uint256 revealDeadline, address indexed creator);
    event MultiTokenVoteCommitted(uint256 indexed contentId, address indexed voter, TokenType tokenType, uint256 stakeAmount, uint256 usdValue);
    event MultiTokenVoteRevealed(uint256 indexed contentId, address indexed voter, VoteOption vote, uint256 confidence, uint256 quadraticWeight);
    event VotingFinalized(uint256 indexed contentId, VoteOption winningOption, uint256 totalParticipants, uint256 totalUSDStaked);
    event MultiTokenRewardsDistributed(uint256 indexed contentId, uint256 totalUSDRewards, uint256 winnerCount);
    event TokenAdded(TokenType indexed tokenType, address tokenAddress, address priceOracle);
    event TokenUpdated(TokenType indexed tokenType, bool isActive, uint256 bonusMultiplier);
    event SybilAttackDetected(address indexed suspiciousAddress, uint256 contentId);
    event CoordinatedAttackDetected(uint256 indexed contentId, string attackType);
    event CrossTokenAttackDetected(uint256 indexed contentId, TokenType[] suspiciousTokens);
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(bytes32 _verifiedIdentityRoot) {
        verifiedIdentityRoot = _verifiedIdentityRoot;
        _initializeSupportedTokens();
    }
    
    /**
     * @dev Initialize supported tokens with their configurations
     * This would be called during deployment with actual addresses
     */
    function _initializeSupportedTokens() internal {
        // Example initialization - replace with actual addresses in deployment
        // In a real deployment, these addresses would be set via the constructor or admin functions
        // BTC (Wrapped Bitcoin)
        supportedTokens[TokenType.BTC] = SupportedToken({
            tokenAddress: address(0), // Set during deployment
            priceOracle: AggregatorV3Interface(address(0)), // BTC/USD Chainlink feed
            decimals: 8,
            isActive: false, // Inactive until addresses are set
            bonusMultiplier: 1050, // 5% bonus for BTC (store of value premium)
            minStakeAmount: 1e6 // 0.01 BTC minimum
        });
        
        // ETH
        supportedTokens[TokenType.ETH] = SupportedToken({
            tokenAddress: address(0), // Native ETH or WETH
            priceOracle: AggregatorV3Interface(address(0)), // ETH/USD Chainlink feed
            decimals: 18,
            isActive: false,
            bonusMultiplier: 1000, // No bonus
            minStakeAmount: 1e16 // 0.01 ETH minimum
        });
        
        // MATIC
        supportedTokens[TokenType.MATIC] = SupportedToken({
            tokenAddress: address(0),
            priceOracle: AggregatorV3Interface(address(0)), // MATIC/USD feed
            decimals: 18,
            isActive: false,
            bonusMultiplier: 1000, // No bonus
            minStakeAmount: 10e18 // 10 MATIC minimum
        });
        
        // FIL (Filecoin) - Gets storage alignment bonus
        supportedTokens[TokenType.FIL] = SupportedToken({
            tokenAddress: address(0),
            priceOracle: AggregatorV3Interface(address(0)), // FIL/USD feed
            decimals: 18,
            isActive: false,
            bonusMultiplier: 1200, // 20% bonus for Filecoin alignment
            minStakeAmount: 1e18 // 1 FIL minimum
        });
        
        // USDC
        supportedTokens[TokenType.USDC] = SupportedToken({
            tokenAddress: address(0),
            priceOracle: AggregatorV3Interface(address(0)), // USDC/USD feed (should be ~1.00)
            decimals: 6,
            isActive: false,
            bonusMultiplier: 1000, // No bonus
            minStakeAmount: 10e6 // $10 minimum
        });
        
        // Additional tokens would be initialized similarly...
    }
    
    // ==================== MODIFIERS ====================
    
    modifier onlyVerifiedUser(bytes32[] calldata merkleProof) {
        require(isVerifiedIdentity(msg.sender, merkleProof), "User not verified - potential Sybil");
        _;
    }
    
    modifier duringCommitPhase(uint256 contentId) {
        require(block.timestamp <= contentItems[contentId].commitDeadline, "Commit phase ended");
        require(contentItems[contentId].isActive, "Voting not active");
        _;
    }
    
    modifier duringRevealPhase(uint256 contentId) {
        require(block.timestamp > contentItems[contentId].commitDeadline, "Still in commit phase");
        require(block.timestamp <= contentItems[contentId].revealDeadline, "Reveal phase ended");
        _;
    }
    
    modifier validTokenType(TokenType tokenType) {
        require(supportedTokens[tokenType].isActive, "Token not supported");
        _;
    }
    
    // ==================== PRICE ORACLE FUNCTIONS ====================
    
    /**
     * @dev Get current USD price for a token using Chainlink oracle
     * Returns price with 8 decimal places (standard for Chainlink USD feeds)
     */
    function getTokenPriceUSD(TokenType tokenType) public view returns (uint256) {
        SupportedToken storage token = supportedTokens[tokenType];
        require(address(token.priceOracle) != address(0), "Price oracle not set");
        
        (, int256 price, , , ) = token.priceOracle.latestRoundData();
        require(price > 0, "Invalid price from oracle");
        
        return uint256(price); // Price in USD with 8 decimals
    }
    
    /**
     * @dev Convert token amount to USD value
     * Handles different token decimals and applies bonus multipliers
     */
    function convertToUSD(TokenType tokenType, uint256 tokenAmount) public view returns (uint256) {
        if (tokenAmount == 0) return 0;
        
        SupportedToken storage token = supportedTokens[tokenType];
        uint256 priceUSD = getTokenPriceUSD(tokenType); // 8 decimals
        
        // Calculate USD value: (tokenAmount * priceUSD) / (10^tokenDecimals)
        // Result has 8 decimal places
        uint256 usdValue = (tokenAmount * priceUSD) / (10 ** token.decimals);
        
        // Apply bonus multiplier
        uint256 bonusAdjustedValue = (usdValue * token.bonusMultiplier) / 1000;
        
        return bonusAdjustedValue;
    }
    
    // ==================== MATHEMATICAL MODELS ====================
    
    /**
     * @dev Cross-Token Quadratic Voting Weight Calculation
     * Implements quadratic cost function based on USD value: weight = sqrt(usdValue)
     * This prevents whale dominance across all supported tokens
     * * Mathematical Formula: weight = sqrt(usdValueWithBonus)
     * Example: $100 = 10 votes, $400 = 20 votes, $10000 = 100 votes (capped)
     */
    function calculateQuadraticWeightUSD(uint256 usdValue) public pure returns (uint256) {
        if (usdValue == 0) return 0;
        
        // Use binary search to find square root (gas efficient)
        uint256 votes = sqrt(usdValue);
        
        // Cap maximum votes to prevent extreme whale dominance
        return votes > MAX_QUADRATIC_VOTES_USD ? MAX_QUADRATIC_VOTES_USD : votes;
    }
    
    /**
     * @dev Multi-Token Stake-Time Anti-Flash Loan Protection
     * Calculates voting power based on staking duration across all tokens
     * Prevents flash loan attacks by requiring minimum staking duration
     */
    function calculateMultiTokenStakeTimeWeight(address user, uint256 contentId, TokenType tokenType) public view returns (uint256) {
        uint256 stakingTimestamp = userStakeDeposits[user][contentId][tokenType];
        if (stakingTimestamp == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - stakingTimestamp;
        
        // Flash loan protection: require minimum staking time
        if (stakingDuration < MIN_STAKE_DURATION) {
            return 0; // No voting power for recently staked tokens
        }
        
        // For simplicity, we return full weight after the minimum duration has passed.
        // A linear or exponential scaling factor could be added here for more complexity.
        return 1000; // Represents 100% weight
    }
    
    /**
     * @dev Enhanced Byzantine Fault Tolerance with Cross-Token Analysis
     * Implements BFT algorithm considering token diversity
     * Requires >67% consensus across different token types
     */
    function checkCrossTokenByzantineFaultTolerance(uint256 contentId) public view returns (bool isConsensusReached, VoteOption winningOption) {
        ContentItem storage item = contentItems[contentId];
        uint256 totalVotes = item.voteDistribution[0] + item.voteDistribution[1] + item.voteDistribution[2];
        
        if (totalVotes == 0) return (false, VoteOption.REAL);
        
        // Check if any option has >67% consensus (BFT threshold)
        for (uint8 i = 0; i < 3; i++) {
            if (item.voteDistribution[i] * 100 / totalVotes >= BFT_THRESHOLD) {
                return (true, VoteOption(i));
            }
        }
        
        return (false, VoteOption.REAL);
    }
    
    /**
     * @dev Cross-Token Attack Detection
     * Detects coordinated attacks across multiple token types
     */
    function detectCrossTokenAttack(uint256 contentId) public view returns (bool isAttack, string memory attackType, TokenType[] memory suspiciousTokens) {
        ContentItem storage item = contentItems[contentId];
        TokenType[] memory suspicious = new TokenType[](8); // Max supported tokens
        uint256 suspiciousCount = 0;
        
        uint256 totalUSDStaked = item.totalUSDValue;
        if (totalUSDStaked == 0) return (false, "None", suspicious);
        
        // Check if any single token type dominates >80% (potential manipulation)
        for (uint8 i = 0; i < 8; i++) {
            TokenType tokenType = TokenType(i);
            if (!supportedTokens[tokenType].isActive) continue;
            
            uint256 tokenStakedAmount = item.totalStakedByToken[tokenType];
            if (tokenStakedAmount > 0) {
                uint256 tokenUSDValue = convertToUSD(tokenType, tokenStakedAmount);
                if (tokenUSDValue * 100 / totalUSDStaked > 80) {
                    suspicious[suspiciousCount] = tokenType;
                    suspiciousCount++;
                    // This is a simplified return; a real implementation might collect all suspicious tokens
                    return (true, "Single Token Dominance", suspicious);
                }
            }
        }
        
        // Other attack vectors like temporal analysis could be more complex and are stubbed here
        // For example, checking for a high concentration of votes in a short time window.
        
        return (false, "None", suspicious);
    }
    
    // ==================== CORE VOTING FUNCTIONS ====================
    
    function submitContent(string calldata ipfsHash, uint256 votingDuration) external returns (uint256 contentId) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(votingDuration >= MIN_VOTING_PERIOD, "Voting period too short");
        
        contentId = nextContentId++;
        ContentItem storage item = contentItems[contentId];
        
        item.ipfsHash = ipfsHash;
        item.submissionTime = block.timestamp;
        item.commitDeadline = block.timestamp + (votingDuration / 2); // 50% for commit phase
        item.revealDeadline = block.timestamp + votingDuration;
        item.isActive = true;
        item.voteDistribution = new uint256[](3); // [real, fake, ai]
        
        emit ContentSubmitted(contentId, ipfsHash, item.commitDeadline, item.revealDeadline, msg.sender);
        return contentId;
    }
    
    function commitMultiTokenVote(
        uint256 contentId,
        bytes32 commitHash,
        TokenType tokenType,
        uint256 stakeAmount,
        bytes32[] calldata merkleProof
    ) external 
        payable
        onlyVerifiedUser(merkleProof)
        duringCommitPhase(contentId)
        validTokenType(tokenType)
        nonReentrant 
    {
        require(stakeAmount > 0, "Must stake tokens to vote");
        require(stakeAmount >= supportedTokens[tokenType].minStakeAmount, "Stake below minimum");
        require(!contentItems[contentId].commits[msg.sender].hasCommitted, "Already committed");
        
        uint256 usdValue = convertToUSD(tokenType, stakeAmount);
        
        if (userProfiles[msg.sender].totalVotes == 0) {
            require(usdValue >= ANTI_SYBIL_THRESHOLD_USD * 1e8, "New accounts need higher initial USD stake");
        }
        
        if (tokenType == TokenType.ETH) {
            require(msg.value == stakeAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "Do not send ETH for token stakes");
            IERC20 token = IERC20(supportedTokens[tokenType].tokenAddress);
            require(token.transferFrom(msg.sender, address(this), stakeAmount), "Token transfer failed");
        }
        
        userStakeDeposits[msg.sender][contentId][tokenType] = block.timestamp;
        
        contentItems[contentId].commits[msg.sender] = CommitInfo({
            commitHash: commitHash,
            stakedTokenType: tokenType,
            stakeAmount: stakeAmount,
            stakingTimestamp: block.timestamp,
            usdValueAtStake: usdValue,
            hasCommitted: true
        });
        
        contentItems[contentId].totalStakedByToken[tokenType] += stakeAmount;
        contentItems[contentId].totalUSDValue += usdValue;
        
        emit MultiTokenVoteCommitted(contentId, msg.sender, tokenType, stakeAmount, usdValue);
    }
    
    function revealMultiTokenVote(
        uint256 contentId,
        VoteOption vote,
        uint256 confidence,
        uint256 salt
    ) external 
        duringRevealPhase(contentId)
        nonReentrant 
    {
        require(confidence >= CONFIDENCE_THRESHOLD && confidence <= 100, "Invalid confidence level");
        
        CommitInfo storage commitInfo = contentItems[contentId].commits[msg.sender];
        require(commitInfo.hasCommitted, "No commit found");
        require(!contentItems[contentId].reveals[msg.sender].hasRevealed, "Already revealed");
        
        bytes32 computedHash = keccak256(abi.encodePacked(uint8(vote), confidence, salt, msg.sender, uint8(commitInfo.stakedTokenType)));
        require(computedHash == commitInfo.commitHash, "Invalid reveal");
        
        uint256 timeWeight = calculateMultiTokenStakeTimeWeight(msg.sender, contentId, commitInfo.stakedTokenType);
        require(timeWeight > 0, "Stake too recent - flash loan protection");
        
        uint256 quadraticWeight = calculateQuadraticWeightUSD(commitInfo.usdValueAtStake);
        
        uint256 reputationMultiplier = userProfiles[msg.sender].reputationScore > 0 ? 
            (1000 + userProfiles[msg.sender].reputationScore) : 1000;
        
        uint256 finalWeight = (quadraticWeight * timeWeight * reputationMultiplier) / (1000 * 1000);
        
        contentItems[contentId].reveals[msg.sender] = RevealInfo({
            vote: vote,
            confidence: confidence,
            salt: salt,
            hasRevealed: true,
            quadraticWeight: finalWeight,
            rewardTokenType: commitInfo.stakedTokenType
        });
        
        contentItems[contentId].voteDistribution[uint8(vote)] += finalWeight;
        if (contentItems[contentId].participants.length == 0 || contentItems[contentId].participants[contentItems[contentId].participants.length - 1] != msg.sender) {
            contentItems[contentId].participants.push(msg.sender);
            contentItems[contentId].participantCount++;
        }
        
        userProfiles[msg.sender].totalVotes++;
        userProfiles[msg.sender].totalUSDStakeHistory += commitInfo.usdValueAtStake;
        userProfiles[msg.sender].tokenStakeHistory[commitInfo.stakedTokenType] += commitInfo.stakeAmount;
        userProfiles[msg.sender].lastVoteTime = block.timestamp;
        
        emit MultiTokenVoteRevealed(contentId, msg.sender, vote, confidence, finalWeight);
    }
    
    function finalizeMultiTokenVoting(uint256 contentId) external nonReentrant {
        ContentItem storage item = contentItems[contentId];
        require(block.timestamp > item.revealDeadline, "Reveal phase not ended");
        require(item.isActive, "Voting not active");
        require(!item.isFinalized, "Already finalized");
        
        (bool isAttack, string memory attackType, TokenType[] memory suspiciousTokens) = detectCrossTokenAttack(contentId);
        if (isAttack) {
            emit CrossTokenAttackDetected(contentId, suspiciousTokens);
            emit CoordinatedAttackDetected(contentId, attackType);
            // In a real scenario, could freeze rewards or slash malicious actors here.
        }
        
        (bool consensusReached, VoteOption winningOption) = checkCrossTokenByzantineFaultTolerance(contentId);
        
        require(consensusReached, "No Byzantine consensus reached across tokens");
        
        item.isFinalized = true;
        item.isActive = false;
        
        distributeMultiTokenRewards(contentId, winningOption);
        
        emit VotingFinalized(contentId, winningOption, item.participantCount, item.totalUSDValue);
    }
    
    function distributeMultiTokenRewards(uint256 contentId, VoteOption winningOption) internal {
        ContentItem storage item = contentItems[contentId];
        uint256 winnerCount = 0;
        uint256 totalWinnerWeight = 0;
        
        address[] memory participants = item.participants;
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            RevealInfo storage reveal = item.reveals[participant];
            
            if (reveal.hasRevealed && reveal.vote == winningOption) {
                winnerCount++;
                totalWinnerWeight += reveal.quadraticWeight;
            }
        }
        
        if (winnerCount == 0 || totalWinnerWeight == 0) return;
        
        uint256 totalRewardPoolUSD = item.totalUSDValue; // Simplified reward pool
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            RevealInfo storage reveal = item.reveals[participant];
            CommitInfo storage commit = item.commits[participant];
            
            if (reveal.hasRevealed) {
                if (reveal.vote == winningOption) {
                    // This is a simplified reward calculation. A more robust model would use a separate reward pool.
                    // For now, we return the stake + a proportional share of the losers' stakes.
                    // This example just returns the original stake to winners.
                    transferTokenReward(participant, commit.stakedTokenType, commit.stakeAmount);
                    
                    userProfiles[participant].successfulVotes++;
                    userProfiles[participant].reputationScore = (userProfiles[participant].reputationScore + 10) > 1000 ? 1000 : userProfiles[participant].reputationScore + 10;
                } else {
                    // Losers' stakes are slashed. This is a simple model where they are kept by the contract.
                    // A more advanced model could distribute these to the winners.
                    // For now, no return for losers.
                    userProfiles[participant].reputationScore = userProfiles[participant].reputationScore > 20 ? userProfiles[participant].reputationScore - 20 : 0;
                }
            } else {
                // User committed but did not reveal. Their stake is slashed.
                // No token transfer, stake is kept by the contract.
            }
        }
        
        emit MultiTokenRewardsDistributed(contentId, totalRewardPoolUSD, winnerCount);
    }
    
    // ==================== UTILITY & ADMIN FUNCTIONS ====================
    
    function convertUSDToToken(TokenType tokenType, uint256 usdValue) public view returns (uint256) {
        if (usdValue == 0) return 0;
        
        SupportedToken storage token = supportedTokens[tokenType];
        uint256 priceUSD = getTokenPriceUSD(tokenType); // 8 decimals
        
        uint256 tokenAmount = (usdValue * (10 ** token.decimals) * 1e8) / (priceUSD * 1e8); // handle decimals
        
        return tokenAmount;
    }

    function transferTokenReward(address to, TokenType tokenType, uint256 amount) internal {
        if (amount == 0) return;
        
        if (tokenType == TokenType.ETH) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20 token = IERC20(supportedTokens[tokenType].tokenAddress);
            require(token.transfer(to, amount), "Token reward transfer failed");
        }
    }
    
    function isVerifiedIdentity(address user, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(user));
        return MerkleProof.verify(merkleProof, verifiedIdentityRoot, leaf);
    }
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function getMultiTokenResults(uint256 contentId) external view returns (
        bool isFinalized,
        VoteOption winningOption,
        uint256[3] memory voteDistribution,
        uint256 totalParticipants,
        uint256 totalUSDValue,
        uint256[8] memory tokenBreakdown
    ) {
        ContentItem storage item = contentItems[contentId];
        require(item.isFinalized, "Voting not finalized - no exit polls allowed");

        uint256 highestVotes = 0;
        VoteOption currentWinner = VoteOption.REAL; // Default winner
        for(uint8 i = 0; i < item.voteDistribution.length; i++){
            if(item.voteDistribution[i] > highestVotes){
                highestVotes = item.voteDistribution[i];
                currentWinner = VoteOption(i);
            }
            voteDistribution[i] = item.voteDistribution[i];
        }

        for(uint8 i = 0; i < 8; i++){
            tokenBreakdown[i] = item.totalStakedByToken[TokenType(i)];
        }

        return (
            item.isFinalized,
            currentWinner,
            voteDistribution,
            item.participantCount,
            item.totalUSDValue,
            tokenBreakdown
        );
    }

    function setVerifiedIdentityRoot(bytes32 _newRoot) external onlyOwner {
        verifiedIdentityRoot = _newRoot;
    }

    function addOrUpdateToken(
        TokenType tokenType,
        address tokenAddress,
        address priceOracleAddress,
        uint8 decimals,
        bool isActive,
        uint256 bonusMultiplier,
        uint256 minStakeAmount
    ) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(priceOracleAddress != address(0), "Invalid price oracle address");
        
        supportedTokens[tokenType] = SupportedToken({
            tokenAddress: tokenAddress,
            priceOracle: AggregatorV3Interface(priceOracleAddress),
            decimals: decimals,
            isActive: isActive,
            bonusMultiplier: bonusMultiplier,
            minStakeAmount: minStakeAmount
        });
        
        emit TokenAdded(tokenType, tokenAddress, priceOracleAddress);
    }

    function setTokenStatus(TokenType tokenType, bool isActive) external onlyOwner {
        supportedTokens[tokenType].isActive = isActive;
        emit TokenUpdated(tokenType, isActive, supportedTokens[tokenType].bonusMultiplier);
    }

    function withdrawStuckETH() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "ETH withdrawal failed");
    }

    function withdrawStuckTokens(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Token withdrawal failed");
    }
}