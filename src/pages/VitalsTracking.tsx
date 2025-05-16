import { useState, useEffect } from "react";
import { Activity, TrendingUp, RefreshCw } from "lucide-react";
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
import {
  connectToBlockchain,
  addDailyReport,
  getDailyReports,
} from "../contracts/ContractFunctions";
import type { DailyReport } from "../types/database";

export function VitalsTracking() {
  const [vitals, setVitals] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [newVital, setNewVital] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    bloodSugar: "",
    heartRate: "",
  });

  // Initialize connection to blockchain
  useEffect(() => {
    const init = async () => {
      try {
        await connectToBlockchain();
        await fetchVitals();
      } catch (error: any) {
        console.error("Blockchain connection error:", error);
        setError(
          "Failed to connect to blockchain. Please make sure MetaMask is installed and unlocked."
        );
      }
    };

    init();
  }, []);

  // Load vitals from local storage when component mounts
  useEffect(() => {
    const storedVitals = localStorage.getItem("blockchainVitals");
    if (storedVitals) {
      setVitals(JSON.parse(storedVitals));
    }
  }, []);

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
        // Parse the blockchain data into our DailyReport format
        const formattedReports: DailyReport[] = reports.map((report: any) => ({
          timestamp: Number(report.timestamp),
          bloodPressureSystolic: Number(report.bloodPressureSystolic),
          bloodPressureDiastolic: Number(report.bloodPressureDiastolic),
          bloodSugar: Number(report.bloodSugar),
          heartRate: Number(report.heartRate),
        }));

        // Sort by timestamp (newest first)
        formattedReports.sort((a, b) => b.timestamp - a.timestamp);

        // Update state and local storage
        setVitals(formattedReports);
        localStorage.setItem(
          "blockchainVitals",
          JSON.stringify(formattedReports)
        );
      }
    } catch (error: any) {
      console.error("Error fetching vitals from blockchain:", error);
      setError("Failed to load vital records from blockchain");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate inputs
      // Validate inputs - improved validation with better error handling
      const systolic =
        newVital.bloodPressureSystolic === ""
          ? 0
          : parseInt(newVital.bloodPressureSystolic);
      const diastolic =
        newVital.bloodPressureDiastolic === ""
          ? 0
          : parseInt(newVital.bloodPressureDiastolic);
      const sugar =
        newVital.bloodSugar === "" ? 0 : parseFloat(newVital.bloodSugar);
      const heartRate =
        newVital.heartRate === "" ? 0 : parseInt(newVital.heartRate);

      // Check for NaN values first
      if (
        isNaN(systolic) ||
        isNaN(diastolic) ||
        isNaN(sugar) ||
        isNaN(heartRate)
      ) {
        throw new Error("Please enter valid numbers for all fields");
      }

      // Then check ranges
      if (systolic < 70 || systolic > 200)
        throw new Error("Invalid systolic pressure (70-200)");
      if (diastolic < 40 || diastolic > 130)
        throw new Error("Invalid diastolic pressure (40-130)");
      if (sugar < 30 || sugar > 600)
        throw new Error("Invalid blood sugar level (30-600)");
      if (heartRate < 40 || heartRate > 200)
        throw new Error("Invalid heart rate (40-200)");

      // Submit data to blockchain
      await addDailyReport(systolic, diastolic, sugar, heartRate);

      // Reset form
      setNewVital({
        bloodPressureSystolic: "",
        bloodPressureDiastolic: "",
        bloodSugar: "",
        heartRate: "",
      });

      // Refresh vitals data from blockchain
      await fetchVitals();
    } catch (error: any) {
      console.error("Error saving vitals to blockchain:", error);
      setError(error.message || "Failed to save vitals to blockchain");
    } finally {
      setLoading(false);
    }
  };

  const chartData = vitals
    .map((vital) => ({
      date: new Date(vital.timestamp * 1000).toLocaleDateString(),
      bloodPressure: vital.bloodPressureSystolic,
      heartRate: vital.heartRate,
      bloodSugar: vital.bloodSugar,
    }))
    .reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Track Your Vitals
              </h1>
            </div>
            <button
              onClick={fetchVitals}
              disabled={refreshing}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Vitals"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Blood Pressure (mmHg)
                </label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="number"
                    placeholder="Systolic"
                    value={newVital.bloodPressureSystolic}
                    onChange={(e) =>
                      setNewVital({
                        ...newVital,
                        bloodPressureSystolic: e.target.value,
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                    min="70"
                    max="200"
                  />
                  <span className="text-gray-500 self-center">/</span>
                  <input
                    type="number"
                    placeholder="Diastolic"
                    value={newVital.bloodPressureDiastolic}
                    onChange={(e) =>
                      setNewVital({
                        ...newVital,
                        bloodPressureDiastolic: e.target.value,
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                    min="40"
                    max="130"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  value={newVital.bloodSugar}
                  onChange={(e) =>
                    setNewVital({
                      ...newVital,
                      bloodSugar: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required
                  min="30"
                  max="600"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={newVital.heartRate}
                  onChange={(e) =>
                    setNewVital({
                      ...newVital,
                      heartRate: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required
                  min="40"
                  max="200"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving to Blockchain..." : "Record Vitals"}
              </button>
            </div>
          </form>
        </div>

        {vitals.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <h2 className="ml-3 text-xl font-semibold text-gray-900">
                Health Trends
              </h2>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bloodPressure"
                    stroke="#2563eb"
                    name="Blood Pressure (Systolic)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#dc2626"
                    name="Heart Rate"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="bloodSugar"
                    stroke="#059669"
                    name="Blood Sugar"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Records
          </h2>

          {vitals.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No vital records found. Add your first record above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Pressure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Sugar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heart Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vitals.map((vital, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vital.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.bloodPressureSystolic}/
                        {vital.bloodPressureDiastolic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.bloodSugar}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.heartRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
