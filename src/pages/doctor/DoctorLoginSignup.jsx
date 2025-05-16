// src/pages/DoctorLoginSignup.tsx
import React, { useState } from "react";
import { X, Mail, CheckCircle, Stethoscope } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { registerDoctor } from "../contracts/ContractFunctions";

export function DoctorLoginSignup({ showAuthModal, setShowAuthModal, walletAddress }) {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [hospital, setHospital] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [blockchainError, setBlockchainError] = useState(null);

    const validatePassword = (pass) => {
        return pass.length < 6
            ? "Password must be at least 6 characters long"
            : null;
    };

    const validatePhone = (phoneNumber) => {
        const phoneRegex = /^\+?[1-9]\d{9,11}$/;
        return !phoneRegex.test(phoneNumber)
            ? "Please enter a valid phone number (10-12 digits)"
            : null;
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
        setPhone("");
        setSpecialty("");
        setHospital("");
        setBlockchainError(null);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setBlockchainError(null);

        try {
            const passwordError = validatePassword(password);
            if (passwordError) {
                setError(passwordError);
                setLoading(false);
                return;
            }

            if (!walletAddress) {
                setError("Please connect your wallet before proceeding.");
                setLoading(false);
                return;
            }

            if (isSignUp) {
                const phoneError = validatePhone(phone);
                if (phoneError) {
                    setError(phoneError);
                    setLoading(false);
                    return;
                }

                // Create doctor in Supabase auth
                const { data: signUpData, error: signUpError } =
                    await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { phone: phone, role: "doctor" },
                            emailRedirectTo: "http://localhost:5174/doctor/profile-setup",
                        },
                    });

                if (signUpError) throw signUpError;

                if (signUpData.user) {
                    // Wait for user record
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    // Check if wallet already exists
                    const { data: existingDoctor } = await supabase
                        .from("doctors")
                        .select("id")
                        .eq("eth", walletAddress)
                        .single();

                    const { data: existingPatient } = await supabase
                        .from("patients")
                        .select("id")
                        .eq("eth", walletAddress)
                        .single();

                    if (existingDoctor || existingPatient) {
                        setError(
                            "This wallet address is already associated with an account. Please use a different wallet."
                        );
                        await supabase.auth.signOut();
                        setLoading(false);
                        return;
                    }

                    // Insert new doctor record
                    const { error: profileError } = await supabase.from("doctors").insert([
                        {
                            id: signUpData.user.id,
                            name: email.split("@")[0],
                            specialty: specialty || "General Medicine",
                            hospital: hospital || "",
                            phone: phone,
                            eth: walletAddress,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    ]);

                    if (profileError) {
                        console.error("Profile creation error:", profileError);
                        await supabase.auth.signOut();
                        throw new Error("Failed to create doctor profile. Please try again.");
                    }

                    // Register doctor on blockchain
                    try {
                        await registerDoctor();
                        setBlockchainError(null);
                    } catch (blockchainErr) {
                        console.error("Blockchain registration error:", blockchainErr);
                        setBlockchainError(blockchainErr.message);
                    }

                    setRegisteredEmail(email);
                    setShowSuccessModal(true);
                }
            } else {
                // Doctor login flow
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (signInData.user) {
                    // Check if user is a doctor
                    const { data: doctorData, error: doctorError } = await supabase
                        .from("doctors")
                        .select("eth")
                        .eq("id", signInData.user.id)
                        .single();

                    if (doctorError || !doctorData) {
                        await supabase.auth.signOut();
                        throw new Error("This account is not registered as a doctor.");
                    }

                    // Compare wallet addresses
                    if (doctorData.eth !== walletAddress) {
                        await supabase.auth.signOut();
                        throw new Error(
                            "The connected wallet doesn't match the one associated with this account. Please connect the correct wallet."
                        );
                    }

                    // Navigate to doctor dashboard
                    navigate("/doctor/dashboard");
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Retry blockchain registration
    const reattemptBlockchainRegistration = async () => {
        setLoading(true);
        try {
            await registerDoctor();
            setBlockchainError(null);
            alert("Blockchain transaction succeeded on retry.");
        } catch (err) {
            console.error("Retry blockchain registration error:", err);
            setBlockchainError(err.message);
            alert("Retry failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Success Modal
    const SuccessModal = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
                <div className="flex flex-col items-center justify-center text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Doctor Registration Successful!
                    </h2>
                    <div className="flex items-center justify-center mb-4">
                        <Mail className="h-5 w-5 text-orange-600 mr-2" />
                        <p className="text-gray-700">Verification email sent to:</p>
                    </div>
                    <p className="font-medium text-orange-600 mb-6">{registeredEmail}</p>
                    <p className="text-gray-600 mb-6">
                        Please check your inbox and click the verification link to activate
                        your account. You'll be redirected to complete your doctor profile setup
                        after verification.
                    </p>
                    {blockchainError && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            Blockchain registration failed: {blockchainError}
                        </div>
                    )}
                    {blockchainError && (
                        <button
                            onClick={reattemptBlockchainRegistration}
                            disabled={loading}
                            className="w-full mb-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? "Please wait..." : "Retry Blockchain Transaction"}
                        </button>
                    )}
                    <button
                        onClick={closeSuccessModal}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );

    if (!showAuthModal) return null;

    return (
        <>
            {/* Main Auth Modal */}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
                    <button
                        onClick={() => {
                            setShowAuthModal(false);
                            setError("");
                            setEmail("");
                            setPassword("");
                            setPhone("");
                            setSpecialty("");
                            setHospital("");
                        }}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="flex items-center mb-6">
                        <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isSignUp ? "Join as a Doctor" : "Doctor Login"}
                        </h2>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    {!walletAddress && (
                        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
                            Please connect your wallet before{" "}
                            {isSignUp ? "signing up" : "logging in"}
                        </div>
                    )}
                    {walletAddress && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                            Connected wallet: {walletAddress.substring(0, 16)}.....
                            {walletAddress.slice(-8)}
                        </div>
                    )}
                    <form onSubmit={handleAuth} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md border-gray-300 p-2"
                            required
                            placeholder="Email"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md border-gray-300 p-2"
                            required
                            minLength={6}
                            placeholder="Password"
                        />
                        {isSignUp && (
                            <>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full rounded-md border-gray-300 p-2"
                                    required
                                    placeholder="Phone Number"
                                />
                                <input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="w-full rounded-md border-gray-300 p-2"
                                    placeholder="Specialty (e.g., Cardiology)"
                                />
                                <input
                                    type="text"
                                    value={hospital}
                                    onChange={(e) => setHospital(e.target.value)}
                                    className="w-full rounded-md border-gray-300 p-2"
                                    placeholder="Hospital/Clinic"
                                />
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !walletAddress}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Please wait..." : isSignUp ? "Register as Doctor" : "Log In as Doctor"}
                        </button>
                    </form>
                    <div className="mt-4 text-sm text-red-400 text-center">
                        {isSignUp
                            ? "Note: Email & Wallet Address Can't be Changed After Registration."
                            : null}
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError("");
                                setEmail("");
                                setPassword("");
                                setPhone("");
                                setSpecialty("");
                                setHospital("");
                            }}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            {isSignUp
                                ? "Already registered as a doctor? Log in"
                                : "New doctor? Register here"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && <SuccessModal />}
        </>
    );
}