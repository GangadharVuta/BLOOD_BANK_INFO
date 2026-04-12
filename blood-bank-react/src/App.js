import axios from "axios";
import { useEffect } from "react";
import { getFcmToken } from "./firebase";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/theme.css';
import './styles/responsive.css';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import SEOHead from './components/common/SEOHead';
import Analytics from './components/common/Analytics';
import MainLayout from './components/common/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

import RegisterPage from './components/register/RegisterPage';
import HomePage from './components/home/HomePage';
import DonorProfile from './components/donorProfile/donorProfile';
import EditProfile from './components/donorProfile/editProfile';
import AboutUsPage from './components/navBar/AboutUsPage';
import FAQsPage from './components/navBar/FAQsPage';
import LoginForm from './components/login/LoginForm';
import ForgotPassword from './components/login/ForgotPassword';
import ChangePassword from './components/changePassword/changePassword';
import DonorList from './components/donorList/donorList';
import RequestForm from './components/requestForm/requestForm';
import RequestBloodPage from './components/requestBlood/RequestBloodPage';
import Dashboard from './components/dashboard/dashboard';
import NearbyBloodBanks from './components/nearbyBloodBanks/nearbyBloodBanks';
import AddDonor from './components/donor/AddDonor';
import ListDonors from './components/donor/ListDonors';
import FeedbackForm from './components/home/FeedbackForm';
import DonorRequests from './components/donorRequests/DonorRequests';

// Admin Components
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import DonorManagement from './components/admin/DonorManagement';
import RequestManagement from './components/admin/RequestManagement';
import FeedbackModeration from './components/admin/FeedbackModeration';
import AdminManagement from './components/admin/AdminManagement';
import ChatMonitoring from './components/admin/ChatMonitoring';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

function App() {

  useEffect(() => {
    const initFCM = async () => {
      try {
        // Check browser support first
        if (!("Notification" in window)) {
          console.info("ℹ️ Browser does not support notifications");
          return;
        }

        // Don't request permission on load, wait for user interaction
        if (Notification.permission === "denied") {
          console.info("ℹ️ Notifications permission denied by user");
          return;
        }

        if (Notification.permission === "granted") {
          const token = await getFcmToken();
          if (!token) {
            console.info("ℹ️ FCM token not available, messaging may not be supported");
            return;
          }

          const authToken = localStorage.getItem("token");
          if (!authToken) {
            console.debug("⚠️ User not logged in, skipping FCM token save");
            return;
          }

          await axios.post(
            "/api/users/save-fcm-token",
            { fcmToken: token },
            {
              headers: {
                Authorization: authToken,
              },
            }
          );
          console.log("✅ FCM token saved successfully");
        }
      } catch (error) {
        // Silently ignore FCM errors - it's not critical
        console.debug("ℹ️ FCM setup skipped:", error.message);
      }
    };

    initFCM();
  }, []);

const saveFcmToken = async (token) => {
  if (!token) return;

  try {
    await axios.post(
      "/api/users/save-fcm-token",
      { fcmToken: token },
      {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      }
    );
    console.log("✅ FCM token saved to backend");
  } catch (err) {
    console.error("❌ Failed to save FCM token", err);
  }
};

  return (
    <NotificationProvider>
      <LanguageProvider>
        <ThemeProvider>
          <SEOHead />
          <ErrorBoundary>
            <BrowserRouter>
              <Analytics />
              <Routes>
            {/* Routes with MainLayout */}
            <Route path="/*" element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/faqs" element={<FAQsPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/profile" element={<DonorProfile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/request-blood" element={<RequestBloodPage />} />
                  <Route path="/request-blood-form" element={<RequestForm />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/nearby-blood-banks" element={<NearbyBloodBanks />} />
                  <Route path="/add-donor" element={<AddDonor />} />
                  <Route path="/list-donors" element={<ListDonors />} />
                  <Route path="/give-feedback" element={<FeedbackForm />} />
                  <Route path="/my-requests" element={<DonorRequests />} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/donors"
                    element={
                      <ProtectedAdminRoute>
                        <DonorManagement />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/requests"
                    element={
                      <ProtectedAdminRoute>
                        <RequestManagement />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/feedback"
                    element={
                      <ProtectedAdminRoute>
                        <FeedbackModeration />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/admins"
                    element={
                      <ProtectedAdminRoute>
                        <AdminManagement />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/chat"
                    element={
                      <ProtectedAdminRoute>
                        <ChatMonitoring />
                      </ProtectedAdminRoute>
                    }
                  />
                </Routes>
              </MainLayout>
            } />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </ThemeProvider>
        </LanguageProvider>
      </NotificationProvider>
  );
}

export default App;