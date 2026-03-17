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
import { Sun, Moon, Globe, Menu, X, Home, Users, Search, Heart, MessageSquare, Settings, LogOut, MapPin } from 'lucide-react';

const MainLayout = ({ children, title = "BloodConnect" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      ]
    : [
        { label: 'Nearby Blood Banks', path: '/nearby-blood-banks', icon: MapPin },
      ];

  const currentNavLinks = isAdminRoute ? adminNavLinks : userNavLinks;
  const authNavLinks = isAdminRoute ? [] : userNavLinks;

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`main-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => handleLinkClick(isAdminRoute ? '/admin/dashboard' : '/')}>
            <img src={Logo} alt="BloodConnect Logo" className="sidebar-logo" />
            <h2>BloodConnect</h2>
          </div>
          <p className="sidebar-subtitle">{isAdminRoute ? 'Admin Panel' : 'BloodConnect'}</p>
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
          <div className="nav-section">
            <h4>{isAdminRoute ? 'Management' : t('navigation')}</h4>
            {currentNavLinks.map((link) => {
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

          {/* Auth Navigation (only for non-admin routes) */}
          {!isAdminRoute && (
            <div className="nav-section">
              <h4>{isLoggedIn ? t('account') : t('auth')}</h4>
              {authNavLinks.map((link) => {
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
          )}

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