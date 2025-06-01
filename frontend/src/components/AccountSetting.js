import { useEffect, useState } from "react";
import {
  getAccountInfo,
  changeAccountInfo,
  changePassword,
  deleteAccount,
  logout,
} from "../APIs/auth-api.js";
import './AccountSetting.css';
import { useNavigate } from "react-router-dom";

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await getAccountInfo();
        setUser(res.data.user);
        setFormData({ name: res.data.user.name, email: res.data.user.email });
      } catch {
        setMessage("Unable to fetch user info.");
      }
    }
    fetchUser();
  }, []);

  const handleInfoChange = async (e) => {
    e.preventDefault();
    try {
      await changeAccountInfo({ newName: formData.name, newEmail: formData.email });
      setMessage("Account info updated.");
      setEditing(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await changePassword(passwordData);
      setMessage("Password changed.");
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Password change failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action is irreversible.")) return;
    try {
      await deleteAccount();
      await logout();
      navigate("/login");
    } catch {
      setMessage("Account deletion failed.");
    }
  };

  return (
    <div className="account-settings">
      <h1>Account Settings</h1>

      {message && <div className="message">{message}</div>}

      {/* User Info */}
      <section>
        <h3>Account Info</h3>
        {!editing ? (
          <>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <button onClick={() => setEditing(true)} className="edit-btn">Edit Info</button>
          </>
        ) : (
          <form onSubmit={handleInfoChange}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <div className="btn-group">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          </form>
        )}
      </section>

      {/* Change Password */}
      <section>
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <input
            type="password"
            placeholder="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          <button type="submit" className="update-password-btn">Update Password</button>
        </form>
      </section>

      {/* Delete Account */}
      <section className="danger-zone">
        <h3>Danger Zone</h3>
        <button onClick={handleDelete} className="delete-btn">
          Delete My Account
        </button>
      </section>
    </div>
  );
}
