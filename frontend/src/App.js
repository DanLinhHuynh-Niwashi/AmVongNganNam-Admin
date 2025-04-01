import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import useAuth from "./hooks/useAuth";
import SideMenu from "./components/SideMenu";
import SongList from "./components/FileList";
import SongUploadForm from "./components/FileUpload";
import Signup from "./components/SignUp";
import Login from "./components/Login";
import "./App.css"
const App = () => {
    const { isAuthenticated } = useAuth();
    const [selectedSong, setSelectedSong] = useState(null);

    return (
        <Router >
            <div className="app-layout">
            {isAuthenticated && <SideMenu />} {/* Show Side Menu if logged in */}
            <div className="app-container" style={{ marginLeft: isAuthenticated ? "250px" : "0" }}>
                <Routes>
                    {/* Redirect signup & login if already authenticated */}
                    <Route path="/signup" element={isAuthenticated ? <Navigate to="/songs" /> : <Signup />} />
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/songs" /> : <Login />} />

                    {/* Protected Routes */}
                    {isAuthenticated ? (
                        <>
                            <Route path="/songs" element={<SongList onSelectSong={setSelectedSong} />} />
                            <Route path="/upload" element={<SongUploadForm selectedSong={selectedSong} />} />
                            <Route path="*" element={<Navigate to="/songs" />} />
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
