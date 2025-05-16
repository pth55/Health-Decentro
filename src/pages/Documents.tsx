import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Filter,
  Loader,
  Download,
  RefreshCw,
  ExternalLink,
  File as FileIcon,
} from "lucide-react";
import {
  connectToBlockchain,
  addFile,
  getFiles,
} from "../contracts/ContractFunctions";
import type { File } from "../types/database";
import axios from "axios";

export function Documents() {
  const [documents, setDocuments] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDetails, setUploadDetails] = useState({
    title: "",
    category: "Other",
    notes: "",
    file: null as File | null,
    filePreview: null as string | null,
    fileType: "",
  });
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewFile, setViewFile] = useState<string | null>(null);

  const categories = [
    "Lab Report",
    "Prescription",
    "Radiology",
    "Surgery",
    "Discharge Summary",
    "Medical Certificate",
    "Insurance",
    "Other",
  ];

  // Initialize blockchain connection and fetch documents
  useEffect(() => {
    const init = async () => {
      try {
        await connectToBlockchain();
        await fetchDocuments();
      } catch (error: any) {
        console.error("Blockchain connection error:", error);
        setError(
          "Failed to connect to blockchain. Please make sure MetaMask is installed and unlocked."
        );
      }
    };

    init();
  }, []);

  // Filter documents when category changes
  useEffect(() => {
    filterDocuments();
  }, [selectedCategory]);

  const fetchDocuments = async () => {
    setIsFetching(true);
    setError(null);
    try {
      // Get the current user's Ethereum address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentAddress = accounts[0];

      // Fetch files from blockchain
      const files = await getFiles(currentAddress);

      if (files) {
        // Format the returned files to match our File interface
        const formattedFiles: File[] = files.map((file: any) => ({
          name: file.name,
          category: file.category,
          cid: file.cid,
          timestamp: Number(file.timestamp),
          description: file.description,
          fileType: getFileType(file.name),
        }));

        // Sort by timestamp (newest first)
        formattedFiles.sort((a, b) => b.timestamp - a.timestamp);

        // Save to state and local storage
        setDocuments(formattedFiles);
        localStorage.setItem("blockchainFiles", JSON.stringify(formattedFiles));
      }
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.message || "Failed to fetch documents from blockchain");

      // Try to load from local storage if blockchain fetch fails
      const storedFiles = localStorage.getItem("blockchainFiles");
      if (storedFiles) {
        setDocuments(JSON.parse(storedFiles));
      }
    } finally {
      setIsFetching(false);
      setIsRefreshing(false);
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) return "image";
    return "other";
  };

  const filterDocuments = () => {
    if (selectedCategory === "all") {
      // If we have documents in state, don't do anything
      return;
    }

    // Get all documents from local storage
    const storedFiles = localStorage.getItem("blockchainFiles");
    if (storedFiles) {
      const allFiles: File[] = JSON.parse(storedFiles);
      // Filter by selected category
      const filteredFiles = allFiles.filter(
        (file) => file.category === selectedCategory
      );
      setDocuments(filteredFiles);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDocuments();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPEG, and PNG files are allowed");
        return;
      }

      // Create file preview for images
      let filePreview = null;
      let fileType = "";

      if (file.type.startsWith("image/")) {
        filePreview = URL.createObjectURL(file);
        fileType = "image";
      } else if (file.type === "application/pdf") {
        fileType = "pdf";
      }

      setUploadDetails((prev) => ({
        ...prev,
        file,
        title: file.name,
        filePreview,
        fileType,
      }));
      setShowUploadModal(true);
      setError(null);
    }
  };

  const uploadToPinata = async (file: File): Promise<{ cid: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const apiKey = import.meta.env.VITE_PINATA_API_KEY;
    const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: apiKey,
            pinata_secret_api_key: secretKey,
          },
        }
      );

      return { cid: res.data.IpfsHash };
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw new Error("Failed to upload file to IPFS");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !uploadDetails.file ||
      !uploadDetails.title ||
      !uploadDetails.category
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload the file to Pinata/IPFS
      const { cid } = await uploadToPinata(uploadDetails.file);

      // 2. Store file metadata on blockchain
      await addFile(
        uploadDetails.title,
        cid,
        uploadDetails.category,
        uploadDetails.notes || ""
      );

      // 3. Refresh the documents list
      await fetchDocuments();

      // 4. Reset form and close modal
      setShowUploadModal(false);
      setUploadDetails({
        title: "",
        category: "Other",
        notes: "",
        file: null,
        filePreview: null,
        fileType: "",
      });
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (cid: string) => {
    const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";
    const fileUrl = `${ipfsGateway}${cid}`;
    setViewFile(fileUrl);
  };

  const handleDownload = async (cid: string, fileName: string) => {
    setIsDownloading(cid);
    try {
      const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";
      const fileUrl = `${ipfsGateway}${cid}`;

      // Fetch the file
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      // Create a download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download file");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleCloseModal = () => {
    setViewFile(null);
  };

  // Clean up any created object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (uploadDetails.filePreview) {
        URL.revokeObjectURL(uploadDetails.filePreview);
      }
    };
  }, [uploadDetails.filePreview]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="sm:text-2xl font-bold text-gray-900 text-xl">
              Medical Documents
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
              <label className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer transition-colors">
                <Upload className="h-5 w-5 mr-2" />
                Upload Document
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
              <button
                onClick={() => setError(null)}
                className="float-right font-bold"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-center mb-6">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {isFetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-orange-600 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc, index) => {
                const fileType = getFileType(doc.name);
                const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";
                const fileUrl = `${ipfsGateway}${doc.cid}`;

                return (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Preview section */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {fileType === "image" ? (
                        <img
                          src={fileUrl}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, show fallback
                            e.currentTarget.src = "/api/placeholder/400/300";
                          }}
                        />
                      ) : fileType === "pdf" ? (
                        <div className="flex flex-col items-center justify-center">
                          <FileIcon className="h-16 w-16 text-red-500" />
                          <span className="mt-2 text-sm text-gray-500">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-16 w-16 text-orange-500" />
                          <span className="mt-2 text-sm text-gray-500">
                            Document
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="font-medium text-gray-900 truncate"
                          title={doc.name}
                        >
                          {doc.name.length > 25
                            ? doc.name.slice(0, 25) + "..."
                            : doc.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(doc.cid)}
                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                            title="View"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.cid, doc.name)}
                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                            disabled={isDownloading === doc.cid}
                            title="Download"
                          >
                            {isDownloading === doc.cid ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </button>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                            title="Open in IPFS"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          {doc.category}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.timestamp * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-2 truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>

            {/* File Preview Section */}
            {uploadDetails.filePreview && (
              <div className="mb-4 border rounded-lg overflow-hidden">
                <img
                  src={uploadDetails.filePreview}
                  alt="File Preview"
                  className="w-full h-48 object-contain bg-gray-100"
                />
              </div>
            )}

            {/* PDF Icon Display */}
            {uploadDetails.fileType === "pdf" && (
              <div className="mb-4 flex flex-col items-center justify-center py-6 bg-gray-100 rounded-lg">
                <FileIcon className="h-16 w-16 text-red-500" />
                <p className="mt-2 text-sm text-gray-600">PDF Document</p>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadDetails.title}
                  onChange={(e) =>
                    setUploadDetails((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md py-2 px-3 text-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={uploadDetails.category}
                  onChange={(e) =>
                    setUploadDetails((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md py-2 px-3 text-gray-700"
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={uploadDetails.notes}
                  onChange={(e) =>
                    setUploadDetails((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md py-2 px-3 text-gray-700"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (uploadDetails.filePreview) {
                      URL.revokeObjectURL(uploadDetails.filePreview);
                    }
                    setShowUploadModal(false);
                    setUploadDetails({
                      title: "",
                      category: "Other",
                      notes: "",
                      file: null,
                      filePreview: null,
                      fileType: "",
                    });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View File Modal */}
      {viewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 p-2 text-white bg-red-500 rounded-full z-10"
            >
              ×
            </button>
            <div className="h-[80vh] overflow-auto">
              {viewFile.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={viewFile}
                  className="w-full h-full"
                  title="Document Viewer"
                  frameBorder="0"
                />
              ) : (
                <img
                  src={viewFile}
                  alt="Document Preview"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
