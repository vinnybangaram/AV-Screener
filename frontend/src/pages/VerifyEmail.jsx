import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../services/api";
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState("verifying"); // verifying, success, error

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const runVerification = async () => {
            try {
                const data = await verifyEmail(token);
                if (data.success) {
                    setStatus("success");
                    toast.success("Security Clearance Granted.");
                } else {
                    setStatus("error");
                }
            } catch (err) {
                console.error(err);
                setStatus("error");
            }
        };

        runVerification();
    }, [token]);

    return (
        <div className="signup-container" style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="signup-glass-wrap"
                style={{ textAlign: 'center', padding: '4rem', maxWidth: '550px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                {status === "verifying" && (
                    <>
                        <Loader2 className="animate-spin" size={64} color="#6366f1" />
                        <h1 style={{ fontSize: '2rem', marginTop: '2rem' }}>Verifying <span className="gradient-text">Clearance...</span></h1>
                        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Establishing secure connection to the central authority.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
                            <ShieldCheck size={64} color="#22c55e" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', marginTop: '1.5rem' }}>Clearance <span className="gradient-text">Granted.</span></h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1rem', lineHeight: '1.6' }}>
                            Your identity has been verified. Your institutional terminal is now fully active.
                        </p>
                        <button 
                            className="signup-btn" 
                            style={{ marginTop: '2.5rem', width: '220px' }}
                            onClick={() => navigate("/login")}
                        >
                            Enter Terminal <ArrowRight size={18} />
                        </button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <AlertCircle size={64} color="#ef4444" />
                        <h1 style={{ fontSize: '2.5rem', marginTop: '1.5rem' }}>Validation <span style={{ color: '#ef4444' }}>Failed.</span></h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1rem', lineHeight: '1.6' }}>
                            The verification link is either invalid, expired, or has already been used for clearance.
                        </p>
                        <button 
                            className="signup-btn" 
                            style={{ marginTop: '2.5rem', width: '220px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                            onClick={() => navigate("/signup")}
                        >
                            Request New Link
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
