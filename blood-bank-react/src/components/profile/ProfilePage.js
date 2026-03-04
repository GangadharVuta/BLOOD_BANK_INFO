import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from '../../context/ThemeContext';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    setError('Not authenticated. Please login first.');
                    return;
                }

                const response = await axios.get('http://localhost:4000/api/users/profile', {
                    headers: {
                        Authorization: token,
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.data.status === 1) {
                    setUser(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to load profile');
                }
            } catch (error) {
                console.error('Profile fetch error:', error.response?.status, error.message);
                if (error.response?.status === 401) {
                    setError('Session expired. Please login again.');
                    localStorage.removeItem('token');
                } else {
                    setError('Access denied or error fetching profile.');
                }
            }
        };

        fetchProfile();
    }, []);

    if (error) return <div>{error}</div>;
    if (!user) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Welcome, {user.userName}</h2>
                <button 
                    onClick={toggleTheme}
                    style={{
                        padding: '10px 15px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--button-bg)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>
            <p>Email: {user.emailId}</p>
        </div>
    );
};

export default ProfilePage;
