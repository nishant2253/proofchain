import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useWallet from "../hooks/useWallet";
import { submitContent } from "../utils/api";
import { parseErrorMessage } from "../utils/helpers";

const ContentSubmitPage = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentUrl: "",
    contentType: "article",
    votingDuration: 3, // Default 3 days
    file: null, // New: for file upload
    tags: "", // New: for tags input
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a FormData object to handle the file upload
      const formDataToSend = new FormData();

      // Add text fields to FormData
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("contentType", formData.contentType);
      formDataToSend.append("tags", formData.tags); // Add tags

      // Convert voting duration from days to seconds (minimum 24 hours = 86400 seconds)
      const votingDurationSeconds = parseInt(formData.votingDuration) * 86400;
      formDataToSend.append("votingDuration", votingDurationSeconds);

      // Append the actual file
      if (formData.file) {
        formDataToSend.append("file", formData.file, formData.file.name);
      } else {
        // Fallback if no file is selected, use contentUrl as a text file
        const contentUrlBlob = new Blob([formData.contentUrl], {
          type: "text/plain",
        });
        formDataToSend.append("file", contentUrlBlob, "content-url.txt");
      }

      console.log("Submitting content with FormData:", {
        title: formData.title,
        description: formData.description,
        contentType: formData.contentType,
        votingDuration: votingDurationSeconds,
      });

      // Submit content to API with FormData
      const response = await submitContent(formDataToSend);
      console.log("Content submission response:", response);

      // Redirect to the content page
      navigate(`/content/${response.contentId}`);
    } catch (err) {
      console.error("Error submitting content:", err);
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Redirect to home if not connected
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Wallet Required
        </h1>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to submit content for verification.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Submit Content for Verification
      </h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 text-red-700 p-4 rounded-md mb-6"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter content title"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="input-field"
            placeholder="Describe the content you're submitting"
          />
        </div>

        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Content File
          </label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleChange}
            required
            className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload the actual content file (image, video, document, etc.)
          </p>
        </div>

        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., blockchain, AI, news"
          />
          <p className="text-xs text-gray-500 mt-1">
            Add relevant keywords to categorize your content
          </p>
        </div>

        <div>
          <label
            htmlFor="contentType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Content Type
          </label>
          <select
            id="contentType"
            name="contentType"
            value={formData.contentType}
            onChange={handleChange}
            className="input-field"
          >
            <option value="article">Article</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="votingDuration"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Voting Duration (days)
          </label>
          <select
            id="votingDuration"
            name="votingDuration"
            value={formData.votingDuration}
            onChange={handleChange}
            className="input-field"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The duration for which voting will be open
          </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </motion.button>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Submitting..." : "Submit Content"}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ContentSubmitPage;
