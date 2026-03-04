import axios from "axios";
import { useEffect } from "react";
import { getFcmToken } from "./firebase";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/theme.css';
import './styles/responsive.css';

import Navbar from './components/navBar/Navbar';
import RegisterPage from './components/register/RegisterPage';
import HomePage from './components/home/HomePage';
import DonorProfile from './components/donorProfile/donorProfile';
import EditProfile from './components/donorProfile/editProfile';
import AboutUsPage from './components/navBar/AboutUsPage';
import FAQsPage from './components/navBar/FAQsPage';
import LoginForm from './components/login/LoginForm';
import ChangePassword from './components/changePassword/changePassword';
import DonorList from './components/donorList/donorList';
import RequestForm from './components/requestForm/requestForm';
import RequestBloodPage from './components/requestBlood/RequestBloodPage';
import Dashboard from './components/dashboard/dashboard';
import NearbyBloodBanks from './components/nearbyBloodBanks/nearbyBloodBanks';
import AddDonor from './components/donor/AddDonor';
import ListDonors from './components/donor/ListDonors';

function App() {

  useEffect(() => {
    const initFCM = async () => {
      try {
        if (!("Notification" in window)) {
          console.warn("❌ Browser does not support notifications");
          return;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.warn("🔕 Notification permission denied");
          return;
        }

        const token = await getFcmToken();
        console.log("🔔 FCM Token from App.js:", token);

        if (!token) return;

        const authToken = localStorage.getItem("token");
        if (!authToken) {
          console.warn("⚠️ User not logged in, skipping token save");
          return;
        }

        // ✅ SEND TOKEN TO BACKEND
        await axios.post(
          "http://localhost:4000/api/users/save-fcm-token",
          { fcmToken: token },
          {
            headers: {
              Authorization: authToken,
            },
          }
        );

        console.log("✅ FCM token saved in backend");

      } catch (error) {
        console.error("❌ FCM init error:", error);
      }
    };

    initFCM();
  }, []);

const saveFcmToken = async (token) => {
  if (!token) return;

  try {
    await axios.post(
      "http://localhost:4000/api/users/save-fcm-token",
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
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/profile" element={<DonorProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/request-blood" element={<RequestBloodPage />} />
        <Route path="/request-blood-form" element={<RequestForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nearby-blood-banks" element={<NearbyBloodBanks />} />
        <Route path="/add-donor" element={<AddDonor />} />
        <Route path="/list-donors" element={<ListDonors />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;