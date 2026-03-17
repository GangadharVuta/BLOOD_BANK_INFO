const BloodBankModel = require('./Schema');
const Common = require('../../services/Common');

// Calculate distance between two coordinates (Haversine formula)
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
  return (R * c).toFixed(2);
};

// Format address from multiple fields
const formatAddress = (tags) => {
  const street = tags['addr:street'] || '';
  const city = tags['addr:city'] || '';
  const postcode = tags['addr:postcode'] || '';
  const fullAddress = tags['addr:full'] || '';

  if (fullAddress) {
    return fullAddress;
  }

  const parts = [street, city, postcode].filter((part) => part.trim() !== '');
  if (parts.length === 0) {
    return 'Address not available';
  }
  return parts.join(', ');
};

// Fetch from Overpass API with retry logic
const fetchFromOverpass = async (lat, lon, radiusKm = 5, retries = 3) => {
  const radiusMeters = radiusKm * 1000;

  const overpassQuery = `
    [out:json][timeout:30];
    (
      node["healthcare"="blood_bank"](around:${radiusMeters},${lat},${lon});
      way["healthcare"="blood_bank"](around:${radiusMeters},${lat},${lon});
      node["amenity"="hospital"]["healthcare"~"blood"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 504 && attempt < retries) {
          console.warn(`⚠️ Attempt ${attempt}: 504 Gateway Timeout. Retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⚠️ Attempt ${attempt}: Request timeout`);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }
      }

      console.error(`❌ Overpass API error on attempt ${attempt}:`, error.message);

      if (attempt === retries) {
        throw error;
      }
    }
  }

  throw new Error('Failed to fetch from Overpass API after all retries');
};

module.exports = {
  // Get nearby blood banks
  getNearbyBloodBanks: async (req, res) => {
    try {
      const { latitude, longitude, radius = 5 } = req.query;

      // Validate input
      if (!latitude || !longitude) {
        return res.status(400).send({
          status: 0,
          message: 'Latitude and longitude are required',
        });
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const searchRadius = parseInt(radius) || 5;

      // Check database first
      const nearbyBanks = await BloodBankModel.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
      }).limit(50);

      if (nearbyBanks.length > 0) {
        // Add distance calculation
        const banksWithDistance = nearbyBanks.map((bank) => ({
          ...bank.toObject(),
          distance: calculateDistance(lat, lon, bank.latitude, bank.longitude),
        }));

        return res.status(200).send({
          status: 1,
          message: 'Nearby blood banks fetched successfully',
          count: banksWithDistance.length,
          source: 'database',
          data: banksWithDistance.sort(
            (a, b) => parseFloat(a.distance) - parseFloat(b.distance)
          ),
        });
      }

      // Fetch from Overpass API if not in database
      console.log(`📍 Fetching blood banks from Overpass API for ${lat}, ${lon}`);
      const elements = await fetchFromOverpass(lat, lon, searchRadius);

      if (elements.length === 0) {
        return res.status(200).send({
          status: 1,
          message: `No blood banks found within ${searchRadius}km radius`,
          count: 0,
          data: [],
        });
      }

      // Process and save to database
      const bloodBanks = elements.map((element) => {
        const elat = element.center ? element.center.lat : element.lat;
        const elon = element.center ? element.center.lon : element.lon;
        const tags = element.tags || {};
        const distance = calculateDistance(lat, lon, elat, elon);

        return {
          overpassId: `${element.id}`,
          name: tags.name || tags['healthcare:speciality'] || 'Unnamed Medical Facility',
          latitude: elat,
          longitude: elon,
          distance,
          phone: tags.phone || null,
          address: formatAddress(tags),
          city: tags['addr:city'] || null,
          pincode: tags['addr:postcode'] || null,
          website: tags.website || null,
          type: tags.healthcare === 'blood_bank' ? 'Blood Bank' : 'Hospital',
          openingHours: tags.opening_hours || null,
        };
      });

      // Save to database (upsert)
      for (const bank of bloodBanks) {
        await BloodBankModel.updateOne(
          { overpassId: bank.overpassId },
          bank,
          { upsert: true }
        );
      }

      // Sort by distance
      const sortedBanks = bloodBanks.sort(
        (a, b) => parseFloat(a.distance) - parseFloat(b.distance)
      );

      res.status(200).send({
        status: 1,
        message: 'Nearby blood banks fetched successfully',
        count: sortedBanks.length,
        source: 'overpass-api',
        data: sortedBanks,
      });
    } catch (error) {
      console.error('❌ Error fetching nearby blood banks:', error.message);
      res.status(503).send({
        status: 0,
        message:
          'Unable to fetch blood banks. Please try again with a smaller radius or different location.',
        error: error.message,
      });
    }
  },

  // Get all blood banks (for admin)
  getAllBloodBanks: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const banks = await BloodBankModel.find()
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 });

      const total = await BloodBankModel.countDocuments();

      res.status(200).send({
        status: 1,
        message: 'All blood banks fetched successfully',
        count: banks.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: banks,
      });
    } catch (error) {
      console.error('❌ Error fetching all blood banks:', error.message);
      res.status(500).send({
        status: 0,
        message: 'Error fetching blood banks',
        error: error.message,
      });
    }
  },

  // Get blood bank by ID
  getBloodBankById: async (req, res) => {
    try {
      const { id } = req.params;

      const bank = await BloodBankModel.findById(id);

      if (!bank) {
        return res.status(404).send({
          status: 0,
          message: 'Blood bank not found',
        });
      }

      res.status(200).send({
        status: 1,
        message: 'Blood bank fetched successfully',
        data: bank,
      });
    } catch (error) {
      console.error('❌ Error fetching blood bank:', error.message);
      res.status(500).send({
        status: 0,
        message: 'Error fetching blood bank',
        error: error.message,
      });
    }
  },

  // Add new blood bank (manual entry)
  addBloodBank: async (req, res) => {
    try {
      const { name, latitude, longitude, address, phone, website, city, type } =
        req.body;

      if (!name || !latitude || !longitude) {
        return res.status(400).send({
          status: 0,
          message: 'Name, latitude, and longitude are required',
        });
      }

      const newBank = new BloodBankModel({
        overpassId: `manual_${Date.now()}`,
        name,
        latitude,
        longitude,
        address,
        phone,
        website,
        city,
        type: type || 'Blood Bank',
      });

      const savedBank = await newBank.save();

      res.status(201).send({
        status: 1,
        message: 'Blood bank added successfully',
        data: savedBank,
      });
    } catch (error) {
      console.error('❌ Error adding blood bank:', error.message);
      res.status(500).send({
        status: 0,
        message: 'Error adding blood bank',
        error: error.message,
      });
    }
  },

  // Update blood bank availability
  updateAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Available', 'Low Stock', 'Critical'].includes(status)) {
        return res.status(400).send({
          status: 0,
          message: 'Invalid availability status',
        });
      }

      const updatedBank = await BloodBankModel.findByIdAndUpdate(
        id,
        {
          'availability.status': status,
          'availability.updatedAt': new Date(),
        },
        { new: true }
      );

      if (!updatedBank) {
        return res.status(404).send({
          status: 0,
          message: 'Blood bank not found',
        });
      }

      res.status(200).send({
        status: 1,
        message: 'Availability updated successfully',
        data: updatedBank,
      });
    } catch (error) {
      console.error('❌ Error updating availability:', error.message);
      res.status(500).send({
        status: 0,
        message: 'Error updating availability',
        error: error.message,
      });
    }
  },

  // Search blood banks by city
  searchByCity: async (req, res) => {
    try {
      const { city, page = 1, limit = 20 } = req.query;

      if (!city) {
        return res.status(400).send({
          status: 0,
          message: 'City parameter is required',
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const banks = await BloodBankModel.find({
        city: { $regex: city, $options: 'i' },
      })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ name: 1 });

      const total = await BloodBankModel.countDocuments({
        city: { $regex: city, $options: 'i' },
      });

      res.status(200).send({
        status: 1,
        message: 'Blood banks found',
        count: banks.length,
        total,
        data: banks,
      });
    } catch (error) {
      console.error('❌ Error searching blood banks:', error.message);
      res.status(500).send({
        status: 0,
        message: 'Error searching blood banks',
        error: error.message,
      });
    }
  },
};
