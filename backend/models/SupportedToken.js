const mongoose = require("mongoose");
const { TOKEN_TYPES } = require("../utils/constants");

/**
 * SupportedToken Schema
 * Matches the SupportedToken struct in the smart contract
 */
const supportedTokenSchema = new mongoose.Schema(
  {
    tokenType: {
      type: Number,
      enum: Object.values(TOKEN_TYPES),
      required: true,
      unique: true,
    },
    tokenAddress: {
      type: String,
      required: true,
    },
    priceOracle: {
      type: String,
      required: true,
    },
    decimals: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    bonusMultiplier: {
      type: Number,
      default: 1000, // 100% as base (1000 = 100%)
    },
    minStakeAmount: {
      type: String, // Using String to handle large numbers
      required: true,
    },
    // Additional fields for backend use
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    iconUrl: {
      type: String,
      default: "",
    },
    currentPriceUSD: {
      type: Number,
      default: 0,
    },
    lastPriceUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for tokenTypeName
supportedTokenSchema.virtual("tokenTypeName").get(function () {
  return Object.keys(TOKEN_TYPES).find(
    (key) => TOKEN_TYPES[key] === this.tokenType
  );
});

// Method to get formatted price
supportedTokenSchema.methods.getFormattedPrice = function () {
  return this.currentPriceUSD.toFixed(2);
};

const SupportedToken = mongoose.model("SupportedToken", supportedTokenSchema);

module.exports = SupportedToken;
