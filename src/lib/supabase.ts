import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
  db: {
    schema: "public",
  },
});

// Helper function to ensure profile exists
export async function ensureProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    const { data: newProfile, error: createError } = await supabase
      .from("patients")
      .insert([
        {
          id: user.id,
          name: user.email?.split("@")[0] || "User",
          dob: new Date("2000-01-01").toISOString(),
          phone: user.phone || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return null;
    }

    return newProfile;
  }

  return profile;
}

// Helper function for file uploads
export async function uploadFile(file: File, bucket: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Get the signed URL that will work for downloads
    const {
      data: { signedUrl },
      error: signedUrlError,
    } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry

    if (signedUrlError) throw signedUrlError;

    return {
      path: filePath,
      url: signedUrl, // Use signed URL instead of public URL
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Helper function to delete file from storage
export async function deleteFile(path: string, bucket: string) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
}

// Helper function to download file
export async function downloadFile(path: string, bucket: string) {
  try {
    // First try to get a signed URL
    const {
      data: { signedUrl },
      error: signedUrlError,
    } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (signedUrlError) throw signedUrlError;

    // Fetch the file using the signed URL
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error("Failed to download file");

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}
