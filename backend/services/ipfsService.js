const axios = require("axios");
const FormData = require("form-data");
const { setCache, getCache } = require("../utils/redis");

// IPFS gateway URLs
const IPFS_GATEWAY_URL = "https://ipfs.io/ipfs/";
const IPFS_INFURA_API_URL = "https://ipfs.infura.io:5001/api/v0";

/**
 * Upload content to IPFS
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name
 * @returns {Promise<String>} - IPFS hash
 */
const uploadToIPFS = async (fileBuffer, fileName) => {
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, { filename: fileName });

    // In a real implementation, you would use Infura API key or other IPFS service
    const response = await axios.post(`${IPFS_INFURA_API_URL}/add`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Basic ${Buffer.from(
          process.env.IPFS_PROJECT_ID + ":" + process.env.IPFS_PROJECT_SECRET
        ).toString("base64")}`,
      },
    });

    if (response.data && response.data.Hash) {
      console.log(`Content uploaded to IPFS with hash: ${response.data.Hash}`);
      return response.data.Hash;
    } else {
      throw new Error("Failed to get IPFS hash from response");
    }
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};

/**
 * Upload content metadata to IPFS
 * @param {Object} metadata - Content metadata
 * @returns {Promise<String>} - IPFS hash
 */
const uploadMetadataToIPFS = async (metadata) => {
  try {
    const formData = new FormData();
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    formData.append("file", metadataBuffer, { filename: "metadata.json" });

    const response = await axios.post(`${IPFS_INFURA_API_URL}/add`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Basic ${Buffer.from(
          process.env.IPFS_PROJECT_ID + ":" + process.env.IPFS_PROJECT_SECRET
        ).toString("base64")}`,
      },
    });

    if (response.data && response.data.Hash) {
      console.log(`Metadata uploaded to IPFS with hash: ${response.data.Hash}`);
      return response.data.Hash;
    } else {
      throw new Error("Failed to get IPFS hash from response");
    }
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
  }
};

/**
 * Get content from IPFS
 * @param {String} ipfsHash - IPFS hash
 * @returns {Promise<Object>} - Content data
 */
const getFromIPFS = async (ipfsHash) => {
  try {
    // Check cache first
    const cacheKey = `ipfs:${ipfsHash}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Try multiple gateways in case one fails
    const gateways = [
      `${IPFS_GATEWAY_URL}${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    ];

    let data = null;
    let error = null;

    for (const gateway of gateways) {
      try {
        const response = await axios.get(gateway, { timeout: 10000 });
        data = response.data;
        break;
      } catch (err) {
        error = err;
        console.warn(`Failed to fetch from gateway ${gateway}: ${err.message}`);
        // Continue to next gateway
      }
    }

    if (!data) {
      throw error || new Error("Failed to fetch from all IPFS gateways");
    }

    // Cache the data
    await setCache(cacheKey, data, 86400); // Cache for 24 hours

    return data;
  } catch (error) {
    console.error(`Error getting content from IPFS (${ipfsHash}):`, error);
    throw new Error(`Failed to get content from IPFS: ${error.message}`);
  }
};

/**
 * Pin content to IPFS to ensure persistence
 * @param {String} ipfsHash - IPFS hash
 * @returns {Promise<Boolean>} - Success status
 */
const pinToIPFS = async (ipfsHash) => {
  try {
    // In a real implementation, you would use Infura API key or other IPFS service
    const response = await axios.post(
      `${IPFS_INFURA_API_URL}/pin/add?arg=${ipfsHash}`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.IPFS_PROJECT_ID + ":" + process.env.IPFS_PROJECT_SECRET
          ).toString("base64")}`,
        },
      }
    );

    if (
      response.data &&
      response.data.Pins &&
      response.data.Pins.includes(ipfsHash)
    ) {
      console.log(`Content pinned to IPFS: ${ipfsHash}`);
      return true;
    } else {
      throw new Error("Failed to pin content to IPFS");
    }
  } catch (error) {
    console.error(`Error pinning content to IPFS (${ipfsHash}):`, error);
    return false;
  }
};

/**
 * Create IPFS URL from hash
 * @param {String} ipfsHash - IPFS hash
 * @returns {String} - IPFS URL
 */
const getIPFSUrl = (ipfsHash) => {
  return `${IPFS_GATEWAY_URL}${ipfsHash}`;
};

module.exports = {
  uploadToIPFS,
  uploadMetadataToIPFS,
  getFromIPFS,
  pinToIPFS,
  getIPFSUrl,
};
