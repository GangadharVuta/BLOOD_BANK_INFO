import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import "./nearbyBloodBanks.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icons
const bloodBankIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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

// Format address
const formatAddress = (tags) => {
  const street = tags["addr:street"] || "";
  const city = tags["addr:city"] || "";
  const postcode = tags["addr:postcode"] || "";
  const fullAddress = tags["addr:full"] || "";

  if (fullAddress) return fullAddress;

  const parts = [street, city, postcode].filter((part) => part.trim() !== "");
  return parts.length === 0 ? "Address not available" : parts.join(", ");
};

// Calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

// Geocode location using Nominatim API
const geocodeLocation = async (locationString) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        locationString
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Blood-Bank-Finder/1.0 (React App)",
        },
      }
    );

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
    console.error("❌ Geocoding error:", error.message);
    throw error;
  }
};

// Fetch nearby blood banks using Overpass API
const fetchNearbyBloodBanks = async (lat, lon, radiusKm = 5) => {
  const radiusMeters = radiusKm * 1000;

  const overpassQuery = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      node["healthcare"="blood_bank"](around:${radiusMeters},${lat},${lon});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      way["healthcare"="blood_bank"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: overpassQuery,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.elements.length === 0) {
      return [];
    }

    const bloodBanks = data.elements.map((element) => {
      const elat = element.center ? element.center.lat : element.lat;
      const elon = element.center ? element.center.lon : element.lon;
      const distance = calculateDistance(lat, lon, elat, elon);
      const tags = element.tags || {};

      return {
        id: element.id,
        name: tags.name || tags["healthcare:speciality"] || "Unnamed Medical Facility",
        lat: elat,
        lon: elon,
        distance,
        phone: tags.phone || null,
        address: formatAddress(tags),
        website: tags.website || null,
        type: tags.healthcare === "blood_bank" ? "Blood Bank" : "Hospital",
        opening_hours: tags.opening_hours || null,
      };
    });

    return bloodBanks.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  } catch (error) {
    console.error("❌ Overpass API error:", error.message);
    throw error;
  }
};

// Get availability status
const getAvailabilityStatus = () => {
  const statuses = [
    { label: "Available", color: "available" },
    { label: "Low Stock", color: "warning" },
    { label: "Critical", color: "danger" },
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

// Main Component
const NearbyBloodBanks = () => {
  const [locationInput, setLocationInput] = useState("Visakhapatnam");
  const [userLocation, setUserLocation] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 78]);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [radius, setRadius] = useState(5);
  const [showAll, setShowAll] = useState(false);
  const defaultDisplayCount = 5;
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

  // Search for blood banks
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBloodBanks([]);
    setShowAll(false);

    try {
      const location = await geocodeLocation(locationInput);
      setUserLocation(location);
      setMapCenter([location.lat, location.lon]);

      const banks = await fetchNearbyBloodBanks(location.lat, location.lon, radius);

      if (banks.length === 0) {
        setError(`No blood banks or hospitals found within ${radius}km radius.`);
      }

      setBloodBanks(banks);
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      console.error(err);
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

  // Handle bank card click
  const handleBankCardClick = (bank) => {
    setSelectedBankId(bank.id);

    if (mapRef.current) {
      mapRef.current.setView([bank.lat, bank.lon], 16);

      setTimeout(() => {
        if (popupRef.current[bank.id]) {
          popupRef.current[bank.id].openPopup();
        }
      }, 200);
    }
  };

  // Open directions
  const handleDirections = (bank) => {
    if (userLocation) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${bank.lat},${bank.lon}`;
      window.open(mapsUrl, "_blank", "noopener,noreferrer");
    }
  };

  const isFavorited = (bankId) => favorites.some((f) => f.id === bankId);

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
          <Button type="primary" label={loading ? "Searching..." : "Search"} disabled={loading} />
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
        <div className="content-wrapper">
          {/* Map Section */}
          {userLocation && (
            <div className="map-section">
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
                <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
                  <Popup>📍 Your Location</Popup>
                </Marker>
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
                        <p style={{ fontSize: "0.85em", margin: "3px 0" }}>{bank.type}</p>
                        <p style={{ fontSize: "0.85em", margin: "3px 0" }}>Distance: {bank.distance} km</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {/* Blood Banks List */}
          <div className="banks-list-section">
            <div className="list-header">
              <h2>
                {bloodBanks.length > 0
                  ? `🏥 ${bloodBanks.length} Results Found`
                  : "No Results"}
              </h2>
              {bloodBanks.length > 0 && (
                <p className="result-info">
                  Showing {displayedBanks.length} of {bloodBanks.length} nearest locations
                </p>
              )}
            </div>

            {bloodBanks.length > 0 ? (
              <>
                <div className="banks-list">
                  {displayedBanks.map((bank) => {
                    const availability = getAvailabilityStatus();
                    return (
                      <Card
                        key={bank.id}
                        id={bank.id}
                        selected={selectedBankId === bank.id}
                        onSelect={() => handleBankCardClick(bank)}
                        showCheckbox={false}
                        badge={{ text: availability.label, type: availability.color }}
                        title={bank.name}
                        subtitle={`${bank.type} • ${bank.distance} km away`}
                        details={[
                          { label: '📍 Address', value: bank.address.substring(0, 50) + (bank.address.length > 50 ? '...' : '') },
                          ...(bank.phone ? [{ label: '📞 Phone', value: bank.phone }] : []),
                          ...(bank.opening_hours ? [{ label: '🕒 Hours', value: bank.opening_hours }] : []),
                        ]}
                        actions={[
                          {
                            label: '📞 Call',
                            onClick: (e) => {
                              e.stopPropagation();
                              if (bank.phone) window.open(`tel:${bank.phone}`);
                            },
                            type: 'call',
                            disabled: !bank.phone
                          },
                          {
                            label: '🧭 Directions',
                            onClick: (e) => {
                              e.stopPropagation();
                              handleDirections(bank);
                            },
                            type: 'secondary'
                          },
                          {
                            label: isFavorited(bank.id) ? '❤️ Saved' : '🤍 Save',
                            onClick: (e) => {
                              e.stopPropagation();
                              toggleFavorite(bank);
                            },
                            type: isFavorited(bank.id) ? 'primary' : 'request'
                          }
                        ]}
                      />
                    );
                  })}
                </div>

                {/* View More Button */}
                {hasMoreResults && (
                  <div className="view-more-container">
                    <Button
                      type="secondary"
                      label={showAll
                        ? `▲ Show Less (${defaultDisplayCount} Results)`
                        : `▼ View All Results (${bloodBanks.length} Total)`}
                      onClick={() => setShowAll(!showAll)}
                    />
                  </div>
                )}
              </>
            ) : (
              !loading && userLocation && (
                <div className="no-results">
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
