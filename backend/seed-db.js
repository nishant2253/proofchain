const mongoose = require("mongoose");
const { SupportedToken } = require("./models");
const { TOKEN_TYPES } = require("./utils/constants");
require("dotenv").config();

// MongoDB connection URI
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/proofchain";

// Token data for seeding
const tokenData = [
  {
    tokenType: TOKEN_TYPES.BTC,
    tokenAddress: "0x0000000000000000000000000000000000000000", // Mock address
    priceOracle: "0x1111111111111111111111111111111111111111", // Mock oracle
    decimals: 8,
    isActive: true,
    bonusMultiplier: 100, // 10% bonus (1000 = 100%)
    minStakeAmount: "100000", // 0.001 BTC in satoshis
    name: "Bitcoin",
    symbol: "BTC",
    iconUrl: "",
    currentPriceUSD: 30000,
  },
  {
    tokenType: TOKEN_TYPES.ETH,
    tokenAddress: "0x0000000000000000000000000000000000000000", // Native ETH
    priceOracle: "0x2222222222222222222222222222222222222222", // Mock oracle
    decimals: 18,
    isActive: true,
    bonusMultiplier: 110, // 11% bonus
    minStakeAmount: "1000000000000000", // 0.001 ETH in wei
    name: "Ethereum",
    symbol: "ETH",
    iconUrl: "",
    currentPriceUSD: 2000,
  },
  {
    tokenType: TOKEN_TYPES.MATIC,
    tokenAddress: "0x0000000000000000000000000000000000001010", // Polygon MATIC
    priceOracle: "0x3333333333333333333333333333333333333333", // Mock oracle
    decimals: 18,
    isActive: true,
    bonusMultiplier: 120, // 12% bonus
    minStakeAmount: "1000000000000000", // 0.001 MATIC in wei
    name: "Polygon",
    symbol: "MATIC",
    iconUrl: "",
    currentPriceUSD: 1.5,
  },
  {
    tokenType: TOKEN_TYPES.FIL,
    tokenAddress: "0x4444444444444444444444444444444444444444", // Mock FIL address
    priceOracle: "0x4444444444444444444444444444444444444444", // Mock oracle
    decimals: 18,
    isActive: true,
    bonusMultiplier: 130, // 13% bonus
    minStakeAmount: "1000000000000000", // 0.001 FIL in wei
    name: "Filecoin",
    symbol: "FIL",
    iconUrl: "",
    currentPriceUSD: 5,
  },
  {
    tokenType: TOKEN_TYPES.USDC,
    tokenAddress: "0x5555555555555555555555555555555555555555", // Mock USDC address
    priceOracle: "0x5555555555555555555555555555555555555555", // Mock oracle
    decimals: 6,
    isActive: true,
    bonusMultiplier: 90, // 9% bonus
    minStakeAmount: "1000", // 0.001 USDC (1000 = $0.001)
    name: "USD Coin",
    symbol: "USDC",
    iconUrl: "",
    currentPriceUSD: 1,
  },
  {
    tokenType: TOKEN_TYPES.USDT,
    tokenAddress: "0x6666666666666666666666666666666666666666", // Mock USDT address
    priceOracle: "0x6666666666666666666666666666666666666666", // Mock oracle
    decimals: 6,
    isActive: true,
    bonusMultiplier: 90, // 9% bonus
    minStakeAmount: "1000", // 0.001 USDT (1000 = $0.001)
    name: "Tether",
    symbol: "USDT",
    iconUrl: "",
    currentPriceUSD: 1,
  },
  {
    tokenType: TOKEN_TYPES.DOT,
    tokenAddress: "0x7777777777777777777777777777777777777777", // Mock DOT address
    priceOracle: "0x7777777777777777777777777777777777777777", // Mock oracle
    decimals: 10,
    isActive: true,
    bonusMultiplier: 140, // 14% bonus
    minStakeAmount: "10000000", // 0.001 DOT
    name: "Polkadot",
    symbol: "DOT",
    iconUrl: "",
    currentPriceUSD: 8,
  },
  {
    tokenType: TOKEN_TYPES.SOL,
    tokenAddress: "0x8888888888888888888888888888888888888888", // Mock SOL address
    priceOracle: "0x8888888888888888888888888888888888888888", // Mock oracle
    decimals: 9,
    isActive: true,
    bonusMultiplier: 150, // 15% bonus
    minStakeAmount: "1000000", // 0.001 SOL
    name: "Solana",
    symbol: "SOL",
    iconUrl: "",
    currentPriceUSD: 40,
  },
];

// Seed function
const seedTokens = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Check if tokens already exist
    const existingTokenCount = await SupportedToken.countDocuments();
    console.log(`Found ${existingTokenCount} existing tokens`);

    if (existingTokenCount > 0) {
      console.log("Deleting existing tokens...");
      await SupportedToken.deleteMany({});
    }

    // Insert new tokens
    console.log("Inserting tokens...");
    const result = await SupportedToken.insertMany(tokenData);
    console.log(`Successfully inserted ${result.length} tokens`);

    // List the inserted tokens
    const tokens = await SupportedToken.find();
    tokens.forEach((token) => {
      console.log(
        `- ${token.symbol} (${token.name}): $${token.currentPriceUSD}`
      );
    });

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run the seed function
seedTokens();
