import express from 'express';
import {
  createDonation,
  getDonations,
  getMyDonations,
  getDonationStats
} from '../controllers/donationController';
import { protect, authorize } from '../middleware/auth';
import { donationValidation } from '../middleware/validation';

const router = express.Router();

/**
 * Donation routes
 */
router.post('/', protect, donationValidation, createDonation);
router.get('/', protect, authorize('admin'), getDonations);
router.get('/my-donations', protect, getMyDonations);
router.get('/stats', protect, authorize('admin'), getDonationStats);

export default router;
