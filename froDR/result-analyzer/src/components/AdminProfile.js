import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

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

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY));
      if (saved && typeof saved === "object") {
        setProfile((prev) => ({ ...prev, ...saved }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = () => {
    setEdit(false);
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent("adminProfileUpdated", { detail: profile }));
    alert("Profile updated successfully");
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
            disabled={!edit}
            onChange={handleChange}
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
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const imageData = reader.result;
                setProfile((prev) => {
                  const next = { ...prev, profileImage: imageData };
                  try {
                    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(next));
                    window.dispatchEvent(new CustomEvent("adminProfileUpdated", { detail: next }));
                  } catch (err) {
                    // ignore storage errors (e.g., too large)
                  }
                  return next;
                });
              };
              reader.readAsDataURL(file);
            }}
          />

          <label>Phone</label>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            disabled={!edit}
            onChange={handleChange}
          />

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
