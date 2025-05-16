import { useState, useEffect } from "react";
import {
  ArrowRight,
  UserPlus,
  Heart,
  Shield,
  FileText,
  Activity,
  Users,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { LoginSignup } from "./LoginSignup";

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");

  const slides = [
    {
      image: "/3.png",
      title: "Track Your Health Journey",
      description: "Monitor vital signs and health metrics in real-time",
    },
    {
      image: "/2.png",
      title: "Secure Document Storage",
      description: "Keep all your medical records in one safe place",
    },
    {
      image: "/1.png",
      title: "Family Health Management",
      description: "Track health records for your entire family",
    },
  ];

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("No web3 wallet found. Please install MetaMask.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const autoConnectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Auto-connect failed:", err);
          setError(err.message);
        }
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress("");
      }
    };

    autoConnectWallet(); // 👈 try connecting automatically on load
    window.ethereum?.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  const features = [
    {
      icon: <Activity className="h-12 w-12 text-orange-600" />,
      title: "Health Monitoring",
      description:
        "Track vital signs, including blood pressure, heart rate, and blood sugar levels with detailed analytics and trends.",
    },
    {
      icon: <FileText className="h-12 w-12 text-orange-600" />,
      title: "Secure Document Management",
      description:
        "Store and organize medical records securely with IPFS, ensuring tamper-proof, decentralized access.",
    },
    {
      icon: <Lock className="h-12 w-12 text-orange-600" />,
      title: "Data Security",
      description:
        "Bank-level encryption ensures your medical data remains private and secure.",
    },
    {
      icon: <Users className="h-12 w-12 text-orange-600" />,
      title: "Seamless Health Data Sharing",
      description:
        "Easily share medical records and vitals with doctors via decentralized IPFS storage",
    },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Health Decentro
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              {walletAddress
                ? walletAddress.substring(0, 6) +
                  "..." +
                  walletAddress.slice(-4)
                : "Connect Wallet"}
            </button>
            <button
              onClick={() => {
                setIsSignUp(false);
                setShowAuthModal(true);
              }}
              className="px-4 py-2 text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setShowAuthModal(true);
              }}
              className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slider */}
      <section className="relative text-center py-20 px-4 h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold sm:text-6xl mb-6">
            Decentralized Health Records,{" "}
            <span className="text-orange-600">Secure & Accessible</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl mx-auto">
            Store your medical records securely on IPFS, track vitals, and share
            seamlessly with doctors—privacy first.
          </p>
          {/* Image Slider */}
          <div className="mt-10 relative max-w-4xl mx-auto">
            <div className="relative h-[400px] overflow-hidden rounded-lg shadow-xl">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">
                      <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
                      <p className="text-lg">{slide.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setCurrentSlide(
                  (prev) => (prev - 1 + slides.length) % slides.length
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % slides.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
          </div>
          <button
            onClick={() => {
              setIsSignUp(true);
              setShowAuthModal(true);
            }}
            className="mt-10 inline-flex items-center px-6 py-3 rounded-md bg-orange-600 text-white hover:bg-orange-700"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white-900 mb-12">
            Comprehensive Health Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Secure Sign Up</h3>
              <p className="text-white-600">
                Create your account with email verification for enhanced
                security.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Upload Records</h3>
              <p className="text-white-600">
                Securely store and organize medical records with IPFS.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Track Health</h3>
              <p className="text-white-600">
                Monitor your vitals and view detailed health analytics.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                4. Share with Doctors
              </h3>
              <p className="text-white-600">
                Easily share medical records and vitals with your doctor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-orange-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-orange-400" />
                <span className="ml-2 text-xl font-bold">Cloud PHR</span>
              </div>
              <p className="text-white-400">
                Your comprehensive health management solution for a better,
                healthier life.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-white-400">
                <li>- Health Monitoring</li>
                <li>- Document Management</li>
                <li>- Secure Storage</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-white-400">
                {/* <li>Help Center</li> */}
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-white-400">
                <li>Twitter</li>
                <li>Facebook</li>
                {/* <li>LinkedIn</li>
                <li>Instagram</li> */}
              </ul>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-white-800 text-center text-white-400">
            <p>
              &copy; {new Date().getFullYear()} Health-Decentro. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <LoginSignup
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        walletAddress={walletAddress}
      />
    </div>
  );
}
