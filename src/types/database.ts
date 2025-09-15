// Patient interface redesigned to match the patients table schema
export interface Patient {
  id: string;
  name: string;
  eth: string;
  dob: string; // ISO date string (YYYY-MM-DD) format
  weight: number; // DECIMAL(5,2)
  height: number; // DECIMAL(5,2)
  aadhar: string; // Unique identifier
  phone: string; // Unique phone number
  blood: string;
  email: string; // Unique email address
  password: string;
  gender: string;
  description: string;
  created_at: string; // Timestamp string
  updated_at: string; // Timestamp string
}

// Doctor interface matching the doctors table schema
// export interface Doctor {
//   id: string;
//   name: string;
//   qualification: string;
//   specialization?: string; // Optional
//   phone: string;
//   aadhar: string; // Optional
//   email: string;
//   eth: string; // Optional Ethereum address
//   created_at: string; // Timestamp
//   updated_at: string; // Timestamp
// }

export interface File {
  name: string;
  category: string;
  cid: string;
  timestamp: number;
  description: string;
}

export interface DailyReport {
  timestamp: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  bloodSugar: number;
  heartRate: number;
}
