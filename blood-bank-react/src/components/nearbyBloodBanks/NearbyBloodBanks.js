import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "./nearbyBloodBanks.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icon for blood banks
const bloodBankIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Highlighted/selected icon for blood banks
const selectedBankIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [30, 50],
  iconAnchor: [15, 50],
  popupAnchor: [1, -40],
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// ✅ Format address from multiple fields
const formatAddress = (tags) => {
  const street = tags["addr:street"] || "";
  const city = tags["addr:city"] || "";
  const postcode = tags["addr:postcode"] || "";
  const fullAddress = tags["addr:full"] || "";

  if (fullAddress) {
    return fullAddress;
  }

  const parts = [street, city, postcode].filter((part) => part.trim() !== "");

  if (parts.length === 0) {
    return "Address not available";
  }

  return parts.join(", ");
};
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Return as number (2 decimal places) for proper calculation and comparison
  return Math.round(R * c * 100) / 100;
};

// ✅ Nominatim API - Geocode location string to lat/lon
const geocodeLocation = async (locationString) => {
  try {
    const controller = new AbortController();
    // Set timeout to 15 seconds for geocoding
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        locationString
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Blood-Bank-Finder/1.0 (React App)",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`Location "${locationString}" not found`);
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      address: result.display_name,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Geocoding request timeout. Please check your internet connection.");
    }
    console.error("❌ Geocoding error:", error.message);
    throw error;
  }
};

// ✅ Overpass API - Fetch blood banks and hospitals within 5km
const fetchNearbyBloodBanks = async (lat, lon, radiusKm = 5, retries = 3) => {
  const radiusMeters = radiusKm * 1000;

  // Simplified query - faster response, only hospitals
  const overpassQuery = `
    [out:json][timeout:20];
    node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
    out geom;
  `;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      // Set timeout to 30 seconds
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      console.log(`📡 Attempt ${attempt}/${retries}: Fetching from Overpass API...`);

      const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          body: overpassQuery,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} on attempt ${attempt}`);
        if (response.status === 504 && attempt < retries) {
          console.warn(`🔄 504 Gateway Timeout. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        console.warn("⚠️ No data from Overpass API");
        return [];
      }

      console.log(`✅ Got ${data.elements.length} hospitals from Overpass`);

      // Parse and enrich data
      const bloodBanks = data.elements.map((element) => {
        const elat = element.lat;
        const elon = element.lon;
        const distance = calculateDistance(lat, lon, elat, elon);
        const tags = element.tags || {};

        return {
          id: element.id,
          name: tags.name || "Hospital/Medical Facility",
          lat: elat,
          lon: elon,
          distance,
          phone: tags.phone || null,
          address: formatAddress(tags),
          addressStreet: tags["addr:street"] || null,
          addressCity: tags["addr:city"] || null,
          addressPostcode: tags["addr:postcode"] || null,
          website: tags.website || null,
          type: "Hospital",
          opening_hours: tags.opening_hours || null,
        };
      });

      // Sort by distance
      return bloodBanks.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ Attempt ${attempt}: Request timeout (>30 seconds)`);
      } else {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
      }

      if (attempt < retries) {
        const waitTime = 3000 * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  // Fallback: Return mock data if all attempts fail
  console.warn("⚠️ All attempts failed. Showing sample blood banks...");
  return getMockBloodBanks(lat, lon);
};

// 📍 Mock blood banks data (for testing/fallback)
const getMockBloodBanks = (lat, lon) => {
  const mockData = [
    {
      id: 'mock_1',
      name: 'Apollo Hospitals Blood Bank',
      lat: lat + 0.01,
      lon: lon + 0.01,
      distance: calculateDistance(lat, lon, lat + 0.01, lon + 0.01),
      phone: '+91-891-2345678',
      address: 'Apollo Hospitals, Main Road, Downtown',
      city: 'Current City',
      type: 'Blood Bank',
      website: 'https://www.apollohospitals.com',
      opening_hours: 'Mo-Su 09:00-21:00',
    },
    {
      id: 'mock_2',
      name: 'Central Medical Blood Donation Center',
      lat: lat - 0.015,
      lon: lon + 0.005,
      distance: calculateDistance(lat, lon, lat - 0.015, lon + 0.005),
      phone: '+91-891-9876543',
      address: 'Central Medical Complex, Hospital Street',
      city: 'Current City',
      type: 'Blood Bank',
      website: '',
      opening_hours: 'Mo-Fr 08:00-18:00; Sa 08:00-12:00',
    },
    {
      id: 'mock_3',
      name: 'Red Cross Blood Bank',
      lat: lat + 0.02,
      lon: lon - 0.01,
      distance: calculateDistance(lat, lon, lat + 0.02, lon - 0.01),
      phone: '+91-891-4567890',
      address: 'Red Cross Headquarters, Charity Road',
      city: 'Current City',
      type: 'Blood Bank',
      website: 'https://www.redcross.org',
      opening_hours: 'Mo-Su 10:00-20:00',
    },
  ];

  return mockData.sort((a, b) => a.distance - b.distance);
};

// ✅ Get availability status randomly (demo feature)
const getAvailabilityStatus = () => {
  const statuses = [
    { label: "Available", color: "available", icon: "✓" },
    { label: "Low Stock", color: "low", icon: "⚠" },
    { label: "Critical", color: "critical", icon: "!" },
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

// ✅ Main Component
const NearbyBloodBanks = () => {
  const [locationInput, setLocationInput] = useState("Visakhapatnam");
  const [userLocation, setUserLocation] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 78]); // Default India center
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [radius, setRadius] = useState(5); // Search radius in km
  const [showAll, setShowAll] = useState(false); // Toggle to show all results
  const defaultDisplayCount = 5; // Show only 5 nearest by default
  const mapRef = useRef(null);
  const popupRef = useRef({});

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("bloodBankFavorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("bloodBankFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Auto-search on component mount with default location
  useEffect(() => {
    const autoSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        // Geocode default location
        const location = await geocodeLocation(locationInput);
        setUserLocation(location);
        setMapCenter([location.lat, location.lon]);

        // Fetch blood banks with default radius
        let banks = await fetchNearbyBloodBanks(location.lat, location.lon, radius);

        // If no results from API, use mock data as fallback
        if (banks.length === 0) {
          console.warn("No live data available, using mock data...");
          banks = getMockBloodBanks(location.lat, location.lon);
          setError(`⚠️ Showing sample blood bank locations. Live API data unavailable.`);
        } else {
          // Show info if using mock data
          const mockBanks = banks.filter(b => String(b.id).includes('mock_'));
          if (mockBanks.length > 0) {
            setError(`⚠️ Showing ${mockBanks.length} sample locations (Live data unavailable. Please try again in a moment.)`);
          }
        }

        setBloodBanks(banks);
      } catch (err) {
        console.error("Auto-search error:", err);
        
        // Fallback: Use mock data with default location
        try {
          const location = {
            lat: 17.6869,
            lon: 83.2185,
            address: "Visakhapatnam, India"
          };
          setUserLocation(location);
          setMapCenter([location.lat, location.lon]);
          
          const mockBanks = getMockBloodBanks(location.lat, location.lon);
          setBloodBanks(mockBanks);
          setError(`⚠️ Showing sample blood bank locations. Unable to fetch live data at this moment.`);
        } catch (fallbackErr) {
          console.error("Fallback error:", fallbackErr);
          setError("Unable to load blood banks. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    autoSearch();
  }, []); // Run only once on mount

  // Search for blood banks
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBloodBanks([]);
    setShowAll(false);

    try {
      // Geocode location
      const location = await geocodeLocation(locationInput);
      setUserLocation(location);
      setMapCenter([location.lat, location.lon]);

      // Fetch blood banks with selected radius
      const banks = await fetchNearbyBloodBanks(location.lat, location.lon, radius);

      if (banks.length === 0) {
        setError(`No blood banks found within ${radius}km radius. Try a larger radius or different area.`);
      } else {
        // Show info if using mock data
        const mockBanks = banks.filter(b => String(b.id).includes('mock_'));
        if (mockBanks.length > 0) {
          setError(`⚠️ Showing ${mockBanks.length} sample locations (Live data unavailable. Please try again in a moment.)`);
        }
      }

      setBloodBanks(banks);
    } catch (err) {
      const errorMsg = err.message || "An error occurred. Please try again.";
      console.error("Search error:", err);
      
      if (errorMsg.includes("not found")) {
        setError(
          `❌ Location "${locationInput}" not found. Please check the spelling and try again.`
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = (bank) => {
    const isFavorited = favorites.some((f) => f.id === bank.id);
    if (isFavorited) {
      setFavorites(favorites.filter((f) => f.id !== bank.id));
    } else {
      setFavorites([...favorites, bank]);
    }
  };

  // Handle bank card click - Highlight on map
  const handleBankCardClick = (bank) => {
    setSelectedBankId(bank.id);

    if (mapRef.current) {
      // Center map on the bank with slight zoom in
      mapRef.current.setView([bank.lat, bank.lon], 16);

      // Open marker popup if available
      setTimeout(() => {
        if (popupRef.current[bank.id]) {
          popupRef.current[bank.id].openPopup();
        }
      }, 200);
    }
  };

  // Open directions in new tab safely
  const handleDirections = (bank) => {
    if (userLocation) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${bank.lat},${bank.lon}`;
      window.open(mapsUrl, "_blank", "noopener,noreferrer");
    }
  };

  const isFavorited = (bankId) => favorites.some((f) => f.id === bankId);

  // Display logic - Show 5 by default, all if showAll is true
  const displayedBanks = showAll ? bloodBanks : bloodBanks.slice(0, defaultDisplayCount);
  const hasMoreResults = bloodBanks.length > defaultDisplayCount;

  return (
    <div className="nearby-banks-container">
      {/* Header */}
      <div className="banks-header">
        <h1>🩸 Find Nearby Blood Banks</h1>
        <p className="subtitle">Search for blood banks and hospitals in your area</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Enter city or location..."
            className="search-input"
          />
          <select
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="radius-select"
            title="Search radius in kilometers"
          >
            <option value={1}>1 km</option>
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={15}>15 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {userLocation && (
          <div className="location-info">
            📍 <strong>{locationInput}</strong> ({userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)})
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading Spinner */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Finding blood banks...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="nearby-banks__content">
          {/* Map Section */}
          {userLocation && (
            <div className="nearby-banks__map-section">
              <h2>Map View</h2>
              <MapContainer
                ref={mapRef}
                center={mapCenter}
                zoom={mapZoom}
                className="leaflet-map"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {/* User marker */}
                <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
                  <Popup>📍 Your Location</Popup>
                </Marker>
                {/* Blood bank markers */}
                {bloodBanks.map((bank) => (
                  <Marker
                    key={bank.id}
                    position={[bank.lat, bank.lon]}
                    icon={selectedBankId === bank.id ? selectedBankIcon : bloodBankIcon}
                    ref={(element) => {
                      if (element) {
                        popupRef.current[bank.id] = element;
                      }
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <strong>{bank.name}</strong>
                        <p style={{ fontSize: "0.85em", margin: "3px 0" }}>
                          {bank.type}
                        </p>
                        <p style={{ fontSize: "0.85em", margin: "3px 0" }}>
                          Distance: {bank.distance.toFixed(2)} km
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {/* Blood Banks List */}
          <div className="nearby-banks__list-section">
            <div className="nearby-banks__list-header">
              <h2>
                {bloodBanks.length > 0
                  ? `🏥 ${bloodBanks.length} Results Found`
                  : "No Results"}
              </h2>
              {bloodBanks.length > 0 && (
                <p className="nearby-banks__result-info">
                  Showing {displayedBanks.length} of {bloodBanks.length} nearest locations
                </p>
              )}
            </div>

            {bloodBanks.length > 0 ? (
              <>
                <div className="nearby-banks__cards-container">
                  {displayedBanks.map((bank) => {
                    const availability = getAvailabilityStatus();
                    return (
                      <div
                        key={bank.id}
                        className={`bank-card ${
                          selectedBankId === bank.id ? "selected" : ""
                        }`}
                        onClick={() => handleBankCardClick(bank)}
                      >
                        {/* Status Badge */}
                        <div className={`availability-badge ${availability.color}`}>
                          {availability.icon} {availability.label}
                        </div>

                        <div className="bank-header-card">
                          <div className="bank-info">
                            <h3 className="bank-name">{bank.name}</h3>
                            <p className="bank-type">
                              {bank.type === "Blood Bank" ? "🔴 Blood Bank" : "🏥 Hospital"}
                            </p>
                          </div>
                          <div className="distance-badge">{bank.distance.toFixed(2)} km</div>
                        </div>

                        <div className="bank-details">
                          <p className="detail">
                            📍 <span>{bank.address.substring(0, 70)}...</span>
                          </p>
                          {bank.phone && (
                            <p className="detail">
                              📞 <span>{bank.phone}</span>
                            </p>
                          )}
                          {bank.opening_hours && (
                            <p className="detail">
                              🕒 <span>{bank.opening_hours}</span>
                            </p>
                          )}
                        </div>

                        <div className="bank-actions">
                          {/* Call Button */}
                          {bank.phone ? (
                            <a
                              href={`tel:${bank.phone}`}
                              className="action-btn call-btn"
                              title={`Call: ${bank.phone}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              📞 Call
                            </a>
                          ) : (
                            <button
                              className="action-btn call-btn disabled-btn"
                              disabled
                              title="Phone not available"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📞 Call
                            </button>
                          )}

                          {/* Directions Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirections(bank);
                            }}
                            className="action-btn directions-btn"
                            title="Get directions on Google Maps"
                          >
                            🧭 Directions
                          </button>

                          {/* Save to Favorites Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(bank);
                            }}
                            className={`action-btn favorite-btn ${
                              isFavorited(bank.id) ? "favorited" : ""
                            }`}
                            title={
                              isFavorited(bank.id)
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            {isFavorited(bank.id) ? "❤️ Saved" : "🤍 Save"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View More Button */}
                {hasMoreResults && (
                  <div className="nearby-banks__view-more-container">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="nearby-banks__view-more-btn"
                    >
                      {showAll
                        ? `▲ Show Less (${defaultDisplayCount} Results)`
                        : `▼ View All Results (${bloodBanks.length} Total)`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              !loading && userLocation && (
                <div className="nearby-banks__no-results">
                  <p>❌ No blood banks or hospitals found within {radius}km radius.</p>
                  <p>Try searching in a different area or increase the radius.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyBloodBanks;
