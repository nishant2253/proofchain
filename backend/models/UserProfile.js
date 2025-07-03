const mongoose = require("mongoose");
const { TOKEN_TYPES } = require("../utils/constants");

/**
 * UserProfile Schema
 * Matches the UserProfile struct in the smart contract
 */
const userProfileSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    reputationScore: {
      type: Number,
      default: 0, // 0-1000 scale as in the contract
      min: 0,
      max: 1000,
    },
    totalUSDStakeHistory: {
      type: String, // Using String to handle large numbers
      default: "0",
    },
    successfulVotes: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastVoteTime: {
      type: Date,
      default: null,
    },
    // Token stake history - maps to tokenStakeHistory in the contract
    tokenStakeHistory: {
      type: Map,
      of: String, // Using String to handle large numbers
      default: () => {
        const initialMap = new Map();
        Object.values(TOKEN_TYPES).forEach((tokenType) => {
          initialMap.set(tokenType.toString(), "0");
        });
        return initialMap;
      },
    },
    // Additional fields for backend use
    username: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    profileImageUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    merkleProof: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for accuracy percentage
userProfileSchema.virtual("accuracyPercentage").get(function () {
  if (this.totalVotes === 0) return 0;
  return (this.successfulVotes / this.totalVotes) * 100;
});

// Method to update reputation score
userProfileSchema.methods.updateReputation = function (isSuccessful) {
  if (isSuccessful) {
    this.reputationScore = Math.min(this.reputationScore + 10, 1000);
  } else {
    this.reputationScore = Math.max(this.reputationScore - 20, 0);
  }
  return this.reputationScore;
};

// Method to update token stake history
userProfileSchema.methods.updateTokenStake = function (tokenType, amount) {
  const currentAmount = BigInt(
    this.tokenStakeHistory.get(tokenType.toString()) || "0"
  );
  const newAmount = (currentAmount + BigInt(amount)).toString();
  this.tokenStakeHistory.set(tokenType.toString(), newAmount);
  return newAmount;
};

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

module.exports = UserProfile;
