import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import useWallet from "../../hooks/useWallet";
import useTheme from "../../hooks/useTheme";
import {
  getUserProfile,
  getUserVotingHistory,
  getUserReputationHistory,
  getTokenBalance,
  getSupportedTokens,
} from "../../utils/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  const { address: userAddress } = useParams();
  const { address: connectedAddress } = useWallet();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [votingHistory, setVotingHistory] = useState([]);
  const [reputationHistory, setReputationHistory] = useState([]);
  const [tokenBalances, setTokenBalances] = useState({});
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const address = userAddress || connectedAddress;

  useEffect(() => {
    // If no address is provided and the user isn't connected, redirect to home
    if (!address) {
      navigate("/");
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all profile data in parallel
        const [profileData, votingData, reputationData, tokensData] =
          await Promise.all([
            getUserProfile(address),
            getUserVotingHistory(address),
            getUserReputationHistory(address),
            getSupportedTokens(),
          ]);

        setProfile(profileData);
        setVotingHistory(votingData);
        setReputationHistory(reputationData);
        setSupportedTokens(tokensData);

        // Fetch token balances for supported tokens
        const balances = {};
        for (const token of tokensData) {
          // Use token.id or tokenType or index as a fallback
          const tokenId = token.id || token.tokenType || token._id;
          if (tokenId) {
            try {
              const balance = await getTokenBalance(address, tokenId);
              balances[tokenId] = balance;
            } catch (err) {
              console.error(
                `Error fetching balance for token ${tokenId}:`,
                err
              );
              // Continue with other tokens even if one fails
            }
          }
        }
        setTokenBalances(balances);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [address, navigate]);

  // This effect will re-render the component when the theme changes
  // ensuring chart colors update properly
  useEffect(() => {
    // No need to do anything, just re-render when isDarkMode changes
  }, [isDarkMode]);

  // Calculate reputation level based on reputation score
  const getReputationLevel = (score) => {
    if (score >= 900)
      return { level: "Expert", color: "text-purple-600 dark:text-purple-400" };
    if (score >= 700)
      return { level: "Advanced", color: "text-blue-600 dark:text-blue-400" };
    if (score >= 500)
      return {
        level: "Intermediate",
        color: "text-green-600 dark:text-green-400",
      };
    if (score >= 300)
      return {
        level: "Regular",
        color: "text-yellow-600 dark:text-yellow-400",
      };
    return { level: "Novice", color: "text-gray-600 dark:text-gray-400" };
  };

  // Calculate statistics from voting history
  const calculateStats = () => {
    if (!votingHistory || !votingHistory.length) {
      return {
        totalVotes: 0,
        correctVotes: 0,
        accuracyRate: 0,
        averageConfidence: 0,
        totalStaked: 0,
      };
    }

    // Filter finalized votes - safely access nested properties
    const finalizedVotes = votingHistory.filter(
      (vote) => vote && vote.isFinalized === true
    );

    // Filter correct votes - safely checking against winning option
    const correctVotes = finalizedVotes.filter(
      (vote) =>
        vote &&
        vote.vote !== null &&
        vote.winningOption !== undefined &&
        vote.vote === vote.winningOption
    );

    // Calculate total staked amount
    const totalStaked = votingHistory.reduce(
      (sum, vote) =>
        sum + (vote && vote.stakeAmount ? Number(vote.stakeAmount) : 0),
      0
    );

    // Calculate confidence sum
    const confidenceSum = votingHistory.reduce(
      (sum, vote) =>
        sum + (vote && vote.confidence ? Number(vote.confidence) : 0),
      0
    );

    return {
      totalVotes: votingHistory.length,
      correctVotes: correctVotes.length,
      accuracyRate:
        finalizedVotes.length > 0
          ? (correctVotes.length / finalizedVotes.length) * 100
          : 0,
      averageConfidence:
        votingHistory.length > 0 ? confidenceSum / votingHistory.length : 0,
      totalStaked,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-lg">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Profile Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The requested profile could not be found.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const reputationInfo = getReputationLevel(profile.reputationScore || 0);
  const reputationScore = profile.reputationScore || 0;

  // Define chart config inside render to ensure it updates with theme changes
  const reputationChartConfig = {
    data: {
      labels:
        reputationHistory && reputationHistory.length > 0
          ? reputationHistory.map((item) =>
              item && item.timestamp
                ? new Date(item.timestamp).toLocaleDateString()
                : "N/A"
            )
          : [],
      datasets: [
        {
          label: "Reputation Score",
          data:
            reputationHistory && reputationHistory.length > 0
              ? reputationHistory.map((item) =>
                  item && item.score ? item.score : 0
                )
              : [],
          borderColor: isDarkMode ? "rgb(129, 140, 248)" : "rgb(99, 102, 241)",
          backgroundColor: isDarkMode
            ? "rgba(129, 140, 248, 0.1)"
            : "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Reputation History",
          color: isDarkMode ? "#e5e7eb" : "#111827",
        },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: isDarkMode
            ? "rgba(17, 24, 39, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          titleColor: isDarkMode ? "#e5e7eb" : "#111827",
          bodyColor: isDarkMode ? "#e5e7eb" : "#111827",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: isDarkMode ? "#e5e7eb" : "#111827",
          },
        },
        x: {
          grid: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: isDarkMode ? "#e5e7eb" : "#111827",
            maxRotation: 45,
            minRotation: 0,
          },
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.username?.[0]?.toUpperCase() ||
                  address.slice(2, 4).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.username ||
                `${address.slice(0, 6)}...${address.slice(-4)}`}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {address}
            </p>
            <div className="mt-2 flex items-center">
              <div className="flex items-center text-yellow-500">
                {"★".repeat(Math.floor(reputationScore / 200))}
                {"☆".repeat(5 - Math.floor(reputationScore / 200))}
              </div>
              <span className={`ml-2 text-sm ${reputationInfo.color}`}>
                {reputationInfo.level} · Level{" "}
                {Math.floor(reputationScore / 100) + 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("voting")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "voting"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Voting History
          </button>
          <button
            onClick={() => setActiveTab("reputation")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "reputation"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Reputation
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Statistics
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Votes
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalVotes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Consensus Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.accuracyRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Average Confidence
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageConfidence.toFixed(1)}/10
                  </p>
                </div>
              </div>
            </div>

            {/* Token Balances */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Token Balances
              </h2>
              <div className="space-y-4">
                {supportedTokens.map((token) => {
                  const tokenId = token.id || token.tokenType || token._id;
                  return (
                    <div
                      key={tokenId || `token-${supportedTokens.indexOf(token)}`}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: token.color || "#6366f1" }}
                        >
                          <span className="text-white text-sm font-medium">
                            {token.symbol?.[0] || "?"}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {token.name || "Unknown Token"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {token.symbol || "???"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tokenBalances[tokenId]?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  );
                })}
                {supportedTokens.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tokens available
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "voting" && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Voting History
              </h2>
              <div className="space-y-4">
                {votingHistory.length > 0 ? (
                  votingHistory.map((vote, index) => (
                    <div
                      key={
                        vote.id ||
                        `${vote.contentId}-${vote.commitTimestamp}` ||
                        `vote-${index}`
                      }
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {vote.title ||
                            `Content #${vote.contentId || index + 1}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Vote:{" "}
                          {vote.vote !== null && vote.vote !== undefined
                            ? typeof vote.vote === "boolean"
                              ? vote.vote
                                ? "Approve"
                                : "Reject"
                              : vote.vote
                            : "Pending"}{" "}
                          •
                          {vote.confidence !== null &&
                          vote.confidence !== undefined
                            ? ` Confidence: ${vote.confidence}/10`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {vote.commitTimestamp
                            ? new Date(
                                vote.commitTimestamp
                              ).toLocaleDateString()
                            : vote.timestamp
                            ? new Date(vote.timestamp).toLocaleDateString()
                            : "N/A"}
                        </p>
                        {vote.isFinalized && (
                          <p
                            className={`text-sm ${
                              vote.wasSuccessful
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {vote.wasSuccessful
                              ? "Matched Consensus"
                              : "Differed from Consensus"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No voting history available
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "reputation" && (
          <motion.div
            key="reputation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Reputation Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Reputation Growth
              </h2>
              <div className="h-80">
                {reputationHistory && reputationHistory.length > 0 ? (
                  <Line
                    data={
                      reputationChartConfig.data || { labels: [], datasets: [] }
                    }
                    options={reputationChartConfig.options || {}}
                    height={80}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">
                      No reputation history available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reputation Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Reputation Breakdown
              </h2>
              {profile && profile.reputationBreakdown ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Consensus Participation
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      +{profile.reputationBreakdown.consensusParticipation || 0}{" "}
                      points
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Correct Predictions
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      +{profile.reputationBreakdown.correctPredictions || 0}{" "}
                      points
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Content Submissions
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      +{profile.reputationBreakdown.contentSubmissions || 0}{" "}
                      points
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Community Rewards
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      +{profile.reputationBreakdown.communityRewards || 0}{" "}
                      points
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Total Score
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {reputationScore} points
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No reputation data available
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
