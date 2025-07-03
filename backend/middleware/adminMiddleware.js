/**
 * Admin middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const admin = (req, res, next) => {
  // In a real application, this would check if the user has admin role
  // For now, we'll just check if the user address is in the ADMIN_ADDRESSES env var

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const adminAddresses = process.env.ADMIN_ADDRESSES
    ? process.env.ADMIN_ADDRESSES.toLowerCase().split(",")
    : [];

  if (adminAddresses.includes(req.user.address.toLowerCase())) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as admin");
  }
};

module.exports = { admin };
