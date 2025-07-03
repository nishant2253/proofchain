const asyncHandler = require("express-async-handler");
const {
  createOrUpdateUser,
  getUserProfile,
  verifyUserIdentity,
  generateToken,
  getUserVotingHistory,
  getUserReputationHistory,
} = require("../services/userService");

/**
 * @desc    Register or update user
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { address, signature, userData } = req.body;

  if (!address) {
    res.status(400);
    throw new Error("Address is required");
  }

  // In a real implementation, verify the signature to ensure the user owns the address
  // This is simplified for the demo

  const user = await createOrUpdateUser(address, userData);

  // Generate JWT token
  const token = await generateToken(address);

  res.status(201).json({
    user,
    token,
  });
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/:address
 * @access  Public
 */
const getUserProfileById = asyncHandler(async (req, res) => {
  const { address } = req.params;

  const user = await getUserProfile(address);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user.address);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, bio, profileImageUrl } = req.body;

  const userData = {
    username,
    email,
    bio,
    profileImageUrl,
  };

  const user = await createOrUpdateUser(req.user.address, userData);

  res.json(user);
});

/**
 * @desc    Verify user identity
 * @route   POST /api/users/verify
 * @access  Private
 */
const verifyIdentity = asyncHandler(async (req, res) => {
  const { merkleProof } = req.body;

  if (!merkleProof || !Array.isArray(merkleProof)) {
    res.status(400);
    throw new Error("Valid merkle proof array is required");
  }

  const isVerified = await verifyUserIdentity(req.user.address, merkleProof);

  if (!isVerified) {
    res.status(400);
    throw new Error("Identity verification failed");
  }

  // Get updated user profile
  const user = await getUserProfile(req.user.address);

  res.json({
    success: true,
    isVerified,
    user,
  });
});

/**
 * @desc    Get user voting history
 * @route   GET /api/users/me/votes
 * @access  Private
 */
const getMyVotingHistory = asyncHandler(async (req, res) => {
  const votingHistory = await getUserVotingHistory(req.user.address);

  res.json(votingHistory);
});

/**
 * @desc    Get user voting history by address
 * @route   GET /api/users/:address/votes
 * @access  Public
 */
const getUserVotingHistoryById = asyncHandler(async (req, res) => {
  const { address } = req.params;

  const votingHistory = await getUserVotingHistory(address);

  res.json(votingHistory);
});

/**
 * @desc    Get user reputation history
 * @route   GET /api/users/me/reputation-history
 * @access  Private
 */
const getMyReputationHistory = asyncHandler(async (req, res) => {
  const reputationHistory = await getUserReputationHistory(req.user.address);

  res.json(reputationHistory);
});

/**
 * @desc    Get user reputation history by address
 * @route   GET /api/users/:address/reputation-history
 * @access  Public
 */
const getUserReputationHistoryById = asyncHandler(async (req, res) => {
  const { address } = req.params;

  const reputationHistory = await getUserReputationHistory(address);

  res.json(reputationHistory);
});

module.exports = {
  registerUser,
  getUserProfileById,
  getMyProfile,
  updateProfile,
  verifyIdentity,
  getMyVotingHistory,
  getUserVotingHistoryById,
  getMyReputationHistory,
  getUserReputationHistoryById,
};
