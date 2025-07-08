/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 */

import { Router } from 'express';
import {
  register,
  login,
  workerLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  getExistingUsers,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new business owner
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login business owner
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/worker-login
 * @desc    Login worker
 * @access  Public
 */
router.post('/worker-login', workerLogin);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * @route   GET /api/auth/existing-users
 * @desc    Get all existing users (for reference)
 * @access  Public (you may want to add authentication later)
 */
router.get('/existing-users', getExistingUsers);

export default router;
