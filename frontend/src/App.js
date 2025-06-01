import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import useAuth from "./hooks/useAuth";
import SideMenu from "./components/SideMenu";
import SongManager from "./components/SongManager";
import Signup from "./components/SignUp";
import Login from "./components/Login";
import "./App.css";
import AccountSettings from "./components/AccountSetting";

const App = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

  }

  return (
    <Router>
      <div className="app-layout">
        {isAuthenticated && <SideMenu isAdmin={isAdmin} />}
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/account" /> : <Signup />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/account" /> : <Login />} />

            {/* Protected Routes */}
            {isAuthenticated ? (
              <>
                <Route path="/account" element={<AccountSettings />} />
                {isAdmin ? (
                  <>
                    <Route path="/songs" element={<SongManager />} />
                    <Route path="*" element={<Navigate to="/songs" />} />
                  </>
                ) : (
                  <Route path="*" element={<div>Access Denied: Admins only</div>} />
                )}
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
