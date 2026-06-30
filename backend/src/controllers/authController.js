const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new Patient
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerPatient = async (req, res) => {
  const { email, password, name, phone, gender, dateOfBirth } = req.body;

  if (!email || !password || !name || !phone || !gender || !dateOfBirth) {
    return res.status(400).json({ success: false, message: 'All registration fields are required.' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create base user
    const user = await User.create({
      email,
      password,
      role: 'patient',
    });

    // Create patient profile
    const patient = await Patient.create({
      userId: user._id,
      name,
      phone,
      gender,
      dateOfBirth: new Date(dateOfBirth),
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: patient.name,
        profileId: patient._id,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    let profileName = 'Administrator';
    let profileId = null;

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        profileName = patient.name;
        profileId = patient._id;
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) {
        profileName = doctor.name;
        profileId = doctor._id;
      }
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: profileName,
        profileId,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * @desc    Get current user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    console.error('[GetMe Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching user details.' });
  }
};

module.exports = {
  registerPatient,
  login,
  getMe,
};
