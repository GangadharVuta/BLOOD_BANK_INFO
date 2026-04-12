/**
 * ============================================
 * MAIN APPLICATION LAYOUT
 * ============================================
 * Professional layout with sidebar navigation for all pages
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';
import Logo from '../../assets/logo.png';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { Sun, Moon, Globe, Menu, X, Home, Users, Search, Heart, MessageSquare, Settings, LogOut, MapPin, LogIn, Send, CheckCircle } from 'lucide-react';

const MainLayout = ({ children, title = "BloodConnect" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDonorExpanded, setIsDonorExpanded] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { t, language, changeLanguage, availableLanguages } = useTranslation();

  const isLoggedIn = !!localStorage.getItem('token');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const adminToken = localStorage.getItem('adminToken');
  const adminRole = localStorage.getItem('adminRole') || 'admin';

  const handleLinkClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    if (isAdminRoute) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminRole');
      navigate('/admin/login');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/');
    }
    setSidebarOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Sidebar menu item state checks
  const isProfilePage = location.pathname === '/profile';
  const isChangePasswordPage = location.pathname === '/change-password';
  const isDashboardPage = location.pathname === '/dashboard';
  const isRequestBloodPage = location.pathname === '/request-blood';
  const isBloodBanksPage = location.pathname === '/nearby-blood-banks';
  const isAddDonorPage = location.pathname === '/add-donor';
  const isListDonorsPage = location.pathname === '/list-donors';
  const isDonorActivePage = isAddDonorPage || isListDonorsPage;
  const isFeedbackPage = location.pathname === '/give-feedback';
  const isMyRequestsPage = location.pathname === '/my-requests';

  // Sidebar menu handlers
  const handleDonorToggle = () => {
    setIsDonorExpanded(!isDonorExpanded);
  };

  const handleAddDonor = () => {
    handleLinkClick('/add-donor');
  };

  const handleListDonors = () => {
    handleLinkClick('/list-donors');
  };

  const handleChangeProfile = () => {
    handleLinkClick('/profile');
  };

  const handleChangeDashboard = () => {
    handleLinkClick('/dashboard');
  };

  const handleChangeRequestBlood = () => {
    handleLinkClick('/request-blood');
  };

  const handleFindBloodBanks = () => {
    handleLinkClick('/nearby-blood-banks');
  };

  const handleChangePassword = () => {
    handleLinkClick('/change-password');
  };

  const handleGiveFeedback = () => {
    handleLinkClick('/give-feedback');
  };

  const handleMyRequests = () => {
    handleLinkClick('/my-requests');
  };

  const adminNavLinks = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Settings },
    { label: 'Donor Management', path: '/admin/donors', icon: Users },
    { label: 'Request Management', path: '/admin/requests', icon: Heart },
    { label: 'Feedback Moderation', path: '/admin/feedback', icon: MessageSquare },
    { label: 'Chat Monitoring', path: '/admin/chat', icon: MessageSquare },
    ...(adminRole === 'super_admin' ? [{ label: 'Admin Users', path: '/admin/admins', icon: Settings }] : []),
  ];

  const userNavLinks = isLoggedIn
    ? [
        { label: t('dashboard'), path: '/dashboard', icon: Settings },
        { label: t('profile'), path: '/profile', icon: Users },
        { label: 'My Requests', path: '/my-requests', icon: CheckCircle },
        { label: 'Request Blood', path: '/request-blood', icon: Heart },
        { label: 'Give Feedback', path: '/give-feedback', icon: Send },
      ]
    : [
        { label: 'Login', path: '/login', icon: LogIn },
        { label: 'Request Blood', path: '/request-blood', icon: Heart },
        { label: 'Nearby Blood Banks', path: '/nearby-blood-banks', icon: MapPin },
      ];

  const currentNavLinks = isAdminRoute ? adminNavLinks : userNavLinks;

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`main-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => handleLinkClick(isAdminRoute ? '/admin/dashboard' : '/')}>
            <img src={Logo} alt="BloodConnect Logo" className="sidebar-logo" />
            <h2>BloodConnect</h2>
          </div>
          {/* <p className="sidebar-subtitle">{isAdminRoute ? 'Admin Panel' : 'BloodConnect'}</p> */}
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Main Navigation */}
          <div className="nav-section scrollable-nav">
            <h4>{isAdminRoute ? 'Management' : 'Navigation'}</h4>
            
            {/* User Menu Items */}
            {!isAdminRoute && isLoggedIn && (
              <>
                {/* Profile */}
                <button
                  className={`nav-item ${isProfilePage ? 'active' : ''}`}
                  onClick={handleChangeProfile}
                >
                  <Users size={20} />
                  <span>Profile</span>
                </button>

                {/* Donor Menu */}
                <button
                  className={`nav-item donor-menu ${isDonorActivePage ? 'active' : ''} ${isDonorExpanded ? 'expanded' : ''}`}
                  onClick={handleDonorToggle}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span>🩸</span>
                    <span>Donor</span>
                  </span>
                  <span style={{ transform: isDonorExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
                </button>
                {isDonorExpanded && (
                  <div style={{ paddingLeft: '20px' }}>
                    <button
                      className={`nav-item submenu-item ${isAddDonorPage ? 'active' : ''}`}
                      onClick={handleAddDonor}
                    >
                      <span>➕ Add Donor</span>
                    </button>
                    <button
                      className={`nav-item submenu-item ${isListDonorsPage ? 'active' : ''}`}
                      onClick={handleListDonors}
                    >
                      <span>📋 List Donors</span>
                    </button>
                  </div>
                )}

                {/* Dashboard */}
                <button
                  className={`nav-item ${isDashboardPage ? 'active' : ''}`}
                  onClick={handleChangeDashboard}
                >
                  <Settings size={20} />
                  <span>Dashboard</span>
                </button>

                {/* Request Blood */}
                <button
                  className={`nav-item ${isRequestBloodPage ? 'active' : ''}`}
                  onClick={handleChangeRequestBlood}
                >
                  <Heart size={20} />
                  <span>Request Blood</span>
                </button>

                {/* My Requests (Donor) */}
                <button
                  className={`nav-item ${isMyRequestsPage ? 'active' : ''}`}
                  onClick={handleMyRequests}
                >
                  <CheckCircle size={20} />
                  <span>My Requests</span>
                </button>

                {/* Give Feedback */}
                <button
                  className={`nav-item ${isFeedbackPage ? 'active' : ''}`}
                  onClick={handleGiveFeedback}
                >
                  <Send size={20} />
                  <span>Give Feedback</span>
                </button>

                {/* Find Blood Banks */}
                <button
                  className={`nav-item ${isBloodBanksPage ? 'active' : ''}`}
                  onClick={handleFindBloodBanks}
                >
                  <MapPin size={20} />
                  <span>Find Blood Banks</span>
                </button>

                {/* Change Password */}
                <button
                  className={`nav-item ${isChangePasswordPage ? 'active' : ''}`}
                  onClick={handleChangePassword}
                >
                  <Settings size={20} />
                  <span>Change Password</span>
                </button>
              </>
            )}

            {/* Admin Menu Items */}
            {isAdminRoute && adminNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  className={`nav-item ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => handleLinkClick(link.path)}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Non-logged-in user menu */}
            {!isAdminRoute && !isLoggedIn && currentNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  className={`nav-item ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => handleLinkClick(link.path)}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout for all authenticated users */}
          {(isLoggedIn || adminToken) && (
            <div className="nav-section">
              <button
                className="nav-item logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="main-topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <h1 className="page-title">{title}</h1>

          <div className="topbar-actions">
            {/* Language Selector */}
            <div className="language-selector">
              <button
                className="language-toggle"
                onClick={() => {/* Toggle language menu */}}
                aria-label="Select language"
              >
                <Globe size={20} />
                <span className="language-code">{language.toUpperCase()}</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;