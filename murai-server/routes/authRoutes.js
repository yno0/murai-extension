import { Router } from 'express';
import { completeProfile, login, register } from '../controller/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/complete-profile', authenticateToken, completeProfile);

export default router;

