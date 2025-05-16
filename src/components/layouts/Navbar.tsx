import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, LogOut, Menu, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function Navbar({ walletAddress: propWalletAddress }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // State to hold the currently connected wallet address
  const [walletAddress, setWalletAddress] = useState("");
  // The Ethereum address registered with the logged-in user's account
  const [patientEth, setPatientEth] = useState("");
  const [loadingEth, setLoadingEth] = useState(true);

  // Get wallet address from props (if provided) or from window.ethereum on mount.
  useEffect(() => {
    if (propWalletAddress) {
      setWalletAddress(propWalletAddress);
    } else if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        setWalletAddress(accounts[0] || "");
      });
    }
  }, [propWalletAddress]);

  // Listen for account changes in MetaMask so we update the wallet address dynamically.
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        setWalletAddress(accounts[0] || "");
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, []);

  // A function to manually connect the wallet (for example, when the wallet is not connected or a mismatch is detected).
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0] || "");
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Fetch the registered Ethereum address for the logged-in user from Supabase.
  useEffect(() => {
    const fetchPatientEth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("patients")
          .select("eth")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching patient eth:", error);
        } else if (data) {
          setPatientEth(data.eth);
        }
      }
      setLoadingEth(false);
    };
    fetchPatientEth();
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem("blockchainFiles");
    localStorage.removeItem("blockchainVitals");
    localStorage.removeItem("supabaseProfile");
    await supabase.auth.signOut();
    navigate("/");
  };

  // Compare the connected wallet with the registered Ethereum address (ignore case).
  const walletMatches =
    walletAddress &&
    patientEth &&
    walletAddress.toLowerCase() === patientEth.toLowerCase();

  // Display a small capsule showing the wallet address (green if it matches, red otherwise).
  const WalletStatus = () => {
    if (!walletAddress) return null;
    return walletMatches ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
        {walletAddress.substring(0, 15)}...{walletAddress.slice(-4)}
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
        Wallet mismatch
      </span>
    );
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center">
                <Heart className="h-8 w-8 text-orange-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Health Decentro
                </span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/vitals"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Vitals
                </Link>
                <Link
                  to="/documents"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Documents
                </Link>
                <Link
                  to="/doctor-access"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Doctors Access
                </Link>
                <Link
                  to="/profile-setup"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Display the wallet status capsule if a wallet is connected */}
              {!loadingEth && walletAddress && <WalletStatus />}
              <button
                onClick={handleSignOut}
                className="hidden sm:inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Sign Out</span>
              </button>
              {/* Mobile menu button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  {isMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/vitals"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Vitals
              </Link>
              <Link
                to="/documents"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Documents
              </Link>
              <Link
                to="/profile-setup"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Blocking modal overlay for wallet mismatch */}
      {!loadingEth && walletAddress && !walletMatches && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-8 rounded-md text-center mx-4 max-w-md w-full">
            {/* Animated icon/GIF – replace the src URL with your preferred animated GIF */}
            <img
              src="/dislike.gif"
              alt="Connect Wallet Animation"
              className="w-20 h-20 mx-auto mb-4 animate-bounce"
            />
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Wallet Mismatch Detected
            </h2>
            <p className="mb-6">
              The connected wallet does not match the wallet associated with
              your account.
            </p>
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Connect Correct Wallet
            </button>
          </div>
        </div>
      )}
    </>
  );
}
