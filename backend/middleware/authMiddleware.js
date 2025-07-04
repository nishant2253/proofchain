const jwt = require("jsonwebtoken");
const { UserProfile } = require("../models");

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await UserProfile.findOne({ address: decoded.address });

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
};

/**
 * Verified user middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifiedOnly = (req, res, next) => {
  // In development mode, bypass verification check if BYPASS_VERIFICATION is set
  if (
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_VERIFICATION === "true"
  ) {
    console.log("Development mode: Bypassing identity verification");
    return next();
  }

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (!req.user.isVerified) {
    res.status(403);
    throw new Error("Identity verification required");
  }

  next();
};

module.exports = { protect, verifiedOnly };
