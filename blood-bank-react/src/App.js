import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import Dashboard from './components/dashboard/dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes><Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/edit-profile" element={<EditProfile />} />  {/* Edit route */}
        <Route path="/profile" element={<DonorProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/request-blood" element={<DonorList />} />
        <Route path="/request-form" element={<RequestForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;