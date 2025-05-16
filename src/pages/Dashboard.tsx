import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, FileText, User, Heart, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase"; // Import supabase client

import {
  connectToBlockchain,
  getDailyReports,
  getFiles,
} from "../contracts/ContractFunctions";
import CountUp from "react-countup";
import type { DailyReport, File, Patient } from "../types/database"; // Add Patient type

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function Dashboard() {
  const [vitals, setVitals] = useState<DailyReport[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [profile, setProfile] = useState<Patient | null>(null); // Add profile state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Initialize blockchain connection and fetch initial data
  useEffect(() => {
    const initData = async () => {
      try {
        // Connect to blockchain (this could prompt MetaMask, etc.)
        await connectToBlockchain();
        // Fetch vitals and documents from blockchain
        await fetchVitals();
        await fetchDocuments();

        // Fetch profile from Supabase
        await fetchProfileFromSupabase();
      } catch (error: any) {
        console.error("Error initializing data:", error);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Also load from local storage on mount for offline caching
  useEffect(() => {
    const storedVitals = localStorage.getItem("blockchainVitals");
    if (storedVitals) {
      setVitals(JSON.parse(storedVitals));
    }
    const storedFiles = localStorage.getItem("blockchainFiles");
    if (storedFiles) {
      setFiles(JSON.parse(storedFiles));
    }
    const storedProfile = localStorage.getItem("supabaseProfile");
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, []);

  // New function to fetch profile data from Supabase
  const fetchProfileFromSupabase = async () => {
    try {
      setRefreshing(true);

      // Get the current user from Supabase auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication error: " + authError?.message);
      }

      // Fetch profile from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Update state and save to local storage
      setProfile(profileData);
      localStorage.setItem("supabaseProfile", JSON.stringify(profileData));
    } catch (error: any) {
      console.error("Error fetching profile from Supabase:", error);
      setError("Failed to load profile from Supabase.");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchVitals = async () => {
    try {
      setRefreshing(true);
      // Get the current user's Ethereum address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentAddress = accounts[0];

      // Fetch vitals from blockchain
      const reports = await getDailyReports(currentAddress);
      if (reports) {
        // Format the data into our DailyReport format
        const formattedReports: DailyReport[] = reports.map((report: any) => ({
          timestamp: Number(report.timestamp),
          bloodPressureSystolic: Number(report.bloodPressureSystolic),
          bloodPressureDiastolic: Number(report.bloodPressureDiastolic),
          bloodSugar: Number(report.bloodSugar),
          heartRate: Number(report.heartRate),
        }));

        // Sort reports in descending order by timestamp (newest first)
        formattedReports.sort((a, b) => b.timestamp - a.timestamp);

        // Update state and save to local storage
        setVitals(formattedReports);
        localStorage.setItem(
          "blockchainVitals",
          JSON.stringify(formattedReports)
        );
      }
    } catch (error: any) {
      console.error("Error fetching vitals from blockchain:", error);
      setError("Failed to load vital records from blockchain.");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setRefreshing(true);
      // Get the current user's Ethereum address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentAddress = accounts[0];

      // Fetch files from blockchain
      const docs = await getFiles(currentAddress);
      if (docs) {
        // Format files into our File interface
        const formattedFiles: File[] = docs.map((doc: any) => ({
          name: doc.name,
          category: doc.category,
          cid: doc.cid,
          timestamp: Number(doc.timestamp),
          description: doc.description,
        }));

        // Sort files by timestamp (newest first)
        formattedFiles.sort((a, b) => b.timestamp - a.timestamp);

        // Update state and local storage
        setFiles(formattedFiles);
        localStorage.setItem("blockchainFiles", JSON.stringify(formattedFiles));
      }
    } catch (err: any) {
      console.error("Error fetching documents from blockchain:", err);
      setError("Failed to load documents from blockchain.");

      // Attempt to load from local storage if blockchain fetch fails
      const storedFiles = localStorage.getItem("blockchainFiles");
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate age from date of birth (using the Supabase format)
  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    return Math.floor(
      (new Date().getTime() - new Date(dob).getTime()) / 31557600000
    );
  };

  const chartData = vitals
    .map((vital) => ({
      date: new Date(vital.timestamp * 1000).toLocaleDateString(),
      bloodPressure: vital.bloodPressureSystolic,
      heartRate: vital.heartRate,
      bloodSugar: vital.bloodSugar,
    }))
    .reverse();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name || "User"}!
          </h1>
          <p className="mt-1 text-gray-600">
            Here's your latest health overview
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <InfoCard
            icon={<Activity className="h-8 w-8 text-orange-600" />}
            title="Latest Vitals"
            link="/vitals"
          >
            {vitals[0] ? (
              <div className="mt-4 space-y-1 text-gray-600">
                <p>
                  Blood Pressure: {vitals[0].bloodPressureSystolic}/
                  {vitals[0].bloodPressureDiastolic}
                </p>
                <p>Blood Sugar: {vitals[0].bloodSugar} mg/dL</p>
                <p>Heart Rate: {vitals[0].heartRate} bpm</p>
              </div>
            ) : (
              <p className="mt-4 text-gray-600">No vitals recorded yet</p>
            )}
          </InfoCard>

          <InfoCard
            icon={<FileText className="h-8 w-8 text-orange-600" />}
            title="Documents"
            link="/documents"
          >
            <div className="mt-4 space-y-1 text-gray-600">
              <p className="text-4xl font-bold">
                <CountUp end={files.length} duration={2} />
              </p>
              <p>file(s) uploaded</p>
            </div>
          </InfoCard>

          <InfoCard
            icon={<User className="h-8 w-8 text-orange-600" />}
            title="Profile"
            link="/profile-setup"
          >
            <div className="mt-4 space-y-1 text-gray-600">
              <p>
                Age: {profile?.dob ? calculateAge(profile.dob) : "N/A"} years
              </p>
              <p>Blood Type: {profile?.blood || "Not set"}</p>
            </div>
          </InfoCard>
        </section>

        {vitals.length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow-md mb-10">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <h2 className="ml-2 text-xl font-semibold text-gray-900">
                Health Trends
              </h2>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bloodPressure"
                    stroke="#2563eb"
                    name="Blood Pressure"
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#dc2626"
                    name="Heart Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="bloodSugar"
                    stroke="#059669"
                    name="Blood Sugar"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Heart className="h-8 w-8 text-orange-600" />
            <h2 className="ml-3 text-xl font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Record New Data
              </h3>
              <div className="mt-4 space-y-4">
                <Link
                  to="/vitals"
                  className="block px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
                >
                  Add Vital Signs
                </Link>
                <Link
                  to="/documents"
                  className="block px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
                >
                  Upload Document
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Recent Activity
              </h3>
              <div className="mt-4 space-y-2">
                {vitals.slice(0, 3).map((vital, index) => (
                  <p key={index} className="text-gray-600">
                    Vitals recorded -{" "}
                    {new Date(vital.timestamp * 1000).toLocaleDateString()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable component for info cards in the dashboard
function InfoCard({
  icon,
  title,
  link,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  link: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={link}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-1 block"
    >
      <div className="flex items-center">
        {icon}
        <h2 className="ml-3 text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </Link>
  );
}

// Reusable component for quick link buttons
function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
    >
      {label}
    </Link>
  );
}
