import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { adminAPI } from "../api";

const ADMIN_PROFILE_KEY = "adminProfile";

function AdminProfile() {
  const [edit, setEdit] = useState(false);
  const [profile, setProfile] = useState({
    name: "Admin",
    email: "admin@college.edu",
    department: "Examination Cell",
    phone: "9876543210",
    profileImage: "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const apiProfile = await adminAPI.getProfile();
        if (apiProfile && typeof apiProfile === "object") {
          setProfile({
            name: apiProfile.name || "Admin",
            email: apiProfile.email || "admin@college.edu",
            department: apiProfile.department || "Examination Cell",
            phone: apiProfile.phone || "9876543210",
            profileImage: apiProfile.profileImage || "",
          });
          localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(apiProfile));
        }
      } catch (err) {
        try {
          const saved = JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY));
          if (saved && typeof saved === "object") {
            setProfile((prev) => ({ ...prev, ...saved }));
          }
        } catch (e) {
          // ignore
        }
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setEdit(false);
    try {
      await adminAPI.updateProfile({
        name: profile.name,
        department: profile.department,
        phone: profile.phone,
        profileImage: profile.profileImage,
      });
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent("adminProfileUpdated", { detail: profile }));
      setStatus("Profile updated successfully.");
    } catch (err) {
      setStatus(`Failed to update profile: ${err.message || err}`);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      setProfile((prev) => ({ ...prev, profileImage: imageData }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-page">
      <h2>Admin Profile</h2>

      <div className="profile-card">
        <div className="profile-avatar">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt="admin" />
          ) : (
            <div className="avatar-placeholder">No photo</div>
          )}
        </div>

        <div className="profile-details">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            disabled={!edit}
            onChange={handleChange}
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
          />

          <label>Department</label>
          <input
            type="text"
            name="department"
            value={profile.department}
            disabled={!edit}
            onChange={handleChange}
          />

          <label>Profile picture</label>
          <input
            type="file"
            accept="image/*"
            disabled={!edit}
            onChange={handleImageChange}
          />

          <label>Phone</label>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            disabled={!edit}
            onChange={handleChange}
          />

          {status && <div className="profile-status">{status}</div>}

          <div className="profile-buttons">
            {!edit ? (
              <button onClick={() => setEdit(true)}>Edit Profile</button>
            ) : (
              <button onClick={saveProfile}>Save Profile</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
