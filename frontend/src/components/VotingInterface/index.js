import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import useWallet from "../../hooks/useWallet";
import { getSupportedTokens, submitVote, getVoteStatus } from "../../utils/api";
import { generateCommitHash, generateRandomSalt } from "../../utils/blockchain";
import {
  parseErrorMessage,
  formatDate,
  getVotingPhase,
} from "../../utils/helpers";
import { ethers } from "ethers";

const VotingInterface = ({ content, onVoteComplete }) => {
  const { isConnected, signer, address } = useWallet();

  const [votingPhase, setVotingPhase] = useState("");
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [savedCommit, setSavedCommit] = useState(null);
  const [vote, setVote] = useState(null);
  const [confidence, setConfidence] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingVote, setExistingVote] = useState(null);

  // Commit phase state
  const [commitForm, setCommitForm] = useState({
    vote: "",
    confidence: 5, // Default confidence (1-10)
    tokenType: "0", // Default token type (ETH)
    stakeAmount: "0.01", // Default stake amount
  });

  // Reveal phase state
  const [revealForm, setRevealForm] = useState({
    vote: "",
    confidence: 5,
    salt: "",
  });

  // Load supported tokens on mount
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await getSupportedTokens();
        setSupportedTokens(response);
      } catch (err) {
        console.error("Error fetching supported tokens:", err);
        setError("Failed to load supported tokens");
      }
    };

    fetchTokens();
  }, []);

  // Fetch saved commit data for the current user
  const fetchSavedCommit = useCallback(async () => {
    try {
      // Use getVoteStatus instead since getSavedCommitData is not available
      const response = await getVoteStatus(content._id, address);
      setSavedCommit(response);

      // Pre-fill reveal form with saved data if commit data exists
      if (response && response.commitHash) {
        setRevealForm({
          vote: response.vote ? "true" : "false",
          confidence: response.confidence || 5,
          salt: response.salt || "",
        });
      }
    } catch (err) {
      console.log("No saved commit found or error fetching commit data");
      // Not setting error state here as it's normal for a user to not have a saved commit
    }
  }, [content._id, address]);

  // Determine voting phase when content changes
  useEffect(() => {
    if (content) {
      const phase = getVotingPhase(content);
      setVotingPhase(phase);

      // If in reveal phase, try to load saved commit data
      if (phase === "reveal" && isConnected) {
        fetchSavedCommit();
      }
    }
  }, [content, isConnected, fetchSavedCommit]);

  // Check if user has already voted
  useEffect(() => {
    const checkExistingVote = async () => {
      if (!isConnected || !address || !content._id) return;

      try {
        const voteStatus = await getVoteStatus(content._id, address);
        if (voteStatus?.vote !== undefined) {
          setExistingVote(voteStatus);
          setVote(voteStatus.vote);
          setConfidence(voteStatus.confidence);
        }
      } catch (err) {
        console.error("Error checking vote status:", err);
      }
    };

    checkExistingVote();
  }, [isConnected, address, content._id]);

  // Handle commit form changes
  const handleCommitChange = (e) => {
    const { name, value } = e.target;
    setCommitForm({
      ...commitForm,
      [name]: value,
    });
  };

  // Handle reveal form changes
  const handleRevealChange = (e) => {
    const { name, value } = e.target;
    setRevealForm({
      ...revealForm,
      [name]: value,
    });
  };

  // Submit commit vote
  const handleCommitSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate a random salt
      const salt = generateRandomSalt();

      // Generate commit hash
      const vote = commitForm.vote === "true";
      const confidence = parseInt(commitForm.confidence);
      const commitHash = generateCommitHash(vote, confidence, salt);

      // Prepare data for API
      const commitData = {
        vote,
        confidence,
        salt,
        commitHash,
        tokenType: parseInt(commitForm.tokenType),
        stakeAmount: commitForm.stakeAmount,
      };

      // Submit commit vote
      await submitVote(content._id, { ...commitData, type: "commit" });

      setSuccess(
        "Vote committed successfully! Save your salt for the reveal phase."
      );

      // Notify parent component
      if (onVoteComplete) {
        onVoteComplete("commit");
      }
    } catch (err) {
      console.error("Error committing vote:", err);
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit reveal vote
  const handleRevealSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API
      const revealData = {
        vote: revealForm.vote === "true",
        confidence: parseInt(revealForm.confidence),
        salt: revealForm.salt,
      };

      // Submit reveal vote
      await submitVote(content._id, { ...revealData, type: "reveal" });

      setSuccess("Vote revealed successfully!");

      // Notify parent component
      if (onVoteComplete) {
        onVoteComplete("reveal");
      }
    } catch (err) {
      console.error("Error revealing vote:", err);
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle finalization
  const handleFinalize = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await submitVote(content._id, { type: "finalize" });

      setSuccess("Voting finalized successfully!");

      // Notify parent component
      if (onVoteComplete) {
        onVoteComplete("finalize");
      }
    } catch (err) {
      console.error("Error finalizing voting:", err);
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSubmit = async () => {
    if (!isConnected) {
      setError("Please connect your wallet to vote");
      return;
    }

    if (vote === null) {
      setError("Please select your vote");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create vote message
      const message = {
        contentId: content._id,
        vote,
        confidence,
        timestamp: Date.now(),
        address,
      };

      // Sign the message
      const messageHash = ethers.utils.hashMessage(JSON.stringify(message));
      const signature = await signer.signMessage(messageHash);

      // Submit vote to backend
      await submitVote(content._id, {
        ...message,
        signature,
      });

      setSuccess("Vote submitted successfully!");
      onVoteComplete?.();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Vote submission error:", err);
      setError(err.message || "Failed to submit vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render appropriate interface based on voting phase
  const renderVotingInterface = () => {
    if (!isConnected) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Connect your wallet to participate in voting
          </p>
        </div>
      );
    }

    switch (votingPhase) {
      case "commit":
        return renderCommitPhase();
      case "reveal":
        return renderRevealPhase();
      case "pending":
        return renderPendingPhase();
      case "finalized":
        return renderFinalizedPhase();
      default:
        return <div>Loading voting interface...</div>;
    }
  };

  // Render commit phase interface
  const renderCommitPhase = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Commit Your Vote</h2>
        <p className="text-gray-600 mb-6">
          In this phase, you commit to a vote without revealing your choice.
          Your vote will be securely hashed and stored on the blockchain.
        </p>

        <form onSubmit={handleCommitSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Vote
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="vote"
                  value="true"
                  checked={commitForm.vote === "true"}
                  onChange={handleCommitChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  required
                />
                <span className="ml-2">Approve</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="vote"
                  value="false"
                  checked={commitForm.vote === "false"}
                  onChange={handleCommitChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2">Reject</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence Level (1-10)
            </label>
            <input
              type="range"
              name="confidence"
              min="1"
              max="10"
              value={commitForm.confidence}
              onChange={handleCommitChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <div className="text-center mt-1">
              <span className="font-medium">{commitForm.confidence}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Type
            </label>
            <select
              name="tokenType"
              value={commitForm.tokenType}
              onChange={handleCommitChange}
              className="input-field"
              required
            >
              {supportedTokens.map((token) => (
                <option key={token.tokenType} value={token.tokenType}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stake Amount
            </label>
            <input
              type="number"
              name="stakeAmount"
              value={commitForm.stakeAmount}
              onChange={handleCommitChange}
              step="0.001"
              min="0.001"
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher stakes increase your voting power (quadratically)
            </p>
          </div>

          <div className="pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Submitting..." : "Commit Vote"}
            </motion.button>
          </div>
        </form>
      </div>
    );
  };

  // Render reveal phase interface
  const renderRevealPhase = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Reveal Your Vote</h2>
        <p className="text-gray-600 mb-6">
          In this phase, you reveal your vote by providing the same vote,
          confidence level, and salt that you used during the commit phase.
        </p>

        {savedCommit ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800">
              We found your previously committed vote. The form has been
              pre-filled with your data.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-800">
              No saved commit found. Make sure you use the exact same values you
              used during the commit phase.
            </p>
          </div>
        )}

        <form onSubmit={handleRevealSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Vote
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="vote"
                  value="true"
                  checked={revealForm.vote === "true"}
                  onChange={handleRevealChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  required
                />
                <span className="ml-2">Approve</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="vote"
                  value="false"
                  checked={revealForm.vote === "false"}
                  onChange={handleRevealChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2">Reject</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence Level (1-10)
            </label>
            <input
              type="range"
              name="confidence"
              min="1"
              max="10"
              value={revealForm.confidence}
              onChange={handleRevealChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center mt-1">
              <span className="font-medium">{revealForm.confidence}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salt
            </label>
            <input
              type="text"
              name="salt"
              value={revealForm.salt}
              onChange={handleRevealChange}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This must match the salt used in the commit phase
            </p>
          </div>

          <div className="pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Submitting..." : "Reveal Vote"}
            </motion.button>
          </div>
        </form>
      </div>
    );
  };

  // Render pending finalization phase
  const renderPendingPhase = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Voting Period Ended</h2>
        <p className="text-gray-600 mb-6">
          The voting period has ended. The results can now be finalized on the
          blockchain.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFinalize}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? "Processing..." : "Finalize Voting"}
        </motion.button>
      </div>
    );
  };

  // Render finalized phase
  const renderFinalizedPhase = () => {
    const result = content.blockchainResults || {};
    const winningOption = result.winningOption === 1 ? "Approved" : "Rejected";

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Voting Finalized</h2>
        <p className="text-gray-600 mb-2">
          This content has been {winningOption.toLowerCase()} by the community.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-700">Result:</span>
            <span className="font-medium">{winningOption}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total Participants:</span>
            <span className="font-medium">{result.totalParticipants || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total USD Value Staked:</span>
            <span className="font-medium">${result.totalUSDValue || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Finalized On:</span>
            <span className="font-medium">
              {formatDate(content.finalizedAt)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 text-red-700 p-4 rounded-md mb-6"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 text-green-700 p-4 rounded-md mb-6"
        >
          {success}
        </motion.div>
      )}

      {existingVote && !existingVote.canModify && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Your Vote
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white dark:bg-gray-700">
              <p className="font-medium text-gray-900 dark:text-white">
                {existingVote.vote ? "Approved" : "Rejected"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Confidence: {existingVote.confidence}/10
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Submitted: {new Date(existingVote.timestamp).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Your vote has been recorded and cannot be modified
            </p>
          </div>
        </div>
      )}

      {renderVotingInterface()}

      <div className="mt-6">
        <button
          onClick={handleVoteSubmit}
          disabled={isSubmitting || vote === null}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700"
            }
            transition-colors duration-200
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </div>
          ) : existingVote ? (
            "Update Vote"
          ) : (
            "Submit Vote"
          )}
        </button>
      </div>
    </div>
  );
};

export default VotingInterface;
