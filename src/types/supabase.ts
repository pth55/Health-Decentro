export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          name: string;
          eth: string;
          dob: string;
          weight: number;
          height: number;
          aadhar: string;
          phone: string;
          blood: string;
          email: string;
          password: string;
          gender: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string; // if omitted, will be auto-generated
          name: string;
          eth: string;
          dob: string;
          weight: number;
          height: number;
          aadhar: string;
          phone: string;
          blood: string;
          email: string;
          password: string;
          gender: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          eth?: string;
          dob?: string;
          weight?: number;
          height?: number;
          aadhar?: string;
          phone?: string;
          blood?: string;
          email?: string;
          password?: string;
          gender?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          qualification: string;
          specialization?: string;
          phone: string;
          aadhar?: string;
          email: string;
          eth?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string; // Auto-generated if omitted
          name: string;
          qualification: string;
          specialization?: string;
          phone: string;
          aadhar?: string;
          email: string;
          eth?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          qualification?: string;
          specialization?: string;
          phone?: string;
          aadhar?: string;
          email?: string;
          eth?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  specialization?: string; // Optional
  phone: string;
  aadhar?: string; // Optional
  email: string;
  eth?: string; // Optional Ethereum address
  created_at: string; // Timestamp
  updated_at: string; // Timestamp
}

export const DoctorSchema = {
  id: "string",
  name: "string",
  qualification: "string",
  specialization: "string",
  phone: "string",
  aadhar: "string",
  email: "string",
  eth: "string",
  created_at: "string",
  updated_at: "string",
};
