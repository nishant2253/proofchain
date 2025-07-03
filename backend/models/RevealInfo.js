const mongoose = require("mongoose");
const { VOTE_OPTIONS, TOKEN_TYPES } = require("../utils/constants");

/**
 * RevealInfo Schema
 * Matches the RevealInfo struct in the smart contract
 */
const revealInfoSchema = new mongoose.Schema(
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
    vote: {
      type: Number,
      enum: Object.values(VOTE_OPTIONS),
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    salt: {
      type: String,
      required: true,
    },
    hasRevealed: {
      type: Boolean,
      default: true,
    },
    quadraticWeight: {
      type: String, // Using String to handle large numbers
      required: true,
    },
    rewardTokenType: {
      type: Number,
      enum: Object.values(TOKEN_TYPES),
      required: true,
    },
    // Additional fields for backend use
    transactionHash: {
      type: String,
      default: "",
    },
    revealTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique reveals per content per voter
revealInfoSchema.index({ contentId: 1, voter: 1 }, { unique: true });

// Virtual for vote option name
revealInfoSchema.virtual("voteOptionName").get(function () {
  return Object.keys(VOTE_OPTIONS).find(
    (key) => VOTE_OPTIONS[key] === this.vote
  );
});

// Virtual for reward token type name
revealInfoSchema.virtual("rewardTokenTypeName").get(function () {
  return Object.keys(TOKEN_TYPES).find(
    (key) => TOKEN_TYPES[key] === this.rewardTokenType
  );
});

// Method to format quadratic weight
revealInfoSchema.methods.getFormattedQuadraticWeight = function () {
  return Number(this.quadraticWeight).toLocaleString();
};

const RevealInfo = mongoose.model("RevealInfo", revealInfoSchema);

module.exports = RevealInfo;
