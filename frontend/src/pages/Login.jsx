import React from "react";
import { User, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, manualLogin } from "../services/api";
import toast from "react-hot-toast";
import LoginFooter from "../components/Legal/LoginFooter";
import "./Login.css";

const Login = () => {
  const [manualData, setManualData] = React.useState({ username: "", email: "" });

  const handleManualLogin = async () => {
    if (!manualData.username || !manualData.email) {
      toast.error("Please enter both username and email.");
      return;
    }
    
    try {
      const data = await manualLogin(manualData.username, manualData.email);
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back, " + data.user.name);
        window.location.href = "/dashboard";
      } else {
        toast.error("Login failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Login request failed!");
      console.error(err);
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("🎟️ [Login] Google token received, verifying with backend...");
      
      const data = await googleLogin(credentialResponse.credential);

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back, " + data.user.name);
        console.log("✅ [Login] Auth successful, session established.");
        window.location.href = "/dashboard";
      } else {
        toast.error("Authentication failed: " + (data.error || data.detail));
      }
    } catch (error) {
      console.error("❌ [Login] Auth error:", error);
      toast.error("An error occurred during login.");
    }
  };

  return (
    <div className="login-main-container">
      <div className="login-page-wrapper">
      <div className="login-left">
        <div className="logo-top">AV SCREENER.</div>
        <h1>AV</h1>
        <h2>SCREENER.</h2>
        <p>Clarity in a Complex Market. Powerful screening. Smarter investing.</p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h3>Login</h3>

          <div className="input-group">
            <User size={20} />
            <input 
              type="text" 
              placeholder="Username" 
              value={manualData.username}
              onChange={(e) => setManualData({...manualData, username: e.target.value})}
            />
          </div>

          <div className="input-group">
            <Mail size={20} />
            <input 
              type="email" 
              placeholder="Email" 
              value={manualData.email}
              onChange={(e) => setManualData({...manualData, email: e.target.value})}
            />
          </div>

          <button className="primary-btn" onClick={handleManualLogin}>Sign In</button>

          <div className="divider">OR</div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => {
                console.error("❌ [Login] Google Auth Failed");
                toast.error("Google Login Failed. Please check if your current origin is whitelisted in Google Console.");
              }}
              theme="outline"
              size="large"
              width="340"
            />
          </div>

          <p className="signup">
            New user? <span>Create Account</span>
          </p>
        </div>
      </div>
    </div>
    <LoginFooter />
  </div>
  );
};

export default Login;
