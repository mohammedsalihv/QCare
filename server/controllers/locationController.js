const Location = require("../models/Location");

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({});
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a location
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
  try {
    const { name, code, building, floor, department, hodName, inchargeName, locationType, isActive } = req.body;

    // Capture creator identity from authenticated user
    const createdBy = req.user?.employeeName || req.user?.username || 'system';

    const locExists = await Location.findOne({ code });

    if (locExists) {
      return res.status(400).json({ message: "Location code already exists" });
    }

    const now = new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

    const location = await Location.create({
      name,
      code,
      building,
      floor,
      department,
      hodName,
      inchargeName,
      locationType,
      isActive,
      createdBy,
      updatedBy: now,
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    location.name = req.body.name || location.name;
    location.code = req.body.code || location.code;
    location.building = req.body.building !== undefined ? req.body.building : location.building;
    location.floor = req.body.floor !== undefined ? req.body.floor : location.floor;
    location.department = req.body.department || location.department;
    location.hodName = req.body.hodName !== undefined ? req.body.hodName : location.hodName;
    location.inchargeName = req.body.inchargeName !== undefined ? req.body.inchargeName : location.inchargeName;
    location.locationType = req.body.locationType !== undefined ? req.body.locationType : location.locationType;
    location.isActive = req.body.isActive !== undefined ? req.body.isActive : location.isActive;

    const updatedBy = req.user?.employeeName || req.user?.username || 'system';
    const now = new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    location.updatedBy = `${updatedBy} · ${now}`;

    const updatedLoc = await location.save();
    res.json(updatedLoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a location
// @route   DELETE /api/locations/:id
// @access  Private/SuperAdmin
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    await location.deleteOne();
    res.json({ message: "Location removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
