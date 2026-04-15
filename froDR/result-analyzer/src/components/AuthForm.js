import React, { useState } from "react";
import logo from "../logo2.png";
import { authAPI } from "../api";

function AuthForm({ setDashboard }) {

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  // PASSWORD STRENGTH CHECK
  const checkStrength = (pass) => {
    setPassword(pass);

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) setStrength("Weak");
    else if (score === 2 || score === 3) setStrength("Medium");
    else setStrength("Strong");
  };

  // ✅ UPDATED LOGIN FUNCTION (API CONNECTED)
  const login = async () => {
    try {
      const user = await authAPI.login(email, password, role);
      setDashboard(user.role);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">
          <img src={logo} alt="logo" className="auth-logo" />
          <div className="brand-text">
            <h2>Result Analyzer</h2>
            <p className="brand-sub">Student performance insights</p>
          </div>
        </div>

        <div className="form-box">

          <h2 className="form-title">
            {isLogin ? "Login" : "Create Account"}
          </h2>

          {/* ROLE */}
          <div className="role-selection">
            <label>
              <input
                type="radio"
                value="student"
                checked={role === "student"}
                onChange={(e) => setRole(e.target.value)}
              />
              Student
            </label>

            <label>
              <input
                type="radio"
                value="faculty"
                checked={role === "faculty"}
                onChange={(e) => setRole(e.target.value)}
              />
              Faculty
            </label>

            <label>
              <input
                type="radio"
                value="admin"
                checked={role === "admin"}
                onChange={(e) => setRole(e.target.value)}
              />
              Admin
            </label>
          </div>

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => checkStrength(e.target.value)}
            />

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          {/* FORGOT PASSWORD */}
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <span
              className="forgot-link"
              onClick={() => setShowForgot(true)}
              style={{ cursor: 'pointer' }}
            >
              Forgot password?
            </span>
          </div>

          {/* PASSWORD STRENGTH (SIGNUP) */}
          {!isLogin && (
            <div>
              <div className="strength-container">
                <div
                  className={`strength-bar ${strength.toLowerCase()}`}
                  style={{
                    width:
                      strength === "Weak" ? "33%" :
                      strength === "Medium" ? "66%" :
                      strength === "Strong" ? "100%" : "0%"
                  }}
                ></div>
              </div>
              <p className="strength-text">{strength}</p>
            </div>
          )}

          <button onClick={login}>
            {isLogin ? "Login" : "Create Account"}
          </button>

          <p className="switch">
            {isLogin ? "Don't have account?" : "Already have account?"}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? " Sign Up" : " Login"}
            </span>
          </p>

        </div>

        {/* FORGOT PASSWORD MODAL */}
        {showForgot && (
          <div className="forgot-modal">
            <div className="forgot-box">
              <h3>Reset Password</h3>
              <p>Enter your email to reset password.</p>

              <input
                className="forgot-input"
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />

              {forgotMsg && (
                <div className="forgot-message">{forgotMsg}</div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>

                {/* ✅ UPDATED FORGOT PASSWORD */}
                <button
                  className="forgot-btn"
                  onClick={async () => {
                    if (!forgotEmail) {
                      setForgotMsg('Enter a valid email');
                      return;
                    }
                    setForgotMsg('Sending...');
                    await authAPI.forgotPassword(forgotEmail);
                    setForgotMsg('If the email exists, a reset link has been sent.');
                  }}
                >
                  Send Reset Link
                </button>

                <button
                  className="forgot-btn"
                  style={{ background: '#ccc', color: '#000' }}
                  onClick={() => {
                    setShowForgot(false);
                    setForgotEmail('');
                    setForgotMsg('');
                  }}
                >
                  Close
                </button>

              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default AuthForm;