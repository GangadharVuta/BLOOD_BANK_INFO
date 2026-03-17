import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';
import './RequestBloodPage.css';
import DonorCard from './DonorCard';
import Navbar from '../navBar/Navbar';
import Sidebar from '../sidebar/sidebar';

const RequestBloodPage = () => {
  const navigate = useNavigate();

  // State management
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Selection state
  const [selectedDonors, setSelectedDonors] = useState([]);

  // Unique blood groups and locations
  const [bloodGroups, setBloodGroups] = useState([]);
  const [locations, setLocations] = useState([]);

  // Fetch merged donor list
  const fetchMergedDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        swal('Error', 'Please login first', 'error');
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/donors/merged/all', {
        headers: { Authorization: token }
      });

      if (response.data.status === 1) {
        const donorsList = response.data.data || [];
        setDonors(donorsList);

        // Extract unique blood groups
        const uniqueBloodGroups = [...new Set(donorsList.map(d => d.bloodGroup))].sort();
        setBloodGroups(uniqueBloodGroups);

        // Extract unique locations (city + village)
        const uniqueLocations = [...new Set(
          donorsList
            .map(d => d.city || d.village || d.pincode)
            .filter(Boolean)
        )].sort();
        setLocations(uniqueLocations);

        applyFilters(donorsList, searchTerm, selectedBloodGroup, selectedLocation);
      } else {
        setError(response.data.message || 'Failed to fetch donors');
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setError('Failed to fetch donors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMergedDonors();
  }, [fetchMergedDonors]);

  // Filter and search logic
  const applyFilters = (donorList, search, bloodGroup, location) => {
    let filtered = donorList;

    // Search by name (privacy: only on internal list)
    if (search.trim()) {
      filtered = filtered.filter(donor =>
        donor.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by blood group
    if (bloodGroup !== 'all') {
      filtered = filtered.filter(donor => donor.bloodGroup === bloodGroup);
    }

    // Filter by location (city or village)
    if (location !== 'all') {
      filtered = filtered.filter(donor =>
        (donor.city === location || donor.village === location || donor.pincode === location)
      );
    }

    setFilteredDonors(filtered);
  };

  // Handle filter changes
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setSearchTerm(search);
    applyFilters(donors, search, selectedBloodGroup, selectedLocation);
  };

  const handleBloodGroupChange = (e) => {
    const group = e.target.value;
    setSelectedBloodGroup(group);
    applyFilters(donors, searchTerm, group, selectedLocation);
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    setSelectedLocation(location);
    applyFilters(donors, searchTerm, selectedBloodGroup, location);
  };

  // Toggle donor selection
  const toggleDonorSelection = (donorId) => {
    setSelectedDonors(prev => {
      if (prev.includes(donorId)) {
        return prev.filter(id => id !== donorId);
      } else {
        return [...prev, donorId];
      }
    });
  };

  // Request blood from selected donors
  const handleRequestBlood = () => {
    if (selectedDonors.length === 0) {
      swal('Info', 'Please select at least one donor', 'info');
      return;
    }

    // Navigate to request form with selected donors
    navigate('/request-blood-form', {
      state: {
        selectedDonors,
        selectedBloodGroup: selectedBloodGroup !== 'all' ? selectedBloodGroup : 'any'
      }
    });
  };

  return (
    <div>
      <Navbar />
      <div className="request-blood-page responsive-layout">
        <Sidebar />

        <div className="request-blood-content">
          {/* Header */}
          <div className="request-header">
            <h1>🩸 Request Blood</h1>
            <p>Find donors and request blood. Select donors below and proceed to submit request.</p>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filter-group">
              <label>🔍 Search by Name</label>
              <input
                type="text"
                placeholder="Enter donor name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>🩸 Blood Group</label>
              <select
                value={selectedBloodGroup}
                onChange={handleBloodGroupChange}
                className="filter-select"
              >
                <option value="all">All Blood Groups</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>📍 Pincode</label>
              <select
                value={selectedLocation}
                onChange={handleLocationChange}
                className="filter-select"
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-info">
              Found <strong>{filteredDonors.length}</strong> donor(s) • <strong>{selectedDonors.length}</strong> selected
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching donors...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={fetchMergedDonors} className="retry-btn">Retry</button>
            </div>
          )}

          {/* No Donors Found */}
          {!loading && !error && filteredDonors.length === 0 && (
            <div className="no-donors-state">
              <p>No donors found matching your criteria.</p>
            </div>
          )}

          {/* Donors Grid */}
          {!loading && !error && filteredDonors.length > 0 && (
            <div className="donors-grid">
              {filteredDonors.map(donor => (
                <DonorCard
                  key={donor._id}
                  donor={donor}
                  isSelected={selectedDonors.includes(donor._id)}
                  onSelect={toggleDonorSelection}
                  currentUserId={localStorage.getItem('userId') || localStorage.getItem('id')}
                  requestId={null}
                />
              ))}
            </div>
          )}

          {/* Request Button */}
          {!loading && filteredDonors.length > 0 && selectedDonors.length > 0 && (
            <div className="request-button-container">
              <button
                className="submit-request-btn"
                onClick={handleRequestBlood}
              >
                📋 Proceed to Request ({selectedDonors.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestBloodPage;
