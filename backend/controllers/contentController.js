const asyncHandler = require("express-async-handler");
const {
  createContent,
  getContentById,
  getContentList,
  commitVote,
  revealVote,
  getSavedCommitData,
} = require("../services/contentService");
const { finalizeMultiTokenVoting } = require("../services/blockchainService");
const { ethers } = require("ethers");

/**
 * @desc    Create new content
 * @route   POST /api/content
 * @access  Private
 */
const createNewContent = asyncHandler(async (req, res) => {
  const { title, description, contentType, votingDuration, tags } = req.body;

  if (!title || !req.files || !req.files.file) {
    res.status(400);
    throw new Error("Title and file are required");
  }

  // Get file from request
  const file = req.files.file;
  const fileBuffer = file.data;
  const fileName = file.name;

  let wallet;

  // Check if blockchain is disabled
  if (process.env.DISABLE_BLOCKCHAIN === "true") {
    console.log("Blockchain disabled. Using mock wallet.");
    wallet = {
      address: "0x1234567890123456789012345678901234567890",
    };
  } else {
    // Create signer from private key (in a real app, this would be from the frontend wallet)
    // This is just for demo purposes
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL
    );
    wallet = new ethers.Wallet(process.env.DEMO_PRIVATE_KEY, provider);
  }

  const contentData = {
    title,
    description,
    contentType,
    votingDuration: parseInt(votingDuration) || undefined,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
  };

  const content = await createContent(
    contentData,
    fileBuffer,
    fileName,
    wallet
  );

  res.status(201).json(content);
});

/**
 * @desc    Get content by ID
 * @route   GET /api/content/:id
 * @access  Public
 */
const getContent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const content = await getContentById(id);

  if (!content) {
    res.status(404);
    throw new Error("Content not found");
  }

  res.json(content);
});

/**
 * @desc    Get content list with pagination and filtering
 * @route   GET /api/content
 * @access  Public
 */
const listContent = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "submissionTime",
    sortOrder = "desc",
    status,
    creator,
    contentType,
    tags,
  } = req.query;

  // Parse tags if provided
  const parsedTags = tags
    ? tags.split(",").map((tag) => tag.trim())
    : undefined;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder,
    status,
    creator,
    contentType,
    tags: parsedTags,
  };

  const contentList = await getContentList(options);

  res.json(contentList);
});

/**
 * @desc    Commit vote for content
 * @route   POST /api/content/:id/commit
 * @access  Private
 */
const commitVoteForContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vote, confidence, tokenType, stakeAmount, merkleProof } = req.body;

  if (
    vote === undefined ||
    !confidence ||
    !tokenType ||
    !stakeAmount ||
    !merkleProof
  ) {
    res.status(400);
    throw new Error(
      "Vote, confidence, tokenType, stakeAmount, and merkleProof are required"
    );
  }

  // Create signer from private key (in a real app, this would be from the frontend wallet)
  // This is just for demo purposes
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
  );
  const wallet = new ethers.Wallet(process.env.DEMO_PRIVATE_KEY, provider);

  const result = await commitVote(
    id,
    parseInt(vote),
    parseInt(confidence),
    parseInt(tokenType),
    stakeAmount,
    merkleProof,
    wallet
  );

  res.json(result);
});

/**
 * @desc    Reveal vote for content
 * @route   POST /api/content/:id/reveal
 * @access  Private
 */
const revealVoteForContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vote, confidence, salt } = req.body;

  if (vote === undefined || !confidence || !salt) {
    res.status(400);
    throw new Error("Vote, confidence, and salt are required");
  }

  // Create signer from private key (in a real app, this would be from the frontend wallet)
  // This is just for demo purposes
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
  );
  const wallet = new ethers.Wallet(process.env.DEMO_PRIVATE_KEY, provider);

  const result = await revealVote(
    id,
    parseInt(vote),
    parseInt(confidence),
    salt,
    wallet
  );

  res.json(result);
});

/**
 * @desc    Get saved commit data for content
 * @route   GET /api/content/:id/commit
 * @access  Private
 */
const getSavedCommit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const commitData = await getSavedCommitData(id, req.user.address);

  if (!commitData) {
    res.status(404);
    throw new Error("No saved commit found for this content");
  }

  res.json(commitData);
});

/**
 * @desc    Finalize voting for content
 * @route   POST /api/content/:id/finalize
 * @access  Private
 */
const finalizeVoting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Create signer from private key (in a real app, this would be from the frontend wallet)
  // This is just for demo purposes
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
  );
  const wallet = new ethers.Wallet(process.env.DEMO_PRIVATE_KEY, provider);

  const result = await finalizeMultiTokenVoting(id, wallet);

  res.json(result);
});

module.exports = {
  createNewContent,
  getContent,
  listContent,
  commitVoteForContent,
  revealVoteForContent,
  getSavedCommit,
  finalizeVoting,
};
