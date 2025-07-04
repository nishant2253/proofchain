const express = require("express");
const {
  createNewContent,
  getContent,
  listContent,
  commitVoteForContent,
  revealVoteForContent,
  getSavedCommit,
  finalizeVoting,
} = require("../controllers/contentController");
const { protect, verifiedOnly } = require("../middleware/authMiddleware");
const {
  contentSubmissionLimiter,
  votingLimiter,
} = require("../middleware/rateLimitMiddleware");
const { validateBody, schemas } = require("../middleware/validationMiddleware");

const router = express.Router();

// Public routes
router.get("/", listContent);
router.get("/:id", getContent);
router.get("/:id/commit", getSavedCommit);

// Protected routes
router.post(
  "/",
  protect,
  contentSubmissionLimiter,
  validateBody(schemas.createContent),
  createNewContent
);
router.post(
  "/:id/commit",
  protect,
  verifiedOnly,
  votingLimiter,
  validateBody(schemas.commitVote),
  commitVoteForContent
);
router.post(
  "/:id/reveal",
  protect,
  votingLimiter,
  validateBody(schemas.revealVote),
  revealVoteForContent
);
router.post("/:id/finalize", protect, finalizeVoting);

module.exports = router;
