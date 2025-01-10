const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register User
exports.register = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            first_name,
            last_name
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('campaigns_created')
            .populate('donations_made');
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, updates, { 
            new: true, 
            runValidators: true 
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
