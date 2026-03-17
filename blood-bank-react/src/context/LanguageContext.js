import { createContext, useContext, useState, useEffect } from 'react';

// Translation data
const translations = {
  en: {
    // Navigation
    home: 'Home',
    findBloodBanks: 'Find Blood Banks',
    requestBlood: 'Request Blood',
    about: 'About',
    faqs: 'FAQs',
    dashboard: 'Dashboard',
    profile: 'Profile',
    login: 'Login',
    register: 'Register',

    // Home Page
    whyUseBloodConnect: 'Why Use BloodConnect?',
    quickDonorMatching: 'Quick Donor Matching',
    quickDonorMatchingDesc: 'Easily find matching blood donors based on your location and blood group.',
    realTimeListings: 'Real-time Listings',
    realTimeListingsDesc: 'Access live donor data to ensure fast communication and timely donations.',
    secureVerified: 'Secure & Verified',
    secureVerifiedDesc: 'User details are verified and securely stored for your protection.',
    communitySupport: 'Community Support',
    communitySupportDesc: 'Join a helpful community ready to respond in emergencies.',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    submit: 'Submit',

    // Theme
    switchToLightMode: 'Switch to light mode',
    switchToDarkMode: 'Switch to dark mode',

    // Admin
    adminPanel: 'Admin Panel',
    manageUsers: 'Manage Users',
    viewReports: 'View Reports',
    systemSettings: 'System Settings'
  },
  hi: {
    // Navigation
    home: 'होम',
    findBloodBanks: 'ब्लड बैंक खोजें',
    requestBlood: 'ब्लड का अनुरोध करें',
    about: 'हमारे बारे में',
    faqs: 'सामान्य प्रश्न',
    dashboard: 'डैशबोर्ड',
    profile: 'प्रोफ़ाइल',
    login: 'लॉग इन',
    register: 'रजिस्टर',

    // Home Page
    whyUseBloodConnect: 'BloodConnect क्यों इस्तेमाल करें?',
    quickDonorMatching: 'त्वरित दाता मिलान',
    quickDonorMatchingDesc: 'अपने स्थान और ब्लड ग्रुप के आधार पर आसानी से मिलान करने वाले ब्लड दाताओं को खोजें।',
    realTimeListings: 'रियल-टाइम लिस्टिंग',
    realTimeListingsDesc: 'तेजी से संचार और समय पर दान सुनिश्चित करने के लिए लाइव दाता डेटा तक पहुंचें।',
    secureVerified: 'सुरक्षित और सत्यापित',
    secureVerifiedDesc: 'उपयोगकर्ता विवरण सत्यापित और सुरक्षित रूप से संग्रहीत किए जाते हैं।',
    communitySupport: 'समुदाय सहायता',
    communitySupportDesc: 'आपातकालीन स्थितियों में प्रतिक्रिया देने के लिए सहायक समुदाय में शामिल हों।',

    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'मिटाएं',
    edit: 'संपादित करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    submit: 'सबमिट करें',

    // Theme
    switchToLightMode: 'लाइट मोड में स्विच करें',
    switchToDarkMode: 'डार्क मोड में स्विच करें',

    // Admin
    adminPanel: 'एडमिन पैनल',
    manageUsers: 'उपयोगकर्ताओं को प्रबंधित करें',
    viewReports: 'रिपोर्ट देखें',
    systemSettings: 'सिस्टम सेटिंग्स'
  },
  es: {
    // Navigation
    home: 'Inicio',
    findBloodBanks: 'Buscar Bancos de Sangre',
    requestBlood: 'Solicitar Sangre',
    about: 'Acerca de',
    faqs: 'Preguntas Frecuentes',
    dashboard: 'Panel de Control',
    profile: 'Perfil',
    login: 'Iniciar Sesión',
    register: 'Registrarse',

    // Home Page
    whyUseBloodConnect: '¿Por qué usar BloodConnect?',
    quickDonorMatching: 'Coincidencia Rápida de Donantes',
    quickDonorMatchingDesc: 'Encuentra fácilmente donantes de sangre compatibles según tu ubicación y grupo sanguíneo.',
    realTimeListings: 'Listados en Tiempo Real',
    realTimeListingsDesc: 'Accede a datos de donantes en vivo para asegurar comunicación rápida y donaciones oportunas.',
    secureVerified: 'Seguro y Verificado',
    secureVerifiedDesc: 'Los detalles de los usuarios están verificados y almacenados de forma segura.',
    communitySupport: 'Apoyo Comunitario',
    communitySupportDesc: 'Únete a una comunidad solidaria lista para responder en emergencias.',

    // Common
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    search: 'Buscar',
    filter: 'Filtrar',
    submit: 'Enviar',

    // Theme
    switchToLightMode: 'Cambiar a modo claro',
    switchToDarkMode: 'Cambiar a modo oscuro',

    // Admin
    adminPanel: 'Panel de Administración',
    manageUsers: 'Administrar Usuarios',
    viewReports: 'Ver Reportes',
    systemSettings: 'Configuración del Sistema'
  }
};

const LanguageContext = createContext();

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check for saved language preference or default to 'en'
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const availableLanguages = Object.keys(translations);

  const value = {
    t,
    language,
    changeLanguage,
    availableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};