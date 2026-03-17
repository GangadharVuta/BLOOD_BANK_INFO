import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import Logo from '../../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { Sun, Moon, Globe } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const { theme, toggleTheme, isDark } = useTheme();
  const { t, language, changeLanguage, availableLanguages } = useTranslation();

  const handleLinkClick = (path) => {
    navigate(path);
    setOpenMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { label: t('home'), path: '/' },
    { label: t('findBloodBanks'), path: '/nearby-blood-banks' },
    { label: t('requestBlood'), path: '/request-blood' },
    { label: t('about'), path: '/about' },
    { label: t('faqs'), path: '/faqs' },
  ];

  const authLinks = isLoggedIn
    ? [{ label: t('dashboard'), path: '/dashboard' }, { label: t('profile'), path: '/profile' }]
    : [
        { label: t('login'), path: '/login' },
        { label: t('register'), path: '/register' },
      ];

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    closed: { x: 50, opacity: 0 },
    open: { x: 0, opacity: 1 }
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="navbar-container">
        {/* Brand/Logo */}
        <motion.div
          className="navbar-brand"
          onClick={() => handleLinkClick('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          role="button"
          tabIndex="0"
          aria-label="Go to home page"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLinkClick('/');
            }
          }}
        >
          <motion.img
            src={Logo}
            alt="BloodConnect Logo"
            className="navbar-logo-img"
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>

        {/* Theme Toggle Button */}
        <motion.button
          className="theme-toggle"
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isDark ? t('switchToLightMode') : t('switchToDarkMode')}
          aria-pressed={isDark}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                <Sun size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                <Moon size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Language Selector */}
        <div className="language-selector">
          <motion.button
            className="language-toggle"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Select language"
            aria-expanded={showLanguageMenu}
            aria-haspopup="listbox"
          >
            <Globe size={20} aria-hidden="true" />
            <span className="language-code">{language.toUpperCase()}</span>
          </motion.button>

          <AnimatePresence>
            {showLanguageMenu && (
              <motion.div
                className="language-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                role="listbox"
                aria-label="Language selection"
              >
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    className={`language-option ${language === lang ? 'active' : ''}`}
                    onClick={() => {
                      changeLanguage(lang);
                      setShowLanguageMenu(false);
                    }}
                    role="option"
                    aria-selected={language === lang}
                  >
                    {lang === 'en' && 'English'}
                    {lang === 'hi' && 'हिंदी'}
                    {lang === 'es' && 'Español'}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Navigation Menu */}
        <motion.ul
          className="navbar-menu-desktop"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {navLinks.map((link) => (
            <motion.li
              key={link.path}
              className="navbar-item-desktop"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.a
                className={`navbar-link-desktop ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.path)}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {link.label}
              </motion.a>
            </motion.li>
          ))}

          {/* Auth Links */}
          <motion.li className="navbar-divider-desktop" />
          {authLinks.map((link) => (
            <motion.li
              key={link.path}
              className="navbar-item-desktop"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.a
                className={`navbar-link-desktop auth-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.path)}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {link.label}
              </motion.a>
            </motion.li>
          ))}
        </motion.ul>

        {/* Hamburger Menu */}
        <motion.button
          className={`hamburger ${openMenu ? 'active' : ''}`}
          onClick={() => setOpenMenu(!openMenu)}
          aria-label="Toggle menu"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            animate={openMenu ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            animate={openMenu ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            animate={openMenu ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>

        {/* Navigation Links */}
        <AnimatePresence>
          {openMenu && (
            <motion.ul
              className={`navbar-menu ${openMenu ? 'active' : ''}`}
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {navLinks.map((link) => (
                <motion.li
                  key={link.path}
                  className="navbar-item"
                  variants={itemVariants}
                >
                  <motion.a
                    className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => handleLinkClick(link.path)}
                    whileHover={{ scale: 1.05, x: 10 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {link.label}
                  </motion.a>
                </motion.li>
              ))}

              {/* Auth Links */}
              <motion.li className="navbar-divider" variants={itemVariants}></motion.li>
              {authLinks.map((link) => (
                <motion.li
                  key={link.path}
                  className="navbar-item"
                  variants={itemVariants}
                >
                  <motion.a
                    className={`navbar-link auth-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => handleLinkClick(link.path)}
                    whileHover={{ scale: 1.05, x: 10 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {link.label}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;