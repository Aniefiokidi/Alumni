import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { registerValidation, loginValidation, profileUpdateValidation } from '../middleware/validation';

const router = express.Router();

/**
 * Authentication routes
 */
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileUpdateValidation, updateProfile);

export default router;
