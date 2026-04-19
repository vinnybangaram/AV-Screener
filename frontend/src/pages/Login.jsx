import React, { useState } from "react";
import { User, Lock, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, manualLogin } from "../services/api";
import toast from "react-hot-toast";
import LoginFooter from "../components/Legal/LoginFooter";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username_or_email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username_or_email || !formData.password) {
      toast.error("Please enter credentials.");
      return;
    }
    
    setLoading(true);
    try {
      const data = await manualLogin(formData.username_or_email, formData.password);
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back, " + data.user.name);
        window.location.href = "/dashboard";
      } else {
        toast.error("Auth failed: " + (data.error || "Check your credentials"));
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication encounter an error.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const data = await googleLogin(credentialResponse.credential);
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back, " + data.user.name);
        window.location.href = "/dashboard";
      } else {
        toast.error("Authentication failed: " + (data.error || data.detail));
      }
    } catch (error) {
      console.error("❌ [Login] Auth error:", error);
      const errorMsg = error.response?.data?.detail || "An error occurred during login.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-main-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-page-wrapper"
      >
        <div className="login-left">
            <div className="logo-top">AV SCREENER.</div>
            <h1>AV</h1>
            <h2>SCREENER.</h2>
            <p>Clarity in a Complex Market. Institutional precision for individual traders.</p>
        </div>

        <div className="login-right">
            <div className="login-card glass-card">
            <h3>Terminal Clearance</h3>
            <p className="card-sub">Access your elite trading intelligence</p>

            <form onSubmit={handleLogin} className="login-form-box">
                <div className="input-group">
                    <User size={18} />
                    <input 
                        type="text" 
                        placeholder="Username / Email" 
                        value={formData.username_or_email}
                        onChange={(e) => setFormData({...formData, username_or_email: e.target.value})}
                        required
                    />
                </div>

                <div className="input-group">
                    <Lock size={18} />
                    <input 
                        type="password" 
                        placeholder="Terminal Password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                </div>

                <button className="primary-btn" disabled={loading}>
                    {loading ? "Authenticating..." : "Establish Link"}
                    {!loading && <ArrowRight size={18} />}
                </button>
            </form>

            <div className="divider">STRATEGIC SYNC</div>

            <div className="google-btn-container">
                <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={() => toast.error("Google Login Failed.")}
                    theme="outline"
                    shape="pill"
                    size="large"
                    width="350"
                />
            </div>

            </div>
        </div>
      </motion.div>
      <LoginFooter />
    </div>
  );
};

export default Login;
