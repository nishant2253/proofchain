import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getContentList } from "../utils/api";
import {
  formatDate,
  getTimeRemaining,
  formatTimeRemaining,
  getVotingPhase,
} from "../utils/helpers";
import useWallet from "../hooks/useWallet";

const HomePage = () => {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isConnected } = useWallet();

  const fetchContentItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getContentList(page, 10);

      // Check if response exists
      if (!response) {
        console.error("No response received from server");
        setError("Failed to connect to server");
        setContentItems([]);
        return;
      }

      // Handle API response format with results and pagination
      if (response.results && Array.isArray(response.results)) {
        // Use the results array from the response
        if (response.results.length === 0) {
          setHasMore(false);
        } else {
          setContentItems((prev) =>
            page === 1 ? response.results : [...prev, ...response.results]
          );
        }

        // Check pagination info if available
        if (response.pagination) {
          setHasMore(response.pagination.hasNextPage);
        }
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback for direct data array format
        if (response.data.length === 0) {
          setHasMore(false);
        } else {
          setContentItems((prev) =>
            page === 1 ? response.data : [...prev, ...response.data]
          );
        }
      } else {
        console.error("Invalid response format:", response);
        setError("Received invalid data format from server");
        setContentItems([]);
        return;
      }

      setError(null);
    } catch (err) {
      setError("Failed to load content items");
      console.error(err);
      setContentItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Fetch content items on component mount
  useEffect(() => {
    fetchContentItems();
  }, [fetchContentItems]);

  // Set up timer to update countdown
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render to update countdowns
      setContentItems([...contentItems]);
    }, 1000);

    return () => clearInterval(timer);
  }, [contentItems]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Render badge based on voting phase
  const renderPhaseBadge = (content) => {
    const phase = getVotingPhase(content);

    const badgeClasses = {
      commit: "bg-blue-100 text-blue-800",
      reveal: "bg-purple-100 text-purple-800",
      finalized: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    const phaseLabels = {
      commit: "Commit Phase",
      reveal: "Reveal Phase",
      finalized: "Finalized",
      pending: "Pending Finalization",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClasses[phase]}`}
      >
        {phaseLabels[phase]}
      </span>
    );
  };

  // Render countdown timer
  const renderCountdown = (content) => {
    const phase = getVotingPhase(content);

    if (phase === "finalized") {
      return <span className="text-sm text-gray-500">Voting completed</span>;
    }

    const deadline =
      phase === "commit"
        ? content.commitDeadline
        : phase === "reveal"
        ? content.revealDeadline
        : null;

    if (!deadline) return null;

    const timeRemaining = getTimeRemaining(deadline);
    const formattedTime = formatTimeRemaining(timeRemaining);

    return (
      <span className="text-sm text-gray-500">
        {phase === "commit" ? "Commit ends in: " : "Reveal ends in: "}
        <span className="font-medium">{formattedTime}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Content Verification
        </h1>
        {isConnected && (
          <Link to="/submit">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              Submit New Content
            </motion.button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      )}

      {contentItems.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No content items available</p>
          {isConnected && (
            <Link
              to="/submit"
              className="text-primary-600 hover:underline mt-2 inline-block"
            >
              Submit the first content item
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contentItems.map((content) => (
            <motion.div
              key={content._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    <Link
                      to={`/content/${content._id}`}
                      className="hover:text-primary-600"
                    >
                      {content.title}
                    </Link>
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Submitted by{" "}
                    {content.creator
                      ? content.creator.substring(0, 8) + "..."
                      : "Unknown"}{" "}
                    on {formatDate(content.submissionTime || content.createdAt)}
                  </p>
                </div>
                {renderPhaseBadge(content)}
              </div>

              <p className="text-gray-700 mt-4 line-clamp-2">
                {content.description}
              </p>

              <div className="mt-4 flex justify-between items-center">
                {renderCountdown(content)}

                <Link
                  to={`/content/${content._id}`}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details →
                </Link>
              </div>
            </motion.div>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadMore}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? "Loading..." : "Load More"}
              </motion.button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
