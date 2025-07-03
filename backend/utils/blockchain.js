const ethers = require("ethers");
const Web3 = require("web3");

// ABI will be loaded from a JSON file in a real implementation
const contractABI = [];

/**
 * Initialize blockchain provider and contract instance
 */
const initializeBlockchain = () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL
    );
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
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
 * Get token price from Chainlink oracle via contract
 * @param {Number} tokenType - Token type enum value
 * @returns {Promise<String>} - USD price with 8 decimal places
 */
const getTokenPriceUSD = async (tokenType) => {
  try {
    const { contract } = initializeBlockchain();
    const price = await contract.getTokenPriceUSD(tokenType);
    return price.toString();
  } catch (error) {
    console.error(`Failed to get token price for type ${tokenType}:`, error);
    throw error;
  }
};

/**
 * Convert token amount to USD value
 * @param {Number} tokenType - Token type enum value
 * @param {String} tokenAmount - Token amount as string (to handle large numbers)
 * @returns {Promise<String>} - USD value with 8 decimal places
 */
const convertToUSD = async (tokenType, tokenAmount) => {
  try {
    const { contract } = initializeBlockchain();
    const usdValue = await contract.convertToUSD(tokenType, tokenAmount);
    return usdValue.toString();
  } catch (error) {
    console.error(`Failed to convert token to USD:`, error);
    throw error;
  }
};

/**
 * Calculate quadratic voting weight from USD value
 * @param {String} usdValue - USD value as string (to handle large numbers)
 * @returns {Promise<String>} - Quadratic weight
 */
const calculateQuadraticWeightUSD = async (usdValue) => {
  try {
    const { contract } = initializeBlockchain();
    const weight = await contract.calculateQuadraticWeightUSD(usdValue);
    return weight.toString();
  } catch (error) {
    console.error(`Failed to calculate quadratic weight:`, error);
    throw error;
  }
};

/**
 * Verify identity using merkle proof
 * @param {String} address - User's wallet address
 * @param {Array<String>} merkleProof - Merkle proof array
 * @returns {Promise<Boolean>} - Whether the identity is verified
 */
const isVerifiedIdentity = async (address, merkleProof) => {
  try {
    const { contract } = initializeBlockchain();
    return await contract.isVerifiedIdentity(address, merkleProof);
  } catch (error) {
    console.error(`Failed to verify identity:`, error);
    throw error;
  }
};

module.exports = {
  initializeBlockchain,
  getTokenPriceUSD,
  convertToUSD,
  calculateQuadraticWeightUSD,
  isVerifiedIdentity,
};
