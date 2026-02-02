import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import swal from 'sweetalert';
import Logo from '../../assets/logo.png';
import './nearbyBloodBanks.css';

const NearbyBloodBanks = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyBanks, setNearbyBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchRadius, setSearchRadius] = useState(5); // in km

    // Mock blood bank data - in production, this would come from your backend
    const mockBloodBanks = [
        {
            id: 1,
            name: 'Red Cross Blood Bank',
            address: '123 Medical St, Downtown',
            phone: '+91-9876543210',
            email: 'redcross@bloodbank.com',
            latitude: 28.7041,
            longitude: 77.1025,
            hours: '8:00 AM - 6:00 PM',
            services: ['Blood Donation', 'Blood Testing', 'Transfusion']
        },
        {
            id: 2,
            name: 'City Medical Blood Bank',
            address: '456 Hospital Ave, Central',
            phone: '+91-9876543211',
            email: 'citymedical@bloodbank.com',
            latitude: 28.6139,
            longitude: 77.2090,
            hours: '9:00 AM - 7:00 PM',
            services: ['Blood Donation', 'Plasma Collection', 'Testing']
        },
        {
            id: 3,
            name: 'Care Blood Services',
            address: '789 Health Lane, Suburbs',
            phone: '+91-9876543212',
            email: 'care@bloodbank.com',
            latitude: 28.5355,
            longitude: 77.3910,
            hours: '7:00 AM - 5:00 PM',
            services: ['Blood Donation', 'Transfusion', 'Counseling']
        },
        {
            id: 4,
            name: 'Life Blood Center',
            address: '321 Wellness Rd, East Side',
            phone: '+91-9876543213',
            email: 'life@bloodbank.com',
            latitude: 28.6125,
            longitude: 77.3400,
            hours: '8:00 AM - 8:00 PM',
            services: ['Blood Donation', 'Testing', 'Emergency Transfusion']
        },
        {
            id: 5,
            name: 'Hope Blood Donation Center',
            address: '654 Care St, North District',
            phone: '+91-9876543214',
            email: 'hope@bloodbank.com',
            latitude: 28.7589,
            longitude: 77.2360,
            hours: '10:00 AM - 6:00 PM',
            services: ['Blood Donation', 'Testing']
        }
    ];

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance.toFixed(2);
    };

    // Get user's current location
    const handleGetLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                findNearbyBanks(latitude, longitude);
            },
            (error) => {
                setError('Unable to get your location. ' + error.message);
                setLoading(false);
            }
        );
    };

    // Find nearby blood banks based on location
    const findNearbyBanks = (userLat, userLon) => {
        const nearby = mockBloodBanks
            .map(bank => ({
                ...bank,
                distance: calculateDistance(userLat, userLon, bank.latitude, bank.longitude)
            }))
            .filter(bank => parseFloat(bank.distance) <= searchRadius)
            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        setNearbyBanks(nearby);
        setLoading(false);

        if (nearby.length === 0) {
            swal('No blood banks found', `No blood banks found within ${searchRadius} km of your location`, 'info');
        }
    };

    // Handle search radius change
    const handleSearchRadiusChange = (e) => {
        const newRadius = parseInt(e.target.value);
        setSearchRadius(newRadius);
        if (userLocation) {
            findNearbyBanks(userLocation.latitude, userLocation.longitude);
        }
    };

    // Call blood bank
    const handleCallBank = (phone) => {
        window.location.href = `tel:${phone}`;
    };

    // Send email to blood bank
    const handleEmailBank = (email) => {
        window.location.href = `mailto:${email}`;
    };

    return (
        <div className="nearby-banks-container">
            <nav className="navbar">
                <img src={Logo} alt="Logo" className="logo" />
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/faq">FAQs</Link>
                </div>
            </nav>

            <div className="banks-content">
                <h1>Find Nearby Blood Banks</h1>
                <p className="subtitle">Locate blood banks near you for quick access to blood services</p>

                <div className="location-section">
                    <button className="locate-btn" onClick={handleGetLocation} disabled={loading}>
                        {loading ? 'Getting Location...' : '📍 Find My Location'}
                    </button>

                    {userLocation && (
                        <div className="user-location-info">
                            <p><strong>Your Location:</strong> {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {userLocation && (
                    <div className="search-controls">
                        <label htmlFor="radius">Search Radius (km):</label>
                        <select id="radius" value={searchRadius} onChange={handleSearchRadiusChange}>
                            <option value={1}>1 km</option>
                            <option value={2}>2 km</option>
                            <option value={5}>5 km</option>
                            <option value={10}>10 km</option>
                            <option value={20}>20 km</option>
                            <option value={50}>50 km</option>
                        </select>
                    </div>
                )}

                {userLocation && nearbyBanks.length > 0 && (
                    <div className="results-info">
                        <p><strong>Found {nearbyBanks.length} blood banks</strong> within {searchRadius} km</p>
                    </div>
                )}

                <div className="blood-banks-grid">
                    {nearbyBanks.length > 0 ? (
                        nearbyBanks.map((bank) => (
                            <div key={bank.id} className="bank-card">
                                <div className="bank-header">
                                    <h3>{bank.name}</h3>
                                    <span className="distance-badge">
                                        📍 {bank.distance} km away
                                    </span>
                                </div>

                                <div className="bank-details">
                                    <div className="detail-item">
                                        <span className="label">Address:</span>
                                        <span className="value">{bank.address}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">Hours:</span>
                                        <span className="value">{bank.hours}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">Services:</span>
                                        <div className="services-list">
                                            {bank.services.map((service, idx) => (
                                                <span key={idx} className="service-tag">{service}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bank-actions">
                                    <button 
                                        className="action-btn call-btn"
                                        onClick={() => handleCallBank(bank.phone)}
                                        title={bank.phone}
                                    >
                                        📞 Call
                                    </button>
                                    <button 
                                        className="action-btn email-btn"
                                        onClick={() => handleEmailBank(bank.email)}
                                        title={bank.email}
                                    >
                                        ✉️ Email
                                    </button>
                                    <button className="action-btn directions-btn">
                                        🗺️ Directions
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : userLocation ? (
                        <div className="no-results">
                            <p>🔍 No blood banks found within your search radius.</p>
                            <p>Try increasing the search radius or check back later.</p>
                        </div>
                    ) : (
                        <div className="no-location">
                            <p>📍 Click "Find My Location" to discover nearby blood banks</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NearbyBloodBanks;
