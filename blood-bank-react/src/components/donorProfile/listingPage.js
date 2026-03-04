import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import axios from 'axios';

const bloodGroupCompatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
};

const ListingPage = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get recipient blood group from URL parameter
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const recipientBloodGroup = queryParams.get('bloodGroup');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:4000/users');
                setDonors(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.message || 'Something went wrong');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter donors based on recipient's required blood group
    const filteredDonors = recipientBloodGroup
        ? donors.filter(donor => bloodGroupCompatibility[recipientBloodGroup]?.includes(donor.bloodGroup))
        : [];

    return (
        <div className="form-container">
            <h2>Available Donors for {recipientBloodGroup}</h2>

            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Error: {error}</div>
            ) : (
                <>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid black', padding: '8px' }}>#</th>
                                <th style={{ border: '1px solid black', padding: '8px' }}>Name</th>
                                <th style={{ border: '1px solid black', padding: '8px' }}>Phone Number</th>
                                <th style={{ border: '1px solid black', padding: '8px' }}>Blood Group</th>
                                <th style={{ border: '1px solid black', padding: '8px' }}>Pincode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDonors.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                                        No compatible donors found.
                                    </td>
                                </tr>
                            ) : (
                                filteredDonors.map((donor, index) => (
                                    <tr key={index}>
                                        <td style={{ border: '1px solid black', padding: '8px' }}>{index + 1}</td>
                                        <td style={{ border: '1px solid black', padding: '8px' }}>{donor.name}</td>
                                        <td style={{ border: '1px solid black', padding: '8px' }}>{donor.phoneNumber}</td>
                                        <td style={{ border: '1px solid black', padding: '8px' }}>{donor.bloodGroup}</td>
                                        <td style={{ border: '1px solid black', padding: '8px' }}>{donor.pincode}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </>
            )}

            <Link to="/">
                <button>Back to Registration</button>
            </Link>
        </div>
    );
};

export default ListingPage;
