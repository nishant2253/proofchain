const mongoose = require("mongoose");
const { SupportedToken } = require("./models");
const { getSupportedTokens } = require("./services/tokenService");
require("dotenv").config();

// MongoDB connection URI
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/proofchain";

async function testTokens() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Test direct database query
    const tokensFromDB = await SupportedToken.find();
    console.log("Tokens directly from DB:", tokensFromDB.length);
    tokensFromDB.forEach((token) => {
      console.log(
        `- ${token.symbol} (${token.name}): $${token.currentPriceUSD}`
      );
    });

    // Test service function
    console.log("\nTesting token service:");
    const tokensFromService = await getSupportedTokens();
    console.log(
      "Tokens from service:",
      tokensFromService ? tokensFromService.length : 0
    );
    if (tokensFromService && tokensFromService.length > 0) {
      tokensFromService.forEach((token) => {
        console.log(
          `- ${token.symbol} (${token.name}): $${token.currentPriceUSD}`
        );
      });
    } else {
      console.log("No tokens returned from service");
    }
  } catch (error) {
    console.error("Error testing tokens:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the test function
testTokens();
