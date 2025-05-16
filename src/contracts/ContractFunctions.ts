import Web3 from "web3";
import contractABI from "./ABI.ts"; // Update the path if necessary

const contractAddress = import.meta.env.VITE_HEALTH_RECORD_CONTRACT_ADDRESS;

let web3;
let contract;

/**
 * Connects to the blockchain and initializes the contract.
 */
export async function connectToBlockchain() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      // Request account access if needed
      await window.ethereum.request({ method: "eth_requestAccounts" });
      contract = new web3.eth.Contract(contractABI, contractAddress);
    } catch (error) {
      console.error("User denied account access or error occurred:", error);
      throw new Error("Unable to access MetaMask accounts.");
    }
  } else {
    alert("Please install MetaMask!");
    throw new Error("MetaMask not detected.");
  }
}

/**
 * Registers a patient by calling the smart contract's registerPatient function.
 */
export async function registerPatient() {
  // Ensure web3 and contract are initialized
  if (!web3 || !contract) {
    await connectToBlockchain();
  }
  const accounts = await web3.eth.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found. Make sure your wallet is unlocked.");
  }
  try {
    // Calling the smart contract function registerPatient()
    const receipt = await contract.methods
      .registerPatient()
      .send({ from: accounts[0] });
    return receipt;
  } catch (error) {
    console.error("Error in registerPatient:", error);
    throw error;
  }
}

export async function registerDoctor() {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.registerDoctor().send({ from: accounts[0] });
    alert("Doctor registered successfully.");
  } catch (error) {
    console.error("Error registering doctor:", error);
    alert("Failed to register doctor.");
  }
}

// Admin Registration (Admin Only)
export async function adminRegisterPatient(patientAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.adminRegisterPatient(patientAddress).send({
      from: accounts[0],
    });
    alert("Patient registered by admin successfully.");
  } catch (error) {
    console.error("Error in admin patient registration:", error);
    alert("Failed to register patient by admin.");
  }
}

export async function adminRegisterDoctor(doctorAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.adminRegisterDoctor(doctorAddress).send({
      from: accounts[0],
    });
    alert("Doctor registered by admin successfully.");
  } catch (error) {
    console.error("Error in admin doctor registration:", error);
    alert("Failed to register doctor by admin.");
  }
}

// ============================
// File Management Functions
// ============================

export async function addFile(name, cid, category, description) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods
      .addFile(name, cid, category, description)
      .send({ from: accounts[0] });
    alert("File added successfully.");
  } catch (error) {
    console.error("Error adding file:", error);
    alert("Failed to add file.");
  }
}

// ============================
// Daily Report Management
// ============================

export async function addDailyReport(
  bloodPressureSystolic,
  bloodPressureDiastolic,
  bloodSugar,
  heartRate
) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods
      .addDailyReport(
        bloodPressureSystolic,
        bloodPressureDiastolic,
        bloodSugar,
        heartRate
      )
      .send({ from: accounts[0] });
    alert("Daily report added successfully.");
  } catch (error) {
    console.error("Error adding daily report:", error);
    alert("Failed to add daily report.");
  }
}

// ============================
// Access Management Functions
// ============================

export async function grantAccess(doctorAddress: string) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods
      .grantAccess(doctorAddress)
      .send({ from: accounts[0] });
    alert("Access granted successfully.");
  } catch (error) {
    console.error("Error granting access:", error);
    alert("Failed to grant access.");
  }
}

export async function revokeAccess(doctorAddress: string) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods
      .revokeAccess(doctorAddress)
      .send({ from: accounts[0] });
    alert("Access revoked successfully.");
  } catch (error) {
    console.error("Error revoking access:", error);
    alert("Failed to revoke access.");
  }
}

// ============================
// Data Retrieval Functions
// ============================

export async function getFiles(patientAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    const files = await contract.methods
      .getFiles(patientAddress)
      .call({ from: accounts[0] });
    return files;
  } catch (error) {
    console.error("Error fetching files:", error);
    alert("Failed to fetch files.");
    return null;
  }
}

export async function getDailyReports(patientAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    const reports = await contract.methods
      .getDailyReports(patientAddress)
      .call({ from: accounts[0] });
    return reports;
  } catch (error) {
    console.error("Error fetching daily reports:", error);
    alert("Failed to fetch daily reports.");
    return null;
  }
}

export async function getDoctorAccess(patientAddress, doctorAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    const access = await contract.methods
      .getDoctorAccess(patientAddress, doctorAddress)
      .call({ from: accounts[0] });
    return access;
  } catch (error) {
    console.error("Error checking doctor access:", error);
    alert("Failed to check doctor access.");
    return false;
  }
}

export async function getPatientDoctors(patientAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    const doctors = await contract.methods
      .getPatientDoctors(patientAddress)
      .call({ from: accounts[0] });
    return doctors;
  } catch (error) {
    console.error("Error fetching patient doctors:", error);
    alert("Failed to fetch patient doctors.");
    return [];
  }
}

export async function getDoctorPatients(doctorAddress) {
  const accounts = await web3.eth.getAccounts();
  try {
    const patients = await contract.methods
      .getDoctorPatients(doctorAddress)
      .call({ from: accounts[0] });
    return patients;
  } catch (error) {
    console.error("Error fetching doctor patients:", error);
    alert("Failed to fetch doctor patients.");
    return [];
  }
}

/**
 * Checks if the provided address is a registered patient.
 * @param {string} address - Ethereum address to check.
 * @returns {Promise<boolean>} - True if the address belongs to a patient.
 */
export async function isPatient(address) {
  const accounts = await web3.eth.getAccounts();
  try {
    const result = await contract.methods.isPatient(address).call({
      from: accounts[0],
    });
    return result;
  } catch (error) {
    console.error("Error checking if address is a patient:", error);
    alert("Failed to verify patient status.");
    return false;
  }
}

/**
 * Checks if the provided address is a registered doctor.
 * @param {string} address - Ethereum address to check.
 * @returns {Promise<boolean>} - True if the address belongs to a doctor.
 */
export async function isDoctor(address) {
  const accounts = await web3.eth.getAccounts();
  try {
    const result = await contract.methods.isDoctor(address).call({
      from: accounts[0],
    });
    return result;
  } catch (error) {
    console.error("Error checking if address is a doctor:", error);
    alert("Failed to verify doctor status.");
    return false;
  }
}
