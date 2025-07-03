import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import useTheme from "../../hooks/useTheme";
import useWallet from "../../hooks/useWallet";
import {
  getConsensusStats,
  getVotingTimeline,
  getTokenDistribution,
} from "../../utils/api";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ConsensusDashboard = () => {
  const { isDarkMode } = useTheme();
  const { isConnected } = useWallet();
  const [consensusData, setConsensusData] = useState(null);
  const [votingData, setVotingData] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const fetchDashboardData = useCallback(async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      const [consensusStats, votingTimeline, tokenDist] = await Promise.all([
        getConsensusStats(),
        getVotingTimeline(),
        getTokenDistribution(),
      ]);

      setConsensusData(consensusStats);
      setVotingData(votingTimeline);
      setTokenData(tokenDist);
      setError(null);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to fetch dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchDashboardData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchDashboardData, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval]);

  // Chart theme colors
  const chartColors = {
    primary: isDarkMode ? "rgb(129, 140, 248)" : "rgb(79, 70, 229)",
    secondary: isDarkMode ? "rgb(139, 92, 246)" : "rgb(109, 40, 217)",
    background: isDarkMode ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)",
    text: isDarkMode ? "rgb(209, 213, 219)" : "rgb(17, 24, 39)",
    grid: isDarkMode ? "rgba(107, 114, 128, 0.2)" : "rgba(107, 114, 128, 0.1)",
  };

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.text,
        },
      },
      tooltip: {
        backgroundColor: chartColors.background,
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.grid,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: chartColors.grid,
        },
        ticks: {
          color: chartColors.text,
        },
      },
      y: {
        grid: {
          color: chartColors.grid,
        },
        ticks: {
          color: chartColors.text,
        },
      },
    },
  };

  const consensusTimelineConfig = {
    data: {
      labels: votingData?.labels || [],
      datasets: [
        {
          label: "Consensus Rate",
          data: votingData?.values || [],
          borderColor: chartColors.primary,
          backgroundColor: `${chartColors.primary}33`,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: "Consensus Timeline",
          color: chartColors.text,
        },
      },
    },
  };

  const tokenDistributionConfig = {
    data: {
      labels: tokenData?.labels || [],
      datasets: [
        {
          data: tokenData?.values || [],
          backgroundColor: [
            chartColors.primary,
            chartColors.secondary,
            `${chartColors.primary}88`,
            `${chartColors.secondary}88`,
          ],
          borderColor: chartColors.background,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: "Token Distribution",
          color: chartColors.text,
        },
      },
    },
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Please connect your wallet to view the dashboard
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Participants
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {consensusData?.totalParticipants?.toLocaleString() || 0}
          </p>
          <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
            <span>↑ {consensusData?.participantGrowth || 0}%</span>
            <span className="ml-2">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Proposals
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {consensusData?.activeProposals || 0}
          </p>
          <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
            <span>{consensusData?.proposalChange || 0} new</span>
            <span className="ml-2">this week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Average Confidence
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {consensusData?.averageConfidence?.toFixed(1) || 0}/10
          </p>
          <div className="mt-2 flex items-center text-sm text-purple-600 dark:text-purple-400">
            <span>↑ {consensusData?.confidenceChange || 0}%</span>
            <span className="ml-2">vs last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Consensus Rate
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {consensusData?.consensusRate?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <span>↓ {consensusData?.rateChange || 0}%</span>
            <span className="ml-2">vs last month</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Consensus Timeline
          </h2>
          <div className="h-80">
            <Line {...consensusTimelineConfig} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Token Distribution
          </h2>
          <div className="h-80">
            <Doughnut {...tokenDistributionConfig} />
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {consensusData?.recentActivity?.map((activity, index) => (
            <div
              key={activity.id || index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "success"
                      ? "bg-green-500"
                      : activity.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Refresh Rate Control */}
      <div className="flex justify-end">
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1 text-sm"
        >
          <option value={15000}>Refresh: 15s</option>
          <option value={30000}>Refresh: 30s</option>
          <option value={60000}>Refresh: 1m</option>
          <option value={300000}>Refresh: 5m</option>
        </select>
      </div>
    </div>
  );
};

export default ConsensusDashboard;
