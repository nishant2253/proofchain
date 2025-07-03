const crypto = require("crypto");
const SHA3 = require("crypto-js/sha3");
const { TOKEN_TYPES, VOTE_OPTIONS } = require("./constants");

/**
 * Generate a commit hash matching the smart contract's implementation
 * @param {Number} vote - Vote option enum value
 * @param {Number} confidence - Confidence level (1-100)
 * @param {String} salt - Random salt
 * @param {String} address - User's wallet address
 * @param {Number} tokenType - Token type enum value
 * @returns {String} - Commit hash
 */
const generateCommitHash = (vote, confidence, salt, address, tokenType) => {
  // Match the contract's keccak256(abi.encodePacked(...)) function
  const encodedData =
    vote.toString().padStart(2, "0") +
    confidence.toString().padStart(3, "0") +
    salt +
    address.toLowerCase().substring(2) +
    tokenType.toString().padStart(2, "0");

  // Use SHA3 (keccak256) for hashing
  return "0x" + SHA3(encodedData, { outputLength: 256 }).toString();
};

/**
 * Get token type name from enum value
 * @param {Number} tokenType - Token type enum value
 * @returns {String} - Token type name
 */
const getTokenTypeName = (tokenType) => {
  return (
    Object.keys(TOKEN_TYPES).find((key) => TOKEN_TYPES[key] === tokenType) ||
    "Unknown"
  );
};

/**
 * Get vote option name from enum value
 * @param {Number} voteOption - Vote option enum value
 * @returns {String} - Vote option name
 */
const getVoteOptionName = (voteOption) => {
  return (
    Object.keys(VOTE_OPTIONS).find((key) => VOTE_OPTIONS[key] === voteOption) ||
    "Unknown"
  );
};

/**
 * Format USD value for display
 * @param {String} usdValue - USD value as string (with 8 decimal places)
 * @returns {String} - Formatted USD value
 */
const formatUSDValue = (usdValue) => {
  if (!usdValue) return "$0.00";

  try {
    // Convert from 8 decimal places to 2 decimal places
    const value = BigInt(usdValue) / BigInt(1000000);
    return `$${(Number(value) / 100).toFixed(2)}`;
  } catch (error) {
    console.error("Error formatting USD value:", error);
    return "$0.00";
  }
};

/**
 * Generate a random salt for commit-reveal scheme
 * @returns {String} - Random salt
 */
const generateRandomSalt = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Calculate time remaining in seconds
 * @param {Date} deadline - Deadline timestamp
 * @returns {Number} - Seconds remaining
 */
const calculateTimeRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return Math.max(0, Math.floor((deadlineDate - now) / 1000));
};

/**
 * Format time remaining in human-readable format
 * @param {Number} seconds - Seconds remaining
 * @returns {String} - Formatted time string
 */
const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m ${seconds % 60}s`;
  }
};

module.exports = {
  generateCommitHash,
  getTokenTypeName,
  getVoteOptionName,
  formatUSDValue,
  generateRandomSalt,
  calculateTimeRemaining,
  formatTimeRemaining,
};
