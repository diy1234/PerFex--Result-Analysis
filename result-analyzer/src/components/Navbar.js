import React, { useState, useEffect } from "react";
import logo from "../logo2.png";

function Navbar({ title, logout, onLogoClick, openProfile, profileImage, darkMode, setDarkMode }) {

	const [profile, setProfile] = useState(null);

	useEffect(() => {
		const load = () => {
			try { setProfile(JSON.parse(localStorage.getItem('profile'))); } catch(e){ setProfile(null); }
		};
		load();
		const handler = (e) => { if(e && e.detail) setProfile(e.detail); else load(); };
		window.addEventListener('profileUpdated', handler);
		window.addEventListener('storage', load);
		return () => { window.removeEventListener('profileUpdated', handler); window.removeEventListener('storage', load); };
	}, []);

	// Use profileImage prop if provided (for faculty), otherwise use profile from localStorage
	const displayImage = profileImage || (profile && profile.profileImage);

	return (

		<div className="navbar">

			<div className="nav-left">
				<img src={logo} alt="logo" className="nav-logo" onClick={onLogoClick} style={{cursor:'pointer'}} />
				<h2 onClick={onLogoClick} style={{cursor:'pointer'}}>{title}</h2>
			</div>

			<div className="nav-right">

				<span className="nav-icon">🔔</span>

				{/* DARK MODE TOGGLE */}
				{setDarkMode && (
					<span 
						className="nav-icon" 
						onClick={() => setDarkMode(!darkMode)}
						title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
					>
						{darkMode ? "☀️" : "🌙"}
					</span>
				)}

				{displayImage ? (
					<img src={displayImage} alt="profile" onClick={() => { if (openProfile) openProfile(); try { window.dispatchEvent(new CustomEvent('openProfile')); } catch(e){} }} style={{width:36,height:36,borderRadius:999,objectFit:'cover',cursor:'pointer'}} />
				) : (
					<span className="nav-icon" onClick={() => { if (openProfile) openProfile(); try { window.dispatchEvent(new CustomEvent('openProfile')); } catch(e){} }} style={{cursor:'pointer'}}>👤</span>
				)}

				<button className="logout-btn" onClick={logout}>
					Logout
				</button>

			</div>

		</div>

	);

}

export default Navbar;