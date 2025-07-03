import { ethers } from "ethers";

// ABI for the ProofChain contract
// This is a simplified ABI for demonstration purposes
// In a real application, you would import the full ABI from a JSON file
const CONTRACT_ABI = [
  // Content management functions
  "function submitContent(string contentHash, uint256 votingDeadline) external returns (uint256)",
  "function getContent(uint256 contentId) external view returns (string, address, uint256, uint256, bool)",

  // Voting functions
  "function commitVote(uint256 contentId, bytes32 commitHash, string tokenType, uint256 amount) external",
  "function revealVote(uint256 contentId, bool vote, uint256 confidence, bytes32 salt) external",
  "function finalizeVoting(uint256 contentId) external",

  // Token functions
  "function getSupportedTokens() external view returns (string[] memory)",
  "function getTokenPrice(string memory tokenType) external view returns (uint256)",

  // Events
  "event ContentSubmitted(uint256 indexed contentId, address indexed submitter, string contentHash)",
  "event VoteCommitted(uint256 indexed contentId, address indexed voter, bytes32 commitHash)",
  "event VoteRevealed(uint256 indexed contentId, address indexed voter, bool vote, uint256 confidence)",
  "event VotingFinalized(uint256 indexed contentId, bool result)",
];

// Get contract address from environment variables
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
console.log("Using contract address:", CONTRACT_ADDRESS);

/**
 * Get contract instance with signer or provider
 * @param {ethers.providers.Web3Provider|ethers.Signer} signerOrProvider - Signer or provider
 * @returns {ethers.Contract} Contract instance
 */
export const getContract = (signerOrProvider) => {
  if (!CONTRACT_ADDRESS) {
    console.error("Contract address not defined in environment variables");
    throw new Error("Contract address not defined in environment variables");
  }

  console.log("Creating contract instance with address:", CONTRACT_ADDRESS);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};

/**
 * Submit content to the blockchain
 * @param {ethers.Signer} signer - Signer for the transaction
 * @param {string} contentHash - IPFS hash of the content
 * @param {number} votingDeadline - Timestamp for voting deadline
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const submitContentToBlockchain = async (
  signer,
  contentHash,
  votingDeadline
) => {
  const contract = getContract(signer);
  const tx = await contract.submitContent(contentHash, votingDeadline);
  return tx;
};

/**
 * Commit vote to the blockchain
 * @param {ethers.Signer} signer - Signer for the transaction
 * @param {number} contentId - Content ID
 * @param {string} commitHash - Hash of vote, confidence, and salt
 * @param {string} tokenType - Token type for voting
 * @param {string} amount - Amount of tokens to stake
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const commitVoteToBlockchain = async (
  signer,
  contentId,
  commitHash,
  tokenType,
  amount
) => {
  const contract = getContract(signer);
  const tx = await contract.commitVote(
    contentId,
    commitHash,
    tokenType,
    amount
  );
  return tx;
};

/**
 * Reveal vote on the blockchain
 * @param {ethers.Signer} signer - Signer for the transaction
 * @param {number} contentId - Content ID
 * @param {boolean} vote - Vote (true/false)
 * @param {number} confidence - Confidence level
 * @param {string} salt - Random salt used in commit
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const revealVoteOnBlockchain = async (
  signer,
  contentId,
  vote,
  confidence,
  salt
) => {
  const contract = getContract(signer);
  const tx = await contract.revealVote(contentId, vote, confidence, salt);
  return tx;
};

/**
 * Finalize voting on the blockchain
 * @param {ethers.Signer} signer - Signer for the transaction
 * @param {number} contentId - Content ID
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const finalizeVotingOnBlockchain = async (signer, contentId) => {
  const contract = getContract(signer);
  const tx = await contract.finalizeVoting(contentId);
  return tx;
};

/**
 * Generate commit hash for voting
 * @param {boolean} vote - Vote (true/false)
 * @param {number} confidence - Confidence level
 * @param {string} salt - Random salt
 * @returns {string} Commit hash
 */
export const generateCommitHash = (vote, confidence, salt) => {
  // Convert vote to uint (0 or 1)
  const voteValue = vote ? 1 : 0;

  // Pack the values and hash them
  const packedData = ethers.utils.solidityPack(
    ["uint8", "uint256", "bytes32"],
    [voteValue, confidence, ethers.utils.id(salt)]
  );

  return ethers.utils.keccak256(packedData);
};

/**
 * Generate a random salt for commit-reveal scheme
 * @returns {string} Random salt
 */
export const generateRandomSalt = () => {
  return ethers.utils.hexlify(ethers.utils.randomBytes(32));
};

/**
 * Listen for contract events
 * @param {ethers.providers.Web3Provider} provider - Provider for listening to events
 * @param {string} eventName - Name of the event to listen for
 * @param {Function} callback - Callback function for event
 * @returns {ethers.providers.EventListener} Event listener
 */
export const listenForEvents = (provider, eventName, callback) => {
  const contract = getContract(provider);
  contract.on(eventName, callback);

  // Return a function to remove the listener
  return () => {
    contract.off(eventName, callback);
  };
};

/**
 * Check if the connected wallet is on the correct network
 * @param {ethers.providers.Web3Provider} provider - Web3 provider
 * @returns {Promise<boolean>} True if on correct network
 */
export const isCorrectNetwork = async (provider) => {
  const targetChainId = parseInt(process.env.REACT_APP_CHAIN_ID || "1337");
  const network = await provider.getNetwork();
  return network.chainId === targetChainId;
};
