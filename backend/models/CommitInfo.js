const mongoose = require("mongoose");
const { TOKEN_TYPES } = require("../utils/constants");

/**
 * CommitInfo Schema
 * Matches the CommitInfo struct in the smart contract
 */
const commitInfoSchema = new mongoose.Schema(
  {
    contentId: {
      type: Number,
      required: true,
    },
    voter: {
      type: String,
      required: true,
      lowercase: true,
    },
    commitHash: {
      type: String,
      required: true,
    },
    stakedTokenType: {
      type: Number,
      enum: Object.values(TOKEN_TYPES),
      required: true,
    },
    stakeAmount: {
      type: String, // Using String to handle large numbers
      required: true,
    },
    stakingTimestamp: {
      type: Date,
      default: Date.now,
    },
    usdValueAtStake: {
      type: String, // Using String to handle large numbers
      required: true,
    },
    hasCommitted: {
      type: Boolean,
      default: true,
    },
    // Additional fields for backend use
    transactionHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique commits per content per voter
commitInfoSchema.index({ contentId: 1, voter: 1 }, { unique: true });

// Virtual for token type name
commitInfoSchema.virtual("tokenTypeName").get(function () {
  return Object.keys(TOKEN_TYPES).find(
    (key) => TOKEN_TYPES[key] === this.stakedTokenType
  );
});

// Method to format USD value
commitInfoSchema.methods.getFormattedUSDValue = function () {
  // Convert from contract's 8 decimal places to 2 decimal places for display
  const usdValue = BigInt(this.usdValueAtStake);
  return (Number(usdValue) / 1e8).toFixed(2);
};

const CommitInfo = mongoose.model("CommitInfo", commitInfoSchema);

module.exports = CommitInfo;
