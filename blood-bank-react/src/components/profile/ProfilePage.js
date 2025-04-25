import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProfilePage = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:4000/api/users/profile', {
            headers: {
                Authorization: `${localStorage.getItem('token')}`
            }
        }).then(response => setUser(response.data.data))
          .catch(error => console.error('Access denied or error fetching profile.'));
    }, []);

    if (!user) return <div>Loading...</div>;

    return (
        <div>
            <h2>Welcome, {user.userName}</h2>
            <p>Email: {user.emailId}</p>
        </div>
    );
};

export default ProfilePage;
