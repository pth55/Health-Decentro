import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  UserMinus,
  Loader,
  AlertCircle,
} from "lucide-react";
import {
  connectToBlockchain,
  grantAccess,
  revokeAccess,
  getPatientDoctors,
  getDoctorAccess,
  isDoctor,
  isPatient,
} from "../contracts/ContractFunctions";

export function DoctorAccessManagement() {
  const [doctors, setDoctors] = useState({
    active: [],
    previous: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [doctorAddress, setDoctorAddress] = useState("");
  const [actionType, setActionType] = useState("grant"); // "grant" or "revoke"

  // Initialize connection to blockchain
  useEffect(() => {
    const init = async () => {
      try {
        await connectToBlockchain();
        await fetchDoctors();
      } catch (error) {
        console.error("Blockchain connection error:", error);
        setError(
          "Failed to connect to blockchain. Please make sure MetaMask is installed and unlocked."
        );
      }
    };

    init();
  }, []);

  const fetchDoctors = async () => {
    try {
      setRefreshing(true);
      setError("");

      // Get the current user's Ethereum address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentAddress = accounts[0];

      // Fetch doctors from blockchain
      const doctorList = await getPatientDoctors(currentAddress);

      if (doctorList) {
        const activeList = [];
        const previousList = [];

        // Check access status for each doctor
        for (const doctorAddr of doctorList) {
          const hasAccess = await getDoctorAccess(currentAddress, doctorAddr);
          if (hasAccess) {
            activeList.push(doctorAddr);
          } else {
            previousList.push(doctorAddr);
          }
        }

        setDoctors({
          active: activeList,
          previous: previousList,
        });
      }
    } catch (error) {
      console.error("Error fetching doctors from blockchain:", error);
      setError("Failed to load doctor list from blockchain");
    } finally {
      setRefreshing(false);
    }
  };

  const validateEthereumAddress = (address) => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const extractErrorMessage = (error) => {
    // Extract message from MetaMask or contract error
    if (
      error.message &&
      error.message.includes("Address is not a registered doctor")
    ) {
      return "This address is not registered as a doctor";
    }
    if (error.message && error.message.includes("Access already granted")) {
      return "This doctor already has access to your records";
    }
    if (error.message && error.message.includes("Access not granted")) {
      return "This doctor doesn't have active access to revoke";
    }
    if (error.message && error.message.includes("execution reverted")) {
      // Try to extract custom error from revert
      const revertMatch = error.message.match(/execution reverted: (.+?)"/);
      if (revertMatch && revertMatch[1]) {
        return revertMatch[1];
      }
    }
    return "Transaction failed. Check the console for details.";
  };

  const checkDoctorStatus = async (address) => {
    try {
      // Check if the address is registered as a doctor
      const isDoctorResult = await isDoctor(address);
      if (!isDoctorResult) {
        const isPatientResult = await isPatient(address);
        if (isPatientResult) {
          throw new Error(
            "This address is registered as a patient, not a doctor"
          );
        } else {
          throw new Error("This address is not registered in the system");
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate Ethereum address
      if (!validateEthereumAddress(doctorAddress)) {
        throw new Error("Please enter a valid Ethereum address");
      }

      // Check if doctor address is the same as patient address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentAddress = accounts[0];

      if (doctorAddress.toLowerCase() === currentAddress.toLowerCase()) {
        throw new Error("You cannot grant/revoke access to yourself");
      }

      if (actionType === "grant") {
        // Check if doctor is already in active list
        if (doctors.active.includes(doctorAddress)) {
          throw new Error("This doctor already has access to your records");
        }

        // Check if the address is registered as a doctor
        await checkDoctorStatus(doctorAddress);

        // Grant access to doctor - No need to set success here, we'll do it after confirmation
        await grantAccess(doctorAddress)
          .then(() => {
            setSuccess(
              `Access granted to doctor (${doctorAddress.substring(
                0,
                6
              )}...${doctorAddress.substring(38)})`
            );
          })
          .catch((error) => {
            throw new Error(extractErrorMessage(error));
          });
      } else {
        // Check if doctor is in active list
        if (!doctors.active.includes(doctorAddress)) {
          throw new Error("This doctor doesn't have active access to revoke");
        }

        // Revoke access from doctor - No need to set success here, we'll do it after confirmation
        await revokeAccess(doctorAddress)
          .then(() => {
            setSuccess(
              `Access revoked from doctor (${doctorAddress.substring(
                0,
                6
              )}...${doctorAddress.substring(38)})`
            );
          })
          .catch((error) => {
            throw new Error(extractErrorMessage(error));
          });
      }

      // Reset form
      setDoctorAddress("");

      // Refresh doctors list
      await fetchDoctors();
    } catch (error) {
      console.error("Error managing doctor access:", error);
      setError(
        error.message ||
          extractErrorMessage(error) ||
          "Failed to manage doctor access"
      );
    } finally {
      setLoading(false);
    }
  };

  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const handleRevokeClick = (doctorAddr) => {
    setDoctorAddress(doctorAddr);
    setActionType("revoke");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Doctor Access Management
              </h1>
            </div>
            <button
              onClick={fetchDoctors}
              disabled={refreshing}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {refreshing ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Refresh Doctors
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Doctor's Ethereum Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={doctorAddress}
                  onChange={(e) => setDoctorAddress(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700">
                    Action
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="grant">Grant Access</option>
                    <option value="revoke">Revoke Access</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="inline-block mr-2">
                      <Loader className="h-4 w-4 animate-spin" />
                    </span>
                    Processing...
                  </>
                ) : actionType === "grant" ? (
                  <>
                    <UserPlus className="h-4 w-4 inline mr-1" /> Grant Access
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 inline mr-1" /> Revoke Access
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Active Doctors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlus className="h-5 w-5 text-green-600 mr-2" />
              Active Doctors
            </h2>

            {doctors.active.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-md">
                No active doctors. Grant access using the form above.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {doctors.active.map((doctor, index) => (
                  <li key={index} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Doctor
                          </p>
                          <p className="text-sm text-gray-500">
                            {truncateAddress(doctor)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeClick(doctor)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm leading-5 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Revoke
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Previous Doctors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserMinus className="h-5 w-5 text-gray-600 mr-2" />
              Previous Doctors
            </h2>

            {doctors.previous.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-md">
                No previous doctors with revoked access.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {doctors.previous.map((doctor, index) => (
                  <li key={index} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Former Doctor
                          </p>
                          <p className="text-sm text-gray-500">
                            {truncateAddress(doctor)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDoctorAddress(doctor);
                          setActionType("grant");
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm leading-5 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Re-Grant
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
