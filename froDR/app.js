import React, { useState } from "react";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [otpVisible, setOtpVisible] = useState(false);
  const [strengthWidth, setStrengthWidth] = useState("0%");
  const [strengthText, setStrengthText] = useState("");

  const checkStrength = (password) => {
    if (password.length < 6) {
      setStrengthWidth("30%");
      setStrengthText("Weak");
    } else if (
      password.match(/[A-Z]/) &&
      password.match(/[0-9]/) &&
      password.match(/[^A-Za-z0-9]/)
    ) {
      setStrengthWidth("100%");
      setStrengthText("Strong");
    } else {
      setStrengthWidth("60%");
      setStrengthText("Medium");
    }
  };

  const sendOTP = () => {
    alert("OTP Sent!");
    setOtpVisible(true);
  };

  const verifyOTP = () => {
    alert("OTP Verified!");
  };

  const login = () => {
    alert("Login Successful!");
  };

  return (
    <div className="container">

      <div className="left-panel">
        <div className="logo-container vertical">
          <img src="logo.png" alt="Logo" className="logo" />
          <h1>PREFEX RESULT ANALYZER</h1>
        </div>

        <button className="btn login-btn" onClick={() => setShowLogin(true)}>
          LOGIN
        </button>
        <button className="btn signup-btn" onClick={() => setShowLogin(false)}>
          SIGN UP
        </button>
      </div>

      {/* Login Form */}
      {showLogin && (
        <div className="form-box">
          <h2>LOGIN</h2>
          <input type="text" placeholder="University ID" />
          <input type="password" placeholder="Password" />
          <a href="#">Forgot Password?</a>
          <button onClick={login}>Login</button>
        </div>
      )}

      {/* Signup Form */}
      {!showLogin && (
        <div className="form-box">
          <h2>SIGN UP</h2>

          <input type="text" placeholder="Full Name" />
          <input type="email" placeholder="Email Address" />

          <input
            type="password"
            placeholder="New Password"
            onChange={(e) => checkStrength(e.target.value)}
          />

          <div className="strength-container">
            <div
              id="strengthBar"
              style={{ width: strengthWidth }}
            ></div>
          </div>

          <small id="strengthText">{strengthText}</small>

          <input type="password" placeholder="Confirm Password" />

          {otpVisible && (
            <>
              <input type="text" placeholder="Enter OTP" />
              <button onClick={verifyOTP}>Verify OTP</button>
            </>
          )}

          <button onClick={sendOTP}>Send OTP</button>
        </div>
      )}
    </div>
  );
}

export default App;