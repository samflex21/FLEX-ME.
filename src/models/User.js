const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    first_name: String,
    last_name: String,
    profile_image: String,
    level: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        default: 'Bronze'
    },
    points: {
        type: Number,
        default: 0
    },
    campaigns_created: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    }],
    donations_made: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation'
    }],
    reset_password_token: String,
    reset_password_expires: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update user level based on points
userSchema.methods.updateLevel = function() {
    if (this.points >= 10000) this.level = 'Platinum';
    else if (this.points >= 5000) this.level = 'Gold';
    else if (this.points >= 1000) this.level = 'Silver';
    else this.level = 'Bronze';
};

module.exports = mongoose.model('User', userSchema);
