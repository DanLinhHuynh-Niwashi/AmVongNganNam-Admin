import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { FaSignOutAlt, FaMusic, FaUser } from 'react-icons/fa';
import { logout } from "../APIs/auth-api";
import './SideMenu.css';

const SideMenu = ({isAdmin}) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    
    alert("Logged out!");
    
    navigate('/login');
    console.log("Logged out!");
    window.location.href = "/login"; 
  };

  return (
    <div className="side-menu">
      <div className="app-name">
        <h4>AVNN</h4>
      </div>
      <Nav className="flex-column">
        {isAdmin &&
        <Nav.Link className="menu-item" onClick={() => navigate('/songs')}>
          <FaMusic className="icon" /> Song Manager
        </Nav.Link>
        }
        {isAdmin &&
        <Nav.Link className="menu-item" onClick={() => navigate('/players')}>
          <FaUser className="icon" /> Player Manager
        </Nav.Link>
        }
        <Nav.Link className="menu-item" onClick={() => navigate('/account')}>
          <FaUser className="icon" /> Account
        </Nav.Link>
        <Nav.Link className="menu-item" onClick={handleLogout}>
          <FaSignOutAlt className="icon" /> Logout
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default SideMenu;
