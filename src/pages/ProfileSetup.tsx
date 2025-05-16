import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types/database";
import {
  User,
  Calendar,
  Ruler,
  Phone,
  Wallet,
  CreditCard,
  Droplet,
  FileText,
  Save,
  Edit,
  Loader,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function ProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: "",
    dob: "",
    weight: undefined,
    height: undefined,
    aadhar: "",
    blood: "",
    phone: "",
    eth: "",
    gender: "",
    description: "",
  });
  const [email, setEmail] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("patients")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData({
          ...profile,
          dob: profile.dob.split("T")[0],
        });
      }

      // If no ETH address, attempt to get it from MetaMask
      if (!profile?.eth) {
        try {
          const accounts = await window.ethereum?.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts.length > 0) {
            setFormData((prev) => ({
              ...prev,
              eth: accounts[0],
            }));
          }
        } catch (error) {
          console.error("MetaMask connection error:", error);
        }
      }

      setLoadingProfile(false);
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      if (
        !formData.name ||
        !formData.dob ||
        !formData.phone ||
        !formData.eth ||
        !formData.gender ||
        !formData.description
      ) {
        throw new Error("Please fill in all required fields");
      }

      const { error: updateError } = await supabase.from("patients").upsert(
        {
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (updateError) throw updateError;

      setIsEditing(false);
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-2 mt-0 pb-4">
      <div className="max-w-7xl w-full mx-auto px-4">
        <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Blur Loading Overlay */}
          {loadingProfile && (
            <div className="absolute inset-0 z-10 bg-white bg-opacity-60 backdrop-blur-md flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-3">
                <Loader className="h-6 w-6 text-orange-600 animate-spin" />
                <span className="text-gray-700 text-lg font-medium">
                  Loading profile...
                </span>
              </div>
            </div>
          )}

          <div
            className={`${
              loadingProfile ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Health Profile</h1>
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    isEditing
                      ? "bg-white text-orange-600 hover:bg-gray-100"
                      : "bg-orange-700 text-white hover:bg-orange-900"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <span>Cancel Editing</span>
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              </div>
              {/* <p className="text-orange-100 mt-1">
                Complete your information to access all features
              </p> */}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                {error}
                <button
                  onClick={() => setError("")}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-5">
                  {/* Basic Information */}
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">
                            Email
                          </p>
                          <p className="text-sm text-gray-900 truncate">
                            {email}
                          </p>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Full Name *
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="name"
                            value={formData.name || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            required
                            disabled={!isEditing}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Phone Number *
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="phone"
                            value={formData.phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            required
                            pattern="[0-9]{10}"
                            title="Please enter a valid 10-digit phone number"
                            disabled={!isEditing}
                            placeholder="9876543210"
                          />
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label
                          htmlFor="dob"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date of Birth *
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            id="dob"
                            value={formData.dob || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, dob: e.target.value })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            required
                            max={new Date().toISOString().split("T")[0]}
                            disabled={!isEditing}
                          />
                        </div>
                        {formData.dob && (
                          <p className="text-xs text-gray-500 mt-1">
                            Age: {calculateAge(formData.dob)} years
                          </p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label
                          htmlFor="gender"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Gender *
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            id="gender"
                            value={formData.gender || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                gender: e.target.value,
                              })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            required
                            disabled={!isEditing}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Aadhar Number */}
                      <div>
                        <label
                          htmlFor="aadhar"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Aadhar Number
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="aadhar"
                            value={formData.aadhar || ""}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 12);
                              setFormData({ ...formData, aadhar: value });
                            }}
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            pattern="[0-9]{12}"
                            title="Please enter a valid 12-digit Aadhar number"
                            placeholder="XXXX XXXX XXXX"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">
                      Medical Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Weight */}
                      <div>
                        <label
                          htmlFor="weight"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Weight (kg)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Ruler className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="weight"
                            value={formData.weight || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                weight: parseFloat(e.target.value),
                              })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            step="0.1"
                            min="0"
                            max="500"
                            disabled={!isEditing}
                            placeholder="65.5"
                          />
                        </div>
                      </div>

                      {/* Height */}
                      <div>
                        <label
                          htmlFor="height"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Height (cm)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Ruler className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="height"
                            value={formData.height || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                height: parseFloat(e.target.value),
                              })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            step="0.1"
                            min="0"
                            max="300"
                            disabled={!isEditing}
                            placeholder="175"
                          />
                        </div>
                      </div>

                      {/* Blood Type */}
                      <div>
                        <label
                          htmlFor="blood"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Blood Type
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Droplet className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            id="blood"
                            value={formData.blood || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                blood: e.target.value,
                              })
                            }
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                            disabled={!isEditing}
                          >
                            <option value="">Select blood type</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Medical History / Notes *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <textarea
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                        required
                        rows={3}
                        disabled={!isEditing}
                        placeholder="Include any important medical history, allergies, or ongoing conditions..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Right Column - Ethereum & QR Code */}
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">
                      Blockchain Identity
                    </h2>

                    {/* QR Code */}
                    {formData.eth && (
                      <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                        <div className="w-full flex justify-center">
                          <QRCodeSVG
                            value={formData.eth}
                            size={150}
                            level="H"
                            includeMargin={true}
                            className="mb-1"
                          />
                        </div>
                        <p className="text-sm text-center text-gray-500">
                          Scan to connect
                        </p>
                      </div>
                    )}

                    {/* Ethereum Address */}
                    <div>
                      <label
                        htmlFor="eth"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Ethereum Address *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Wallet className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="eth"
                          value={formData.eth || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, eth: e.target.value })
                          }
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 text-gray-500"
                          required
                          disabled
                        />
                      </div>
                      {/* <p className="mt-1 text-xs text-gray-500">
                        This address is used for secure document storage
                      </p> */}
                    </div>
                  </div>

                  {/* Health Stats Card */}
                  {formData.weight && formData.height ? (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h3 className="font-medium text-orange-800 text-sm mb-2">
                        Health Metrics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">BMI:</span>
                          <span className="font-medium text-sm">
                            {(
                              formData.weight /
                              (formData.height / 100) ** 2
                            ).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Status:</span>
                          <span className="text-sm font-medium">
                            {(() => {
                              const bmi =
                                formData.weight / (formData.height / 100) ** 2;
                              if (bmi < 18.5) return "Underweight";
                              if (bmi < 25) return "Normal";
                              if (bmi < 30) return "Overweight";
                              return "Obese";
                            })()}
                          </span>
                        </div>

                        {/* BMI Scale visualization */}
                        <div className="mt-2 pt-2 border-t border-orange-100">
                          <p className="text-xs text-gray-500 mb-1">
                            BMI Scale
                          </p>
                          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-400 via-green-400 to-red-400"
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !isEditing}
                  className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mail(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
