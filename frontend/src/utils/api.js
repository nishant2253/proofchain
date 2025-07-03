import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// User endpoints
export const loginUser = (credentials) => api.post("/users/login", credentials);
export const registerUser = (userData) => api.post("/users/register", userData);
export const updateUserProfile = (userId, data) =>
  api.put(`/users/${userId}`, data);
export const getUserProfile = (userId) => api.get(`/users/${userId}`);
export const getUserVotingHistory = (userId) =>
  api.get(`/users/${userId}/votes`);
export const getUserReputationHistory = (userId) =>
  api.get(`/users/${userId}/reputation-history`);

// Content endpoints
export const getContentList = (page = 1, limit = 10) =>
  api.get("/content", { params: { page, limit } });
export const getContentById = (contentId) => api.get(`/content/${contentId}`);
export const submitContent = (contentData) => api.post("/content", contentData);
export const updateContent = (contentId, data) =>
  api.put(`/content/${contentId}`, data);
export const deleteContent = (contentId) => api.delete(`/content/${contentId}`);

// Token endpoints
export const getSupportedTokens = () => api.get("/tokens/supported");
export const getTokenBalance = (address, tokenId) =>
  api.get(`/tokens/${tokenId}/balance/${address}`);
export const getTokenDistribution = () => api.get("/tokens/distribution");

// Consensus endpoints
export const getConsensusStats = () => api.get("/consensus/stats");
export const getVotingTimeline = () => api.get("/consensus/timeline");
export const submitVote = (contentId, voteData) =>
  api.post(`/consensus/${contentId}/vote`, voteData);
export const getVoteStatus = (contentId, address) =>
  api.get(`/consensus/${contentId}/vote/${address}`);

// IPFS endpoints
export const uploadToIPFS = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/ipfs/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getFromIPFS = (hash) => api.get(`/ipfs/${hash}`);

// Blockchain endpoints
export const getTransactionStatus = (txHash) =>
  api.get(`/blockchain/tx/${txHash}`);
export const getGasEstimate = (txData) =>
  api.post("/blockchain/estimate-gas", txData);

// Error handler helper
export const handleApiError = (error) => {
  const message =
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred. Please try again.";
  console.error("API Error:", error);
  return { error: true, message };
};

export default api;
