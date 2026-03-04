import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

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
            </div>
            <p>Email: {user.emailId}</p>
        </div>
    );
};

export default ProfilePage;