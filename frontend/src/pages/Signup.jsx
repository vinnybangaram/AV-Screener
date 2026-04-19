import React, { useState } from "react";
import { User, Mail, ShieldCheck, ArrowRight, Sparkles, Lock } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, signupUser } from "../services/api";
import toast from "react-hot-toast";
import LoginFooter from "../components/Legal/LoginFooter";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    confirm_password: "" 
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      const data = await signupUser(formData);
      if (data.success) {
        toast.success(data.message || "Enrollment pending verification.");
        setSubmitted(true);
      } else {
        toast.error("Enrollment failed: " + (data.error || "Access Denied"));
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Network synchronization failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const data = await googleLogin(credentialResponse.credential);
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome to the Terminal, " + data.user.name);
        window.location.href = "/dashboard";
      } else {
        toast.error("Google sync failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Verification error.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
        <div className="signup-container">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="signup-glass-wrap success-state"
                style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                <div className="success-icon-wrap">
                    <Mail size={64} color="#6366f1" />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginTop: '1.5rem' }}>Verification <span className="gradient-text">Required.</span></h1>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1rem', lineHeight: '1.6' }}>
                    We've dispatched a secure verification link to <strong>{formData.email}</strong>. 
                    Please confirm your identity to activate your terminal clearance.
                </p>
                <button 
                    className="signup-btn" 
                    style={{ marginTop: '2rem', width: '200px' }}
                    onClick={() => navigate("/login")}
                >
                    Return to Login
                </button>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="signup-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="signup-glass-wrap"
      >
        <div className="signup-grid">
          <div className="signup-info-panel">
            <div className="brand">AV SCREENER.</div>
            <div className="hero-text">
                <Sparkles className="sparkle-icon" size={24} />
                <h1>Elite <span className="gradient-text">Intelligence.</span></h1>
                <p>Join the 1% who trade with algorithmic clarity and institutional-grade data visualization.</p>
            </div>
            
            <div className="trust-badges">
                <div className="badge">
                    <ShieldCheck size={18} />
                    <span>Secure Terminal</span>
                </div>
                <div className="badge">
                    <ShieldCheck size={18} />
                    <span>Encrypted Credentials</span>
                </div>
            </div>
          </div>

          <div className="signup-form-panel">
            <div className="form-header">
                <h2>Initialize Access</h2>
                <p>Create your institutional account</p>
            </div>

            <form onSubmit={handleSignup} className="signup-form">
              <div className="input-box">
                <User size={18} className="icon" />
                <input 
                  type="text" 
                  placeholder="Preferred Username" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>

              <div className="input-box">
                <Mail size={18} className="icon" />
                <input 
                  type="email" 
                  placeholder="Official Email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="input-box">
                <Lock size={18} className="icon" />
                <input 
                  type="password" 
                  placeholder="Terminal Password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              <div className="input-box">
                <Lock size={18} className="icon" />
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                  required
                />
              </div>

              <button className="signup-btn" disabled={loading}>
                {loading ? "Registering..." : "Establish Connection"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="signup-divider">
                <span>STRATEGIC PARTNERS</span>
            </div>

            <div className="google-auth-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google Authentication Failed")}
                theme="filled_black"
                shape="pill"
                size="large"
                width="350"
              />
            </div>

            <p className="login-prompt">
              Already have clearance? <span onClick={() => navigate("/login")}>Login Here</span>
            </p>
          </div>
        </div>
      </motion.div>
      <div className="signup-footer-dock">
         <LoginFooter />
      </div>
    </div>
  );
};

export default Signup;
