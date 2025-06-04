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
        setMessage("Không thể lấy thông tin người dùng.");
      }
    }
    fetchUser();
  }, []);

  const handleInfoChange = async (e) => {
    e.preventDefault();
    try {
      await changeAccountInfo({ newName: formData.name, newEmail: formData.email });
      setMessage("Đã cập nhật thông tin tài khoản.");
      setEditing(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Cập nhật thất bại.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      var response = await changePassword(passwordData);
      if (!response.ok) throw Error (response.message)
      setMessage("Đã thay đổi mật khẩu.");
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Thay đổi mật khẩu thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản không? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteAccount();
      await logout();
      navigate('/login', { replace: true });
      window.location.reload();
    } catch {
      setMessage("Xóa tài khoản thất bại.");
    }
  };

  return (
    <div className="account-settings">
      <h1>Cài Đặt Tài Khoản</h1>

      {message && <div className="message">{message}</div>}

      {/* Thông tin người dùng */}
      <section>
        <h3>Thông Tin Tài Khoản</h3>
        {!editing ? (
          <>
            <p><strong>Tên hiển thị:</strong> {formData.name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <button onClick={() => setEditing(true)} className="edit-btn">Chỉnh sửa</button>
          </>
        ) : (
          <form onSubmit={handleInfoChange}>
            <input
              type="text"
              placeholder="Tên hiển thị"
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
              <button type="submit" className="save-btn">Lưu</button>
              <button type="button" onClick={() => setEditing(false)} className="cancel-btn">Hủy</button>
            </div>
          </form>
        )}
      </section>

      {/* Đổi mật khẩu */}
      <section>
        <h3>Đổi Mật khẩu</h3>
        <form onSubmit={handlePasswordChange}>
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          <button type="submit" className="update-password-btn">Cập nhật Mật khẩu</button>
        </form>
      </section>

      {/* Xóa tài khoản */}
      <section className="danger-zone">
        <h3>Vùng Nguy Hiểm</h3>
        <button onClick={handleDelete} className="delete-btn">
          Xóa Tài Khoản
        </button>
      </section>
    </div>
  );
}
