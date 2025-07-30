import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserInfo from '../models/userInfoModel.js';
import User from '../models/userModel.js';

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.password) {
            return res.status(400).json({ message: 'User has no password set. Please register again or use a different login method.' });
        }

        // Check if user account is deactivated
        if (user.status === 'inactive' || user.status === 'suspended') {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact support for assistance.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                _id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                status: user.status
            }
        });
    } catch (err) {
        console.error('login error: ', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Register user directly without OTP verification
const register = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    try {
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            isVerified: true, // Auto-verify users since we're not using OTP
            role: 'user',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await user.save();

        // Generate JWT token for immediate login
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                _id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (err) {
        console.error('register error: ', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Optional: Complete user profile (can be used for additional info later)
const completeProfile = async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        // Get user from JWT token (assuming middleware sets req.user)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create or update user info
        let userInfo = await UserInfo.findOne({ userId: user._id });
        if (userInfo) {
            userInfo.phoneNumber = phoneNumber;
            await userInfo.save();
        } else {
            userInfo = new UserInfo({
                userId: user._id,
                phoneNumber
            });
            await userInfo.save();
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            userInfo: {
                phoneNumber: userInfo.phoneNumber
            }
        });
    } catch (err) {
        console.error('complete profile error: ', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Google OAuth: Find or create user
export async function findOrCreateGoogleUser(profile) {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
        // Try to get first and last name from profile
        let firstName = '';
        let lastName = '';
        if (profile.name) {
            firstName = profile.name.givenName || '';
            lastName = profile.name.familyName || '';
        } else if (profile.displayName) {
            const nameParts = profile.displayName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }
        user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            isVerified: true,
            firstName,
            lastName
        });
        console.log('Created new Google user:', user);
    } else {
        console.log('Found existing user:', user);
    }
    return user;
}

export { completeProfile, login, register };

