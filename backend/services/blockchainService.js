const ethers = require("ethers");
const { TOKEN_TYPES, VOTE_OPTIONS } = require("../utils/constants");
const {
  ContentItem,
  CommitInfo,
  RevealInfo,
  UserProfile,
  SupportedToken,
} = require("../models");
const { setCache, getCache, clearCacheByPattern } = require("../utils/redis");

// ABI for the ProofChainMultiTokenVoting contract (abbreviated)
const contractABI = [
  "function submitContent(string calldata ipfsHash, uint256 votingDuration) external returns (uint256 contentId)",
  "function commitMultiTokenVote(uint256 contentId, bytes32 commitHash, uint8 tokenType, uint256 stakeAmount, bytes32[] calldata merkleProof) external payable",
  "function revealMultiTokenVote(uint256 contentId, uint8 vote, uint256 confidence, uint256 salt) external",
  "function finalizeMultiTokenVoting(uint256 contentId) external",
  "function getMultiTokenResults(uint256 contentId) external view returns (bool isFinalized, uint8 winningOption, uint256[3] memory voteDistribution, uint256 totalParticipants, uint256 totalUSDValue, uint256[8] memory tokenBreakdown)",
  "function getTokenPriceUSD(uint8 tokenType) public view returns (uint256)",
  "function convertToUSD(uint8 tokenType, uint256 tokenAmount) public view returns (uint256)",
  "function calculateQuadraticWeightUSD(uint256 usdValue) public pure returns (uint256)",
  "function isVerifiedIdentity(address user, bytes32[] calldata merkleProof) public view returns (bool)",
  "event ContentSubmitted(uint256 indexed contentId, string ipfsHash, uint256 commitDeadline, uint256 revealDeadline, address indexed creator)",
  "event MultiTokenVoteCommitted(uint256 indexed contentId, address indexed voter, uint8 tokenType, uint256 stakeAmount, uint256 usdValue)",
  "event MultiTokenVoteRevealed(uint256 indexed contentId, address indexed voter, uint8 vote, uint256 confidence, uint256 quadraticWeight)",
  "event VotingFinalized(uint256 indexed contentId, uint8 winningOption, uint256 totalParticipants, uint256 totalUSDStaked)",
  "event MultiTokenRewardsDistributed(uint256 indexed contentId, uint256 totalUSDRewards, uint256 winnerCount)",
];

/**
 * Initialize blockchain provider and contract instance
 */
const initializeBlockchain = () => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log(
        "Blockchain connection disabled. Using mock provider and contract."
      );
      return {
        provider: { getBlockNumber: async () => 0 },
        contract: createMockContract(),
      };
    }

    // Use default RPC URL if not provided
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545";
    const contractAddress =
      process.env.CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000";

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    return { provider, contract };
  } catch (error) {
    console.error("Failed to initialize blockchain connection:", error);
    throw error;
  }
};

/**
 * Create a mock contract for testing
 */
const createMockContract = () => {
  return {
    submitContent: async () => ({
      wait: async () => ({
        events: [{ event: "ContentSubmitted", args: { contentId: 1 } }],
      }),
    }),
    commitMultiTokenVote: async () => ({
      wait: async () => ({ transactionHash: "0x123" }),
    }),
    revealMultiTokenVote: async () => ({
      wait: async () => ({ transactionHash: "0x123" }),
    }),
    finalizeMultiTokenVoting: async () => ({
      wait: async () => ({ transactionHash: "0x123" }),
    }),
    getMultiTokenResults: async () => ({
      isFinalized: false,
      winningOption: 0,
      voteDistribution: [0, 0, 0].map((v) => ethers.BigNumber.from(v)),
      totalParticipants: ethers.BigNumber.from(0),
      totalUSDValue: ethers.BigNumber.from(0),
      tokenBreakdown: [0, 0, 0, 0, 0, 0, 0, 0].map((v) =>
        ethers.BigNumber.from(v)
      ),
    }),
    getTokenPriceUSD: async () => ethers.BigNumber.from(1000000),
    convertToUSD: async () => ethers.BigNumber.from(1000000),
    calculateQuadraticWeightUSD: async () => ethers.BigNumber.from(1000),
    isVerifiedIdentity: async () => true,
    on: (event, callback) => {
      console.log(`Mock listener registered for ${event}`);
    },
  };
};

/**
 * Initialize blockchain event listeners
 */
const initializeEventListeners = async () => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain event listeners disabled.");
      return;
    }

    const { contract } = initializeBlockchain();

    // Listen for ContentSubmitted events
    contract.on(
      "ContentSubmitted",
      async (contentId, ipfsHash, commitDeadline, revealDeadline, event) => {
        console.log(`ContentSubmitted event: Content ID ${contentId}`);

        try {
          const contentIdStr = contentId.toString();
          const existingContent = await ContentItem.findOne({
            contentId: contentIdStr,
          });

          if (!existingContent) {
            const newContent = new ContentItem({
            contentId: contentIdStr,
            ipfsHash,
            commitDeadline: new Date(commitDeadline.toNumber() * 1000),
            revealDeadline: new Date(revealDeadline.toNumber() * 1000),
            title: `Content #${contentIdStr}`,
            creator: event.args.creator,
            transactionHash: event.transactionHash,
          });

            await newContent.save();
            await clearCacheByPattern("content:list:*");
          }
        } catch (error) {
          console.error(
            `Error processing ContentSubmitted event: ${error.message}`
          );
        }
      }
    );

    // Listen for other events (implementation abbreviated)
    contract.on(
      "MultiTokenVoteCommitted",
      async (contentId, voter, tokenType, stakeAmount, usdValue, event) => {
        // Implementation details...
      }
    );

    contract.on(
      "MultiTokenVoteRevealed",
      async (contentId, voter, vote, confidence, quadraticWeight, event) => {
        // Implementation details...
      }
    );

    contract.on(
      "VotingFinalized",
      async (
        contentId,
        winningOption,
        totalParticipants,
        totalUSDStaked,
        event
      ) => {
        // Implementation details...
      }
    );

    console.log("Blockchain event listeners initialized");
  } catch (error) {
    console.error("Failed to initialize blockchain event listeners:", error);
    throw error;
  }
};

/**
 * Submit content to the blockchain
 */
const submitContent = async (ipfsHash, votingDuration, signer) => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock content submission.");
      // Generate a random content ID without using ethers.js
      const contentId = Math.floor(Math.random() * 1000000).toString();
      const transactionHash =
        "0x" +
        Date.now().toString(16) +
        Math.random().toString(16).substring(2, 10);

      console.log(
        `Mock content submission: contentId=${contentId}, transactionHash=${transactionHash}`
      );
      return { contentId, transactionHash };
    }

    const { contract } = initializeBlockchain();
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.submitContent(ipfsHash, votingDuration);
    const receipt = await tx.wait();

    const event = receipt.events.find((e) => e.event === "ContentSubmitted");
    const contentId = event.args.contentId.toString();

    return { contentId, transactionHash: receipt.transactionHash };
  } catch (error) {
    console.error("Failed to submit content:", error);
    throw error;
  }
};



/**
 * Reveal vote on the blockchain
 */
const revealMultiTokenVote = async (
  contentId,
  vote,
  confidence,
  salt,
  signer
) => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock vote reveal.");
      return { transactionHash: "0x" + Date.now().toString() };
    }

    const { contract } = initializeBlockchain();
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.revealMultiTokenVote(
      contentId,
      vote,
      confidence,
      salt
    );
    const receipt = await tx.wait();

    return { transactionHash: receipt.transactionHash };
  } catch (error) {
    console.error("Failed to reveal vote:", error);
    throw error;
  }
};

/**
 * Finalize voting on the blockchain
 */
const finalizeMultiTokenVoting = async (contentId, signer) => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock finalization.");
      return { transactionHash: "0x" + Date.now().toString() };
    }

    const { contract } = initializeBlockchain();
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.finalizeMultiTokenVoting(contentId);
    const receipt = await tx.wait();

    return { transactionHash: receipt.transactionHash };
  } catch (error) {
    console.error("Failed to finalize voting:", error);
    throw error;
  }
};

/**
 * Get multi-token results from the blockchain
 */
const getMultiTokenResults = async (contentId) => {
  try {
    const cacheKey = `content:${contentId}:results`;
    const cachedResults = await getCache(cacheKey);
    if (cachedResults) return cachedResults;

    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock results.");
      const mockResults = {
        isFinalized: false,
        winningOption: 0,
        winningOptionName: "REAL",
        voteDistribution: ["0", "0", "0"],
        totalParticipants: "0",
        totalUSDValue: "0",
        tokenBreakdown: ["0", "0", "0", "0", "0", "0", "0", "0"],
      };
      await setCache(cacheKey, mockResults, 3600);
      return mockResults;
    }

    const { contract } = initializeBlockchain();
    const results = await contract.getMultiTokenResults(contentId);

    const formattedResults = {
      isFinalized: results.isFinalized,
      winningOption: results.winningOption,
      winningOptionName: Object.keys(VOTE_OPTIONS).find(
        (key) => VOTE_OPTIONS[key] === results.winningOption
      ),
      voteDistribution: results.voteDistribution.map((v) => v.toString()),
      totalParticipants: results.totalParticipants.toString(),
      totalUSDValue: results.totalUSDValue.toString(),
      tokenBreakdown: results.tokenBreakdown.map((v) => v.toString()),
    };

    await setCache(cacheKey, formattedResults, 3600);
    return formattedResults;
  } catch (error) {
    console.error(
      `Failed to get multi-token results for content ID ${contentId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get token price from the blockchain
 */
const getTokenPriceUSD = async (tokenType) => {
  try {
    const cacheKey = `token:${tokenType}:price`;
    const cachedPrice = await getCache(cacheKey);
    if (cachedPrice) return cachedPrice;

    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock token price.");
      const mockPrice = "1000000"; // $10.00 with 8 decimal places
      await setCache(cacheKey, mockPrice, 300);
      return mockPrice;
    }

    const { contract } = initializeBlockchain();
    const price = await contract.getTokenPriceUSD(tokenType);
    const priceStr = price.toString();

    await setCache(cacheKey, priceStr, 300);
    return priceStr;
  } catch (error) {
    console.error(
      `Failed to get token price for token type ${tokenType}:`,
      error
    );
    throw error;
  }
};

/**
 * Other utility functions
 */
const convertToUSD = async (tokenType, tokenAmount) => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock USD conversion.");
      return tokenAmount; // Simple 1:1 conversion for testing
    }

    const { contract } = initializeBlockchain();
    const usdValue = await contract.convertToUSD(tokenType, tokenAmount);
    return usdValue.toString();
  } catch (error) {
    console.error(`Failed to convert token amount to USD:`, error);
    throw error;
  }
};

const calculateQuadraticWeightUSD = async (usdValue) => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock quadratic weight.");
      return Math.floor(Math.sqrt(Number(usdValue))).toString();
    }

    const { contract } = initializeBlockchain();
    const weight = await contract.calculateQuadraticWeightUSD(usdValue);
    return weight.toString();
  } catch (error) {
    console.error(`Failed to calculate quadratic weight:`, error);
    throw error;
  }
};

const isVerifiedIdentity = async (address, merkleProof) => {
  try {
    // Check if blockchain is disabled
    if (process.env.DISABLE_BLOCKCHAIN === "true") {
      console.log("Blockchain disabled. Returning mock identity verification.");
      return true;
    }

    const { contract } = initializeBlockchain();
    return await contract.isVerifiedIdentity(address, merkleProof);
  } catch (error) {
    console.error(`Failed to verify identity:`, error);
    throw error;
  }
};

module.exports = {
  initializeBlockchain,
  initializeEventListeners,
  submitContent,
  revealMultiTokenVote,
  finalizeMultiTokenVoting,
  getMultiTokenResults,
  getTokenPriceUSD,
  convertToUSD,
  calculateQuadraticWeightUSD,
  isVerifiedIdentity,
};
