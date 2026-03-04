import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import './Navbar.css';
import Logo from '../../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [openMenu, setOpenMenu] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLinkClick = (path) => {
    navigate(path);
    setOpenMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Find Blood Banks', path: '/nearby-blood-banks' },
    { label: 'Request Blood', path: '/request-blood' },
    { label: 'About', path: '/about' },
    { label: 'FAQs', path: '/faqs' },
  ];

  const authLinks = isLoggedIn
    ? [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Profile', path: '/profile' }]
    : [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
      ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand/Logo */}
        <div className="navbar-brand" onClick={() => handleLinkClick('/')}>
          <img src={Logo} alt="BloodConnect Logo" className="navbar-logo-img" />
        </div>

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        {/* Hamburger Menu */}
        <button
          className={`hamburger ${openMenu ? 'active' : ''}`}
          onClick={() => setOpenMenu(!openMenu)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <ul className={`navbar-menu ${openMenu ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.path} className="navbar-item">
              <a
                className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.path)}
              >
                {link.label}
              </a>
            </li>
          ))}

          {/* Auth Links */}
          <li className="navbar-divider"></li>
          {authLinks.map((link) => (
            <li key={link.path} className="navbar-item">
              <a
                className={`navbar-link auth-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.path)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
