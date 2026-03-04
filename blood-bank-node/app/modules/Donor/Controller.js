const _ = require("lodash");
const { ObjectId } = require('mongodb');

const Controller = require("../Base/Controller");
const Donors = require('./Schema').Donors;
const Users = require('../User/Schema').Users;
const Model = require("../Base/Model");
const RequestBody = require("../../services/RequestBody");

class DonorsController extends Controller {
    constructor() {
        super();
    }

    /**
     * Purpose: Create a new donor
     * Parameters: name, bloodGroup, phone, pincode, lastDonationDate, addedBy
     * Return: JSON String
     */
    async addDonor() {
        try {
            let requestObj = this.req.body;

            console.log("📝 Add Donor Request:", requestObj);

            // Validate required fields
            if (!requestObj.name?.trim()) {
                return this.sendResponse(0, 'Name is required', {}, 400);
            }
            if (!requestObj.bloodGroup) {
                return this.sendResponse(0, 'Blood group is required', {}, 400);
            }
            if (!requestObj.phone?.trim()) {
                return this.sendResponse(0, 'Phone is required', {}, 400);
            }
            if (!requestObj.pincode?.trim()) {
                return this.sendResponse(0, 'Pincode is required', {}, 400);
            }
            if (!requestObj.lastDonationDate) {
                return this.sendResponse(0, 'Last donation date is required', {}, 400);
            }
            if (!requestObj.addedBy) {
                console.error("❌ addedBy is null/undefined");
                return this.sendResponse(0, 'User ID (addedBy) is required', {}, 400);
            }

            // Validate phone length
            if (requestObj.phone.length < 10) {
                return this.sendResponse(0, 'Phone number must be at least 10 digits', {}, 400);
            }

            // Validate pincode is 6 digits
            if (!/^\d{6}$/.test(requestObj.pincode)) {
                return this.sendResponse(0, 'Pincode must be exactly 6 digits', {}, 400);
            }

            // Verify addedBy user exists
            let userExists = await Users.findById(requestObj.addedBy);
            if (!userExists) {
                console.error("❌ User not found:", requestObj.addedBy);
                return this.sendResponse(0, 'User not found', {}, 404);
            }

            // Create donor
            let donorObj = {
                name: requestObj.name.trim(),
                bloodGroup: requestObj.bloodGroup,
                phone: requestObj.phone.trim(),
                pincode: requestObj.pincode.trim(),
                lastDonationDate: new Date(requestObj.lastDonationDate),
                addedBy: new ObjectId(requestObj.addedBy),
                isDeleted: false
            };

            let donor = new Donors(donorObj);
            let saveDonor = await donor.save();

            if (saveDonor) {
                let response = await Donors.findById(saveDonor._id).lean();
                console.log("✅ Donor added successfully:", response);
                return this.sendResponse(1, 'Donor added successfully', response, 200);
            } else {
                return this.sendResponse(0, 'Failed to add donor', {}, 500);
            }
        } catch (error) {
            console.error('❌ Error in addDonor:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            return this.sendResponse(0, error.message || 'An error occurred', {}, 500);
        }
    }

    /**
     * Purpose: Get donors by addedBy user
     * Parameters: addedBy (query parameter)
     * Return: JSON Array
     */
    async getDonorsByUser() {
        try {
            let addedBy = this.req.query.addedBy;

            if (!addedBy) {
                return this.sendResponse(0, 'addedBy parameter is required', [], 400);
            }

            // Validate ObjectId
            if (!ObjectId.isValid(addedBy)) {
                return this.sendResponse(0, 'Invalid user ID', [], 400);
            }

            // Get donors added by this user (not deleted)
            let donors = await Donors.find({
                addedBy: new ObjectId(addedBy),
                isDeleted: false
            })
            .sort({ createdAt: -1 })
            .lean();

            return this.sendResponse(1, 'Donors fetched successfully', donors, 200);
        } catch (error) {
            console.error('Error in getDonorsByUser:', error);
            return this.sendResponse(0, error.message || 'An error occurred', [], 500);
        }
    }

    /**
     * Purpose: Get a single donor by ID
     * Parameters: donorId (URL parameter)
     * Return: JSON Object
     */
    async getDonorById() {
        try {
            let donorId = this.req.params.id;

            if (!donorId || !ObjectId.isValid(donorId)) {
                return this.sendResponse(0, 'Invalid donor ID', {}, 400);
            }

            let donor = await Donors.findOne({
                _id: new ObjectId(donorId),
                isDeleted: false
            })
            .lean();

            if (!donor) {
                return this.sendResponse(0, 'Donor not found', {}, 404);
            }

            return this.sendResponse(1, 'Donor fetched successfully', donor, 200);
        } catch (error) {
            console.error('Error in getDonorById:', error);
            return this.sendResponse(0, error.message || 'An error occurred', {}, 500);
        }
    }

    /**
     * Purpose: Update a donor
     * Parameters: donorId (URL), name, bloodGroup, phone, pincode, lastDonationDate
     * Return: JSON Object
     */
    async updateDonor() {
        try {
            let donorId = this.req.params.id;
            let updateData = this.req.body;

            if (!donorId || !ObjectId.isValid(donorId)) {
                return this.sendResponse(0, 'Invalid donor ID', {}, 400);
            }

            // Validate pincode if provided
            if (updateData.pincode && !/^\d{6}$/.test(updateData.pincode)) {
                return this.sendResponse(0, 'Pincode must be exactly 6 digits', {}, 400);
            }

            // Validate phone if provided
            if (updateData.phone && updateData.phone.length < 10) {
                return this.sendResponse(0, 'Phone number must be at least 10 digits', {}, 400);
            }

            // Find donor
            let donor = await Donors.findOne({
                _id: new ObjectId(donorId),
                isDeleted: false
            });

            if (!donor) {
                return this.sendResponse(0, 'Donor not found', {}, 404);
            }

            // Update allowed fields only
            if (updateData.name) donor.name = updateData.name;
            if (updateData.bloodGroup) donor.bloodGroup = updateData.bloodGroup;
            if (updateData.phone) donor.phone = updateData.phone;
            if (updateData.pincode) donor.pincode = updateData.pincode;
            if (updateData.lastDonationDate) donor.lastDonationDate = new Date(updateData.lastDonationDate);

            let updatedDonor = await donor.save();

            if (updatedDonor) {
                let response = await Donors.findById(updatedDonor._id).lean();
                return this.sendResponse(1, 'Donor updated successfully', response, 200);
            } else {
                return this.sendResponse(0, 'Failed to update donor', {}, 500);
            }
        } catch (error) {
            console.error('Error in updateDonor:', error);
            return this.sendResponse(0, error.message || 'An error occurred', {}, 500);
        }
    }

    /**
     * Purpose: Delete a donor (soft delete)
     * Parameters: donorId (URL parameter)
     * Return: JSON Object
     */
    async deleteDonor() {
        try {
            let donorId = this.req.params.id;

            if (!donorId || !ObjectId.isValid(donorId)) {
                return this.sendResponse(0, 'Invalid donor ID', {}, 400);
            }

            // Find and soft delete
            let updatedDonor = await Donors.findByIdAndUpdate(
                new ObjectId(donorId),
                { isDeleted: true },
                { new: true }
            );

            if (!updatedDonor) {
                return this.sendResponse(0, 'Donor not found', {}, 404);
            }

            return this.sendResponse(1, 'Donor deleted successfully', {}, 200);
        } catch (error) {
            console.error('Error in deleteDonor:', error);
            return this.sendResponse(0, error.message || 'An error occurred', {}, 500);
        }
    }

    /**
     * Purpose: Get all donors (admin only - optional)
     * Return: JSON Array
     */
    async getAllDonors() {
        try {
            let donors = await Donors.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .lean();

            return this.sendResponse(1, 'All donors fetched successfully', donors, 200);
        } catch (error) {
            console.error('Error in getAllDonors:', error);
            return this.sendResponse(0, error.message || 'An error occurred', [], 500);
        }
    }

    /**
     * Purpose: Get merged list of registered donors (from Users) and added donors (from Donors collection)
     * Parameters: None
     * Return: JSON Array - Combined list of all donors with type badges
     * Response format: [
     *   { _id, name, bloodGroup, phoneNumber/phone, pincode, location, donorType: "registered", createdAt },
     *   { _id, name, bloodGroup, phoneNumber/phone, pincode, location, donorType: "added", createdAt }
     * ]
     */
    async getMergedDonors() {
        try {
            // Fetch all registered donors (Users with blood group)
            let registeredDonors = await Users.find({
                isDeleted: false,
                isActive: true,
                bloodGroup: { $exists: true, $ne: null }
            })
            .select('userName phoneNumber pincode bloodGroup emailId createdAt')
            .lean();

            // Transform registered donors to unified format
            let registeredFormatted = registeredDonors.map(donor => ({
                _id: donor._id,
                name: donor.userName,
                bloodGroup: donor.bloodGroup,
                phone: donor.phoneNumber,
                pincode: donor.pincode,
                email: donor.emailId,
                location: donor.pincode, // Use pincode as location identifier
                donorType: 'registered', // Badge: Registered
                availability: 'Available', // Default status
                createdAt: donor.createdAt
            }));

            // Fetch all added donors (Donors collection)
            let addedDonors = await Donors.find({ isDeleted: false })
                .select('name bloodGroup phone pincode addedBy createdAt')
                .lean();

            // Transform added donors to unified format
            let addedFormatted = addedDonors.map(donor => ({
                _id: donor._id,
                name: donor.name,
                bloodGroup: donor.bloodGroup,
                phone: donor.phone,
                pincode: donor.pincode,
                addedBy: donor.addedBy,
                location: donor.pincode,
                donorType: 'added', // Badge: Added by Donor
                availability: 'Available', // Default status
                createdAt: donor.createdAt
            }));

            // Merge both arrays
            let mergedDonors = [...registeredFormatted, ...addedFormatted];

            // Remove duplicates (same phone or email)
            let seen = new Set();
            let uniqueDonors = mergedDonors.filter(donor => {
                let key = donor.phone || donor.email;
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });

            // Sort by newest first (createdAt descending)
            uniqueDonors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`✅ Merged Donors: ${uniqueDonors.length} total (${registeredFormatted.length} registered + ${addedFormatted.length} added)`);

            return this.sendResponse(1, 'Merged donors fetched successfully', uniqueDonors, 200);
        } catch (error) {
            console.error('❌ Error in getMergedDonors:', error);
            return this.sendResponse(0, error.message || 'An error occurred', [], 500);
        }
    }
}

module.exports = DonorsController;
