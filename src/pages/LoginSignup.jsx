import { useState } from "react";
import { X, Mail, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { registerPatient as blockchainRegisterPatient } from "../contracts/ContractFunctions";

export function LoginSignup({ showAuthModal, setShowAuthModal, walletAddress }) {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    // New state to track blockchain registration errors
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
        // Clear form fields
        setEmail("");
        setPassword("");
        setPhone("");
        setBlockchainError(null);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setBlockchainError(null);

        try {
            // Validate password length
            const passwordError = validatePassword(password);
            if (passwordError) {
                setError(passwordError);
                setLoading(false);
                return;
            }

            // Check if wallet is connected
            if (!walletAddress) {
                setError("Please connect your wallet before proceeding.");
                setLoading(false);
                return;
            }

            if (isSignUp) {
                // Validate phone number format
                const phoneError = validatePhone(phone);
                if (phoneError) {
                    setError(phoneError);
                    setLoading(false);
                    return;
                }

                // Create the user in Supabase authentication
                const { data: signUpData, error: signUpError } =
                    await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { phone: phone },
                            emailRedirectTo: "http://localhost:5174/profile-setup",
                        },
                    });

                if (signUpError) throw signUpError;

                if (signUpData.user) {
                    // Wait briefly for the user record to propagate
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    // Check if any patient record already has the same wallet address
                    const { data: existingPatient } = await supabase
                        .from("patients")
                        .select("id")
                        .eq("eth", walletAddress)
                        .single();

                    if (existingPatient) {
                        setError(
                            "This wallet address is already associated with an account. Please use a different wallet."
                        );
                        await supabase.auth.signOut();
                        setLoading(false);
                        return;
                    }

                    // Insert new patient record including the wallet address
                    const { error: profileError } = await supabase.from("patients").insert([
                        {
                            id: signUpData.user.id,
                            name: email.split("@")[0],
                            dob: new Date("2000-01-01").toISOString(),
                            phone: phone,
                            eth: walletAddress,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    ]);

                    if (profileError) {
                        console.error("Profile creation error:", profileError);
                        await supabase.auth.signOut();
                        throw new Error("Failed to create profile. Please try again.");
                    }

                    // Attempt blockchain registration for the patient
                    try {
                        await blockchainRegisterPatient();
                        setBlockchainError(null);
                    } catch (blockchainErr) {
                        console.error("Blockchain registration error:", blockchainErr);
                        // Instead of signing out immediately, store the error
                        setBlockchainError(blockchainErr.message);
                    }

                    // Show success modal with a notification that a verification email is sent
                    setRegisteredEmail(email);
                    setShowSuccessModal(true);
                }
            } else {
                // Login flow
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (signInData.user) {
                    // Fetch the user's stored wallet address from the patients table
                    const { data: patientData, error: patientError } = await supabase
                        .from("patients")
                        .select("eth")
                        .eq("id", signInData.user.id)
                        .single();

                    if (patientError) {
                        console.error("Error fetching patient data:", patientError);
                        throw new Error("Failed to verify wallet. Please try again.");
                    }

                    // If the user doesn't have a patient record, they need to complete setup
                    if (!patientData) {
                        navigate("/profile-setup");
                        return;
                    }

                    // Compare the connected wallet address with the one stored in the database
                    if (patientData.eth !== walletAddress) {
                        // If wallet addresses don't match, sign the user out and show error
                        await supabase.auth.signOut();
                        throw new Error(
                            "The connected wallet doesn't match the one associated with this account. Please connect the correct wallet."
                        );
                    }

                    // If everything is successful, navigate to dashboard
                    navigate("/dashboard");
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to reattempt the blockchain registration
    const reattemptBlockchainRegistration = async () => {
        setLoading(true);
        try {
            await blockchainRegisterPatient();
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

    // Success Modal - shows after successful registration
    const SuccessModal = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
                <div className="flex flex-col items-center justify-center text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Registration Successful!
                    </h2>
                    <div className="flex items-center justify-center mb-4">
                        <Mail className="h-5 w-5 text-orange-600 mr-2" />
                        <p className="text-gray-700">Verification email sent to:</p>
                    </div>
                    <p className="font-medium text-orange-600 mb-6">{registeredEmail}</p>
                    <p className="text-gray-600 mb-6">
                        Please check your inbox and click the verification link to activate
                        your account. You'll be redirected to complete your profile setup
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
                        }}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {isSignUp ? "Create an Account" : "Welcome Back"}
                    </h2>
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
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-md border-gray-300 p-2"
                                required
                                placeholder="Phone Number"
                            />
                        )}

                        <button
                            type="submit"
                            disabled={loading || !walletAddress}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
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
                            }}
                            className="text-orange-600 hover:text-orange-700"
                        >
                            {isSignUp
                                ? "Already have an account? Log in"
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal - Only shows after successful registration */}
            {showSuccessModal && <SuccessModal />}
        </>
    );
}
