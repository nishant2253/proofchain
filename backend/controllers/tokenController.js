const asyncHandler = require("express-async-handler");
const {
  getSupportedTokens,
  getTokenByType,
  updateTokenPrices,
  convertTokenToUSD,
  initializeDefaultTokens,
} = require("../services/tokenService");

/**
 * @desc    Get all supported tokens
 * @route   GET /api/tokens
 * @access  Public
 */
const getAllTokens = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;

  const tokens = await getSupportedTokens(activeOnly === "true");

  res.json(tokens);
});

/**
 * @desc    Get token by type
 * @route   GET /api/tokens/:type
 * @access  Public
 */
const getToken = asyncHandler(async (req, res) => {
  const { type } = req.params;

  const token = await getTokenByType(parseInt(type));

  if (!token) {
    res.status(404);
    throw new Error("Token not found");
  }

  res.json(token);
});

/**
 * @desc    Update token prices
 * @route   POST /api/tokens/update-prices
 * @access  Private/Admin
 */
const updatePrices = asyncHandler(async (req, res) => {
  const updatedTokens = await updateTokenPrices();

  res.json({
    success: true,
    updatedTokens,
  });
});

/**
 * @desc    Convert token amount to USD
 * @route   POST /api/tokens/convert
 * @access  Public
 */
const convertToUSD = asyncHandler(async (req, res) => {
  const { tokenType, amount } = req.body;

  if (!tokenType || !amount) {
    res.status(400);
    throw new Error("Token type and amount are required");
  }

  const usdValue = await convertTokenToUSD(parseInt(tokenType), amount);

  res.json({
    tokenType: parseInt(tokenType),
    amount,
    usdValue,
  });
});

/**
 * @desc    Initialize default tokens
 * @route   POST /api/tokens/initialize
 * @access  Private/Admin
 */
const initializeTokens = asyncHandler(async (req, res) => {
  const createdTokens = await initializeDefaultTokens();

  res.json({
    success: true,
    createdTokens,
  });
});

module.exports = {
  getAllTokens,
  getToken,
  updatePrices,
  convertToUSD,
  initializeTokens,
};
