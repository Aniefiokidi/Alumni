import express from 'express';
import {
  getAlumni,
  getAlumniById,
  getAlumniBySlug,
  getAlumniStats,
  searchCompanies
} from '../controllers/alumniController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * Alumni routes
 */
router.get('/', protect, getAlumni);
router.get('/stats', protect, authorize('admin'), getAlumniStats);
router.get('/companies/search', protect, searchCompanies);
router.get('/profile/:slug', protect, getAlumniBySlug);
router.get('/:id', protect, getAlumniById);

export default router;
