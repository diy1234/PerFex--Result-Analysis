import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function ProfilePage({ setDashboard, setPage, darkMode, setDarkMode }) {
  const logout = () => setDashboard && setDashboard(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");

  const [rollNo] = useState("2023001");
  const [course] = useState("MCA");
  const [semester] = useState("Sem1");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileImage, setProfileImage] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");

  // Small reusable styles (inline so integration is immediate)
  const inputStyle = { width: '100%', padding: '8px 10px', marginTop: 6, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' };
  const labelStyle = { fontWeight: 600, display: 'block', marginTop: 8 };
  const sectionStyle = { padding: 12, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 12 };
  const primaryBtn = { background: '#0b79f7', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 6, cursor: 'pointer' };
  const secondaryBtn = { background: '#eee', color: '#333', border: 'none', padding: '10px 14px', borderRadius: 6, cursor: 'pointer' };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('profile'));
      if (saved) {
        setFullName(saved.fullName || "");
        setEmail(saved.email || "");
        setPhone(saved.phone || "");
        setDob(saved.dob || "");
        setGender(saved.gender || "");
        setAddress(saved.address || "");
        setCity(saved.city || "");
        setStateVal(saved.stateVal || "");
        setPincode(saved.pincode || "");
        setProfileImage(saved.profileImage || null);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const onImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const onSave = () => {
    if ((newPassword || confirmPassword) && newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const profile = {
      fullName, email, phone, dob, gender,
      address, city, stateVal, pincode,
      rollNo, course, semester,
      profileImage
    };

    localStorage.setItem('profile', JSON.stringify(profile));
    setSaveMessage('Profile saved');
    setTimeout(() => setSaveMessage(''), 3000);

    try {
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
    } catch (e) { /* ignore */ }
  };

  const onCancel = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('profile'));
      if (saved) {
        setFullName(saved.fullName || "");
        setEmail(saved.email || "");
        setPhone(saved.phone || "");
        setDob(saved.dob || "");
        setGender(saved.gender || "");
        setAddress(saved.address || "");
        setCity(saved.city || "");
        setStateVal(saved.stateVal || "");
        setPincode(saved.pincode || "");
        setProfileImage(saved.profileImage || null);
      } else {
        setFullName(''); setEmail(''); setPhone(''); setDob(''); setGender('');
        setAddress(''); setCity(''); setStateVal(''); setPincode('');
        setProfileImage(null);
      }
    } catch (e) { }
  };

  return (
    <div className="dashboard">
      <Navbar 
        title="Profile" 
        logout={logout} 
        onLogoClick={() => setPage && setPage('dashboard')} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="dashboard-body">
        <Sidebar setPage={setPage} setDashboard={setDashboard} setView={() => {}} />

        <div className="content">
          <h2>Edit Profile</h2>

          {saveMessage && <div style={{ color: 'green', marginBottom: 8 }}>{saveMessage}</div>}

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Personal Information</h3>

                <div style={{ marginBottom: 8 }}>
                  <label>Profile Photo</label><br />
                  {profileImage ? (
                    <img src={profileImage} alt="profile" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 120, height: 120, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>No Image</div>
                  )}

                  <div>
                    <input type="file" accept="image/*" onChange={onImageChange} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                </div>

                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
                </div>

                <div>
                  <label style={labelStyle}>DOB</label>
                  <input style={inputStyle} value={dob} onChange={e => setDob(e.target.value)} placeholder="DOB" />
                </div>

                <div>
                  <label style={labelStyle}>Gender</label>
                  <input style={inputStyle} value={gender} onChange={e => setGender(e.target.value)} placeholder="Gender" />
                </div>

                <div style={{ marginTop: 8 }}>
                  <h4 style={{ margin: 0 }}>Academic Information</h4>

                  <div style={{ marginTop: 8 }}>
                    <label style={labelStyle}>Roll No (Read Only)</label>
                    <input style={inputStyle} value={rollNo} readOnly />
                  </div>

                  <div>
                    <label style={labelStyle}>Course (Read Only)</label>
                    <input style={inputStyle} value={course} readOnly />
                  </div>

                  <div>
                    <label style={labelStyle}>Semester (Read Only)</label>
                    <input style={inputStyle} value={semester} readOnly />
                  </div>
                </div>

              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Contact Information</h3>

                <div>
                  <label style={labelStyle}>Address</label>
                  <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
                </div>

                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
                </div>

                <div>
                  <label style={labelStyle}>State</label>
                  <input style={inputStyle} value={stateVal} onChange={e => setStateVal(e.target.value)} placeholder="State" />
                </div>

                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input style={inputStyle} value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode" />
                </div>

                <h3 style={{ marginTop: 12 }}>Account Settings</h3>

                <div>
                  <label style={labelStyle}>New Password</label>
                  <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" />
                </div>

                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button style={primaryBtn} onClick={onSave}>Save Changes</button>
                  <button style={{ ...secondaryBtn, marginLeft: 8 }} onClick={onCancel}>Cancel</button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
