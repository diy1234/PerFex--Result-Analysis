import React, { useState } from "react";
import logo from "../logo2.png";

function AuthForm({ setDashboard }) {

const [isLogin, setIsLogin] = useState(true);
const [role, setRole] = useState("student");

const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [strength, setStrength] = useState("");
const [showForgot, setShowForgot] = useState(false);
const [forgotEmail, setForgotEmail] = useState("");
const [forgotMsg, setForgotMsg] = useState("");

const checkStrength = (pass) => {

setPassword(pass);

let score = 0;

if(pass.length >= 8) score++;
if(/[A-Z]/.test(pass)) score++;
if(/[0-9]/.test(pass)) score++;
if(/[^A-Za-z0-9]/.test(pass)) score++;

if(score <=1){
setStrength("Weak");
}
else if(score ===2 || score ===3){
setStrength("Medium");
}
else{
setStrength("Strong");
}

};

const login = () => {

if(role === "admin"){
setDashboard("admin");
}

else if(role === "faculty"){
setDashboard("faculty");
}

else{
setDashboard("student");
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

<h2 className="form-title">{isLogin ? "Login" : "Create Account"}</h2>

{/* ROLE RADIO BUTTONS */}

<div className="role-selection">

<label>
<input
type="radio"
name="role"
value="student"
checked={role === "student"}
onChange={(e)=>setRole(e.target.value)}
/>
Student
</label>

<label>
<input
type="radio"
name="role"
value="faculty"
checked={role === "faculty"}
onChange={(e)=>setRole(e.target.value)}
/>
Faculty
</label>

<label>
<input
type="radio"
name="role"
value="admin"
checked={role === "admin"}
onChange={(e)=>setRole(e.target.value)}
/>
Admin
</label>

</div>

{/* EMAIL */}

<input
type="email"
placeholder="Enter Email"
/>

{/* PASSWORD FIELD */}

<div className="password-box">

<input
type={showPassword ? "text" : "password"}
placeholder="Password"
value={password}
onChange={(e)=>checkStrength(e.target.value)}
/>

<span
className="eye-icon"
onClick={()=>setShowPassword(!showPassword)}
>
{showPassword ? "🙈" : "👁"}
</span>

</div>

{/* FORGOT PASSWORD LINK */}

<div style={{textAlign:'right', marginTop:8}}>
<span className="forgot-link" onClick={()=>setShowForgot(true)} style={{cursor:'pointer'}}>Forgot password?</span>
</div>

{/* PASSWORD METER ONLY IN SIGNUP */}

{!isLogin && (

<div>

<div className="strength-container">

<div
className={`strength-bar ${strength.toLowerCase()}`}
style={{
width:
strength==="Weak" ? "33%" :
strength==="Medium" ? "66%" :
strength==="Strong" ? "100%" : "0%"
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

<span onClick={()=>setIsLogin(!isLogin)}>
{isLogin ? " Sign Up" : " Login"}
</span>

</p>

</div>

{showForgot && (
<div className="forgot-modal">
<div className="forgot-box">
<h3>Reset Password</h3>
<p>Enter your account email and we'll send reset instructions.</p>

<input
className="forgot-input"
type="email"
placeholder="Email"
value={forgotEmail}
onChange={(e)=>setForgotEmail(e.target.value)}
/>

{forgotMsg && <div className="forgot-message">{forgotMsg}</div>}

<div style={{display:'flex', gap:8, marginTop:12}}>

<button
className="forgot-btn"
onClick={() => {

if(!forgotEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(forgotEmail)){
setForgotMsg('Please enter a valid email address');
return;
}

setForgotMsg('Sending reset link...');

setTimeout(()=>{
setForgotMsg('If the email exists, a reset link has been sent.');
},800);

}}
>
Send Reset Link
</button>

<button
className="forgot-btn"
style={{background:'#ccc',color:'#000'}}
onClick={()=>{
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