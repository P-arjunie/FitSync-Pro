import express from 'express';
import { submitReview } from '../controllers/reviewController';

const router = express.Router();

router.post('/submitReview', submitReview);

export default router;
