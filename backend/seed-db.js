const mongoose = require("mongoose");
const { UserProfile, ContentItem, SupportedToken } = require("./models");
require("dotenv").config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create a sample user with a different address to avoid duplicates
    const userAddress = "0x9876543210abcdef1234567890abcdef12345678";

    // Check if user already exists
    const existingUser = await UserProfile.findOne({ address: userAddress });
    if (!existingUser) {
      const user = new UserProfile({
        address: userAddress,
        username: "testuser2",
        email: "test2@example.com",
        reputation: 100,
        joinDate: new Date(),
        lastLoginTime: new Date(),
        totalVotes: 5,
        successfulVotes: 3,
      });

      await user.save();
      console.log("Sample user created");
    } else {
      console.log("User already exists, skipping creation");
    }

    // Create a sample content item with a unique ID
    const contentId = Date.now().toString();

    // Check if content already exists
    const existingContent = await ContentItem.findOne({ contentId });
    if (!existingContent) {
      const content = new ContentItem({
        contentId,
        ipfsHash: `QmXyZ${contentId}`,
        title: "Test Content " + contentId,
        description: "This is a test content item",
        creator: userAddress,
        submissionTime: new Date(),
        commitDeadline: new Date(Date.now() + 86400000),
        revealDeadline: new Date(Date.now() + 172800000),
        isActive: true,
        isFinalized: false,
        participantCount: 0,
        winningOption: null,
      });

      await content.save();
      console.log("Sample content created with ID:", contentId);
    } else {
      console.log("Content with ID already exists, skipping creation");
    }

    // Create sample supported tokens if they don't exist
    const existingBTC = await SupportedToken.findOne({ tokenType: 0 });
    const existingETH = await SupportedToken.findOne({ tokenType: 1 });

    const tokensToCreate = [];

    if (!existingBTC) {
      tokensToCreate.push({
        tokenType: 0,
        name: "Bitcoin",
        symbol: "BTC",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        priceOracle: "0x1111111111111111111111111111111111111111",
        decimals: 8,
        isActive: true,
        currentPriceUSD: "30000.00",
        minStakeAmount: "100000", // 0.001 BTC in satoshis
        bonusMultiplier: "100", // 1.00x multiplier (100 = 100%)
      });
    }

    if (!existingETH) {
      tokensToCreate.push({
        tokenType: 1,
        name: "Ethereum",
        symbol: "ETH",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        priceOracle: "0x2222222222222222222222222222222222222222",
        decimals: 18,
        isActive: true,
        currentPriceUSD: "2000.00",
        minStakeAmount: "1000000000000000", // 0.001 ETH in wei
        bonusMultiplier: "110", // 1.10x multiplier (110 = 110%)
      });
    }

    if (tokensToCreate.length > 0) {
      await SupportedToken.insertMany(tokensToCreate);
      console.log(`${tokensToCreate.length} sample tokens created`);
    } else {
      console.log("Tokens already exist, skipping creation");
    }

    // Display summary of database contents
    const userCount = await UserProfile.countDocuments();
    const contentCount = await ContentItem.countDocuments();
    const tokenCount = await SupportedToken.countDocuments();

    console.log("\nDatabase Summary:");
    console.log(`- Users: ${userCount}`);
    console.log(`- Content Items: ${contentCount}`);
    console.log(`- Supported Tokens: ${tokenCount}`);

    console.log("\nDatabase seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedDatabase();
