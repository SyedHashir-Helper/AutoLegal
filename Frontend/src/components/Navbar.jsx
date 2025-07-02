// src/components/Navbar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scale, User, ChevronDown } from 'lucide-react';
import '../styles/Hero.css'; // Reuse styling

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="flex items-center">
            <Scale className="h-8 w-8 text-primary-600 mr-3" />
            <span className="navbar-brand" style={{cursor: "pointer"}} onClick={() => navigate('/dashboard')}>AutoLegal</span>
          </div>
          <div className="navbar-nav" style={{ position: 'relative' }}>
            <div
              className="navbar-user cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <User className="h-5 w-5 mr-2" />
              <span>{user?.email}</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
            {dropdownOpen && (
              <div
                className="dropdown-menu"
                style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0 }}
              >
                <button className="dropdown-item" onClick={() => navigate('/profile')}>
                  Update Profile
                </button>
                <button className="dropdown-item" onClick={() => navigate('/preferences')}>
                  Update Preferences
                </button>
                <button className="dropdown-item" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
