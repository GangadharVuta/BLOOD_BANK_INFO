import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import "./ListDonors.css";

const ListDonors = () => {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchBloodGroup, setSearchBloodGroup] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    bloodGroup: "",
    phone: "",
    pincode: "",
    lastDonationDate: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Fetch donors on component mount
  useEffect(() => {
    fetchDonors();
  }, []);

  // Filter donors when search changes
  useEffect(() => {
    filterDonors();
  }, [donors, searchBloodGroup]);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!authToken || !userId) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:4000/api/donors?addedBy=${userId}`,
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === 1 || response.data.success) {
        const donorsList = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.donors || [];
        setDonors(donorsList);
      } else {
        setError(response.data.message || "Failed to fetch donors");
        setDonors([]);
      }
    } catch (err) {
      console.error("Error fetching donors:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching donors";
      setError(errorMessage);
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDonors = () => {
    let filtered = donors;

    if (searchBloodGroup) {
      filtered = filtered.filter(
        (donor) => donor.bloodGroup === searchBloodGroup
      );
    }

    setFilteredDonors(filtered);
  };

  const handleDeleteDonor = (donorId) => {
    swal(
      {
        title: "Are you sure?",
        text: "This action cannot be undone",
        icon: "warning",
        buttons: ["Cancel", "Delete"],
        dangerMode: true,
      }
    ).then((willDelete) => {
      if (willDelete) {
        const authToken = localStorage.getItem("token");

        axios.delete(
          `http://localhost:4000/api/donors/${donorId}`,
          {
            headers: {
              Authorization: authToken,
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          if (response.data.status === 1 || response.data.success) {
            swal({
              title: "Deleted!",
              text: "Donor has been deleted successfully",
              icon: "success",
              button: "Okay",
            }).then(() => {
              fetchDonors();
            });
          } else {
            swal({
              title: "Error",
              text: response.data.message || "Failed to delete donor",
              icon: "error",
              button: "Okay",
            });
          }
        })
        .catch((err) => {
          console.error("Error deleting donor:", err);
          swal({
            title: "Error",
            text:
              err.response?.data?.message ||
              "An error occurred while deleting the donor",
            icon: "error",
            button: "Okay",
          });
        });
      }
    });
  };

  const handleEditClick = (donor) => {
    setEditingId(donor._id || donor.id);
    setEditFormData({
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      phone: donor.phone,
      pincode: donor.pincode,
      lastDonationDate: donor.lastDonationDate,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({
      name: "",
      bloodGroup: "",
      phone: "",
      pincode: "",
      lastDonationDate: "",
    });
  };

  const handleEditSave = async (donorId) => {
    try {
      const authToken = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:4000/api/donors/${donorId}`,
        editFormData,
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === 1 || response.data.success) {
        swal({
          title: "Updated!",
          text: "Donor has been updated successfully",
          icon: "success",
          button: "Okay",
        }).then(() => {
          setEditingId(null);
          fetchDonors();
        });
      } else {
        swal({
          title: "Error",
          text: response.data.message || "Failed to update donor",
          icon: "error",
          button: "Okay",
        });
      }
    } catch (err) {
      console.error("Error updating donor:", err);
      swal({
        title: "Error",
        text:
          err.response?.data?.message ||
          "An error occurred while updating the donor",
        icon: "error",
        button: "Okay",
      });
    }
  };

  return (
    <div className="list-donors-container">
      <div className="list-donors-header">
        <h1>📋 Donors List</h1>
        <p>Manage donors added by you</p>
      </div>

      <div className="list-donors-content">
        {/* Search and Add Button */}
        <div className="list-controls">
          <div className="search-section">
            <label htmlFor="bloodGroupFilter">Filter by Blood Group:</label>
            <select
              id="bloodGroupFilter"
              value={searchBloodGroup}
              onChange={(e) => setSearchBloodGroup(e.target.value)}
              className="blood-group-filter"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate("/add-donor")}
            className="btn-add-donor"
          >
            ➕ Add New Donor
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading donors...</p>
          </div>
        )}

        {/* Donors Table/Cards */}
        {!loading && (
          <>
            {filteredDonors.length > 0 ? (
              <div className="donors-table-container">
                <table className="donors-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Blood Group</th>
                      <th>Phone</th>
                      <th>Pincode</th>
                      <th>Last Donation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map((donor) => (
                      <tr key={donor._id || donor.id}>
                        {editingId === (donor._id || donor.id) ? (
                          <>
                            <td>
                              <input
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditChange}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <select
                                name="bloodGroup"
                                value={editFormData.bloodGroup}
                                onChange={handleEditChange}
                                className="edit-input"
                              >
                                {bloodGroups.map((group) => (
                                  <option key={group} value={group}>
                                    {group}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="tel"
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleEditChange}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="pincode"
                                value={editFormData.pincode}
                                onChange={handleEditChange}
                                className="edit-input"
                                maxLength="6"
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                name="lastDonationDate"
                                value={editFormData.lastDonationDate}
                                onChange={handleEditChange}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <div className="edit-actions">
                                <button
                                  onClick={() =>
                                    handleEditSave(donor._id || donor.id)
                                  }
                                  className="btn-save"
                                  title="Save changes"
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="btn-cancel-edit"
                                  title="Cancel editing"
                                >
                                  ❌ Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{donor.name}</td>
                            <td>
                              <span className="blood-group-badge">
                                {donor.bloodGroup}
                              </span>
                            </td>
                            <td>{donor.phone}</td>
                            <td>{donor.pincode}</td>
                            <td>
                              {new Date(donor.lastDonationDate).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  onClick={() => handleEditClick(donor)}
                                  className="btn-edit"
                                  title="Edit donor"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteDonor(donor._id || donor.id)
                                  }
                                  className="btn-delete"
                                  title="Delete donor"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-donors">
                <p className="no-donors-icon">📭</p>
                <p>No donors found</p>
                {searchBloodGroup && (
                  <p className="no-donors-hint">
                    Try searching with a different blood group
                  </p>
                )}
                <button
                  onClick={() => navigate("/add-donor")}
                  className="btn-add-first"
                >
                  ➕ Add Your First Donor
                </button>
              </div>
            )}

            {/* Results Counter */}
            {filteredDonors.length > 0 && (
              <div className="results-info">
                Showing {filteredDonors.length} of {donors.length} donor
                {donors.length !== 1 ? "s" : ""}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListDonors;
