import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Middleware to authenticate JWT token and check user status
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, userPayload) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      // Check if user still exists and is active
      const user = await User.findById(userPayload.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user account is deactivated
      if (user.status === 'inactive' || user.status === 'suspended') {
        return res.status(403).json({
          message: 'Your account has been deactivated. Please contact support for assistance.'
        });
      }

      req.user = userPayload;
      req.fullUser = user; // Attach full user object for routes that need it
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Server error during authentication' });
    }
  });
}

// Middleware to check if user has admin role
export async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Attach full user object to request for logging purposes
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({ message: 'Server error during authorization' });
  }
}

// Combined middleware for admin routes
export function adminAuth(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) return;
    requireAdmin(req, res, next);
  });
}