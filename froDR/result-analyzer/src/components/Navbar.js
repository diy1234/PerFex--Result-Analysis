import React, { useState, useEffect, useRef } from "react";
import logo from "../logo2.png";

function Navbar({ title, logout, onLogoClick, openProfile, profileImage }) {

	const [profile, setProfile] = useState(null);
	const [showNotifs, setShowNotifs] = useState(false);
	const notifRef = useRef(null);

	const [notifications, setNotifications] = useState([
		{ id: 1, title: "New result uploaded", body: "Results for CIE1 are now available.", time: "2h ago", read: false },
		{ id: 2, title: "Student registered", body: "New student profile created.", time: "1d ago", read: false },
	]);

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

	const unreadCount = notifications.filter((n) => !n.read).length;

	const openNotifications = () => {
		setShowNotifs((v) => !v);
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (notifRef.current && !notifRef.current.contains(event.target)) {
				setShowNotifs(false);
			}
		};

		if (showNotifs) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showNotifs]);

	const markAllRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	};

	const onNotifClick = (id) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n))
		);
	};

	return (

		<div className="navbar">

			<div className="nav-left">
				<img src={logo} alt="logo" className="nav-logo" onClick={onLogoClick} style={{cursor:'pointer'}} />
				<h2 onClick={onLogoClick} style={{cursor:'pointer'}}>{title}</h2>
			</div>

			<div className="nav-right">

			<div className="notif" ref={notifRef}>
				<span
					className="nav-icon"
					onClick={(e) => {
						e.stopPropagation();
						openNotifications();
					}}
				>
					🔔
				</span>
				{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
				{showNotifs && (
					<div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
						<div className="notif-header">
							<span>Notifications</span>
							<button className="notif-clear" onClick={(e) => { e.stopPropagation(); markAllRead(); }}>
								Mark all read
							</button>
						</div>
						<div className="notif-list">
							{notifications.map((item) => (
								<div
									key={item.id}
									className={`notif-item ${item.read ? "read" : "unread"}`}
									onClick={() => onNotifClick(item.id)}
								>
									<div className="notif-title">{item.title}</div>
									<div className="notif-body">{item.body}</div>
									<div className="notif-time">{item.time}</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{displayImage ? (
				<img
					src={displayImage}
					alt="profile"
					onClick={() => {
						if (openProfile) openProfile();
						try { window.dispatchEvent(new CustomEvent('openProfile')); } catch (e) {}
					}}
					style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover', cursor: 'pointer' }}
				/>
			) : (
				<div
					className="nav-profile-placeholder"
					onClick={() => {
						if (openProfile) openProfile();
						try { window.dispatchEvent(new CustomEvent('openProfile')); } catch (e) {}
					}}
				>
					<span>👤</span>
				</div>
			)}

				<button className="logout-btn" onClick={logout}>
					Logout
				</button>

			</div>

		</div>

	);

}

export default Navbar;