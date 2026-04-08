import React from "react";
import { User, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

const Login = () => {
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("🎟️ [Login] Google token received, verifying with backend...");
      
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("✅ [Login] Auth successful, redirecting...");
        window.location.href = "/dashboard";
      } else {
        alert("Authentication failed: " + data.error);
      }
    } catch (error) {
      console.error("❌ [Login] Auth error:", error);
      alert("An error occurred during login.");
    }
  };

  return (
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
            <input type="text" placeholder="Username" />
          </div>

          <div className="input-group">
            <Mail size={20} />
            <input type="email" placeholder="Email" />
          </div>

          <button className="primary-btn">Sign In</button>

          <div className="divider">OR</div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log("Login Failed")}
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
  );
};

export default Login;
