const jwt = require("jsonwebtoken");
const {
  UserProfile,
  CommitInfo,
  RevealInfo,
  ContentItem,
} = require("../models");
const { isVerifiedIdentity } = require("./blockchainService");
const { setCache, getCache, clearCacheByPattern } = require("../utils/redis");

/**
 * Create or update user profile
 * @param {String} address - User's wallet address
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} - Updated user profile
 */
const createOrUpdateUser = async (address, userData = {}) => {
  try {
    // Normalize address to lowercase
    address = address.toLowerCase();

    // Find existing user or create new one
    let user = await UserProfile.findOne({ address });

    if (!user) {
      // Create new user
      user = new UserProfile({
        address,
        ...userData,
      });

      console.log(`Creating new user profile for ${address}`);
    } else {
      // Update existing user
      Object.keys(userData).forEach((key) => {
        if (userData[key] !== undefined) {
          user[key] = userData[key];
        }
      });

      console.log(`Updating user profile for ${address}`);
    }

    await user.save();

    // Clear user cache
    await clearCacheByPattern(`user:${address}:*`);

    return user;
  } catch (error) {
    console.error(`Error creating/updating user ${address}:`, error);
    throw error;
  }
};

/**
 * Get user profile by address
 * @param {String} address - User's wallet address
 * @returns {Promise<Object>} - User profile
 */
const getUserProfile = async (address) => {
  try {
    // Normalize address to lowercase
    address = address.toLowerCase();

    // Check cache first
    const cacheKey = `user:${address}:profile`;
    const cachedProfile = await getCache(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }

    // Find user in database
    const user = await UserProfile.findOne({ address });

    if (!user) {
      return null;
    }

    // Cache user profile
    await setCache(cacheKey, user.toObject(), 3600); // Cache for 1 hour

    return user;
  } catch (error) {
    console.error(`Error getting user profile for ${address}:`, error);
    throw error;
  }
};

/**
 * Verify user identity using merkle proof
 * @param {String} address - User's wallet address
 * @param {Array} merkleProof - Merkle proof array
 * @returns {Promise<Boolean>} - Whether the identity is verified
 */
const verifyUserIdentity = async (address, merkleProof) => {
  try {
    // Normalize address to lowercase
    address = address.toLowerCase();

    // Check if user is already verified in database
    const user = await UserProfile.findOne({ address });

    if (user && user.isVerified) {
      return true;
    }

    // Verify identity using blockchain
    const isVerified = await isVerifiedIdentity(address, merkleProof);

    if (isVerified) {
      // Update user profile
      await createOrUpdateUser(address, {
        isVerified: true,
        merkleProof,
      });
    }

    return isVerified;
  } catch (error) {
    console.error(`Error verifying identity for ${address}:`, error);
    throw error;
  }
};

/**
 * Generate JWT token for user
 * @param {String} address - User's wallet address
 * @returns {Promise<String>} - JWT token
 */
const generateToken = async (address) => {
  // Normalize address to lowercase
  address = address.toLowerCase();

  return jwt.sign({ address }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

/**
 * Get user voting history
 * @param {String} address - User's wallet address
 * @returns {Promise<Array>} - Voting history
 */
const getUserVotingHistory = async (address) => {
  try {
    // Normalize address to lowercase
    address = address.toLowerCase();

    // Check cache first
    const cacheKey = `user:${address}:voting_history`;
    const cachedHistory = await getCache(cacheKey);
    if (cachedHistory) {
      return cachedHistory;
    }

    // Find user's commits and reveals
    const commits = await CommitInfo.find({ voter: address });
    const reveals = await RevealInfo.find({ voter: address });

    // Combine commits and reveals
    const votingHistory = [];

    for (const commit of commits) {
      const reveal = reveals.find(
        (r) => r.contentId === commit.contentId && r.voter === commit.voter
      );

      const content = await ContentItem.findOne({
        contentId: commit.contentId,
      });

      votingHistory.push({
        contentId: commit.contentId,
        title: content ? content.title : `Content #${commit.contentId}`,
        commitTimestamp: commit.stakingTimestamp,
        revealTimestamp: reveal ? reveal.revealTimestamp : null,
        tokenType: commit.stakedTokenType,
        stakeAmount: commit.stakeAmount,
        usdValueAtStake: commit.usdValueAtStake,
        vote: reveal ? reveal.vote : null,
        confidence: reveal ? reveal.confidence : null,
        quadraticWeight: reveal ? reveal.quadraticWeight : null,
        isRevealed: !!reveal,
        isFinalized: content ? content.isFinalized : false,
        winningOption: content ? content.winningOption : null,
        wasSuccessful:
          content && reveal ? content.winningOption === reveal.vote : false,
      });
    }

    // Sort by commit timestamp (newest first)
    votingHistory.sort((a, b) => b.commitTimestamp - a.commitTimestamp);

    // Cache voting history
    await setCache(cacheKey, votingHistory, 3600); // Cache for 1 hour

    return votingHistory;
  } catch (error) {
    console.error(`Error getting voting history for ${address}:`, error);
    throw error;
  }
};

/**
 * Get user reputation history
 * @param {String} address - User's wallet address
 * @returns {Promise<Array>} - Reputation history
 */
const getUserReputationHistory = async (address) => {
  try {
    // Normalize address to lowercase
    address = address.toLowerCase();

    // Check cache first
    const cacheKey = `user:${address}:reputation_history`;
    const cachedHistory = await getCache(cacheKey);
    if (cachedHistory) {
      return cachedHistory;
    }

    // For now, generate mock reputation history data
    // In a real implementation, this would come from a database or blockchain events
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const reputationHistory = [];

    // Get the user to see current reputation
    const user = await UserProfile.findOne({ address });
    const currentReputation = user ? user.reputationScore || 0 : 0;

    // Generate 30 days of history data
    for (let i = 30; i >= 0; i--) {
      // Create a gradual growth pattern with some randomness
      const baseScore = Math.max(
        0,
        currentReputation - (i * 30 + Math.floor(Math.random() * 20))
      );

      reputationHistory.push({
        timestamp: now - i * oneDay,
        score: baseScore,
        reason:
          i % 5 === 0
            ? "Successful vote"
            : i % 7 === 0
            ? "Content submission"
            : "Participation",
      });
    }

    // Cache reputation history
    await setCache(cacheKey, reputationHistory, 3600); // Cache for 1 hour

    return reputationHistory;
  } catch (error) {
    console.error(`Error getting reputation history for ${address}:`, error);
    throw error;
  }
};

module.exports = {
  createOrUpdateUser,
  getUserProfile,
  verifyUserIdentity,
  generateToken,
  getUserVotingHistory,
  getUserReputationHistory,
};
