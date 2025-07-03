import React, { createContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });

          if (accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            setProvider(provider);
            setSigner(signer);
            setAddress(address);
            setChainId(network.chainId);
            setIsConnected(true);

            // Check if we have a token in localStorage
            const token = localStorage.getItem("authToken");
            if (!token) {
              // If no token, authenticate with the backend
              await authenticateWithBackend(address);
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setError(error.message);
        }
      }
    };

    checkConnection();
  }, []);

  const authenticateWithBackend = async (address) => {
    try {
      // Call the backend to register/login the user
      const response = await axios.post("http://localhost:3000/api/users", {
        address,
        // In a real implementation, you would sign a message and include the signature
        // signature: await signer.signMessage("Login to ProofChain"),
        userData: {},
      });

      // Store the JWT token in localStorage
      if (response.data && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
    } catch (error) {
      console.error("Error authenticating with backend:", error);
    }
  };

  const handleAccountsChanged = useCallback(async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else {
      // Account changed, update state
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setIsConnected(true);

      // Re-authenticate with the backend when account changes
      await authenticateWithBackend(address);
    }
  }, []);

  const handleChainChanged = (chainIdHex) => {
    // Chain changed, reload the page as recommended by MetaMask
    window.location.reload();
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [handleAccountsChanged]);

  const connect = async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet found. Please install MetaMask.");
      return false;
    }

    try {
      // Request account access
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setChainId(network.chainId);
      setIsConnected(true);
      setError(null);

      // Authenticate with the backend
      await authenticateWithBackend(address);

      return true;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setError(error.message);
      return false;
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress("");
    setChainId(null);
    setIsConnected(false);

    // Clear the auth token
    localStorage.removeItem("authToken");
  };

  const switchChain = async (targetChainId) => {
    if (!window.ethereum) {
      setError("No Ethereum wallet found. Please install MetaMask.");
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.utils.hexValue(targetChainId) }],
      });
      return true;
    } catch (error) {
      console.error("Error switching chain:", error);
      setError(error.message);
      return false;
    }
  };

  const value = {
    provider,
    signer,
    address,
    chainId,
    isConnected,
    error,
    connect,
    disconnect,
    switchChain,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
