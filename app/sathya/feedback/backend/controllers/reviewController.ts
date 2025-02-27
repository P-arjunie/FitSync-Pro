import { Request, Response } from 'express';
import Review from '../models/Review';

export const submitReview = async (req: Request, res: Response) => {
  try {
    const { trainer, sessionType, date, comments, rating } = req.body;
    const newReview = new Review({ trainer, sessionType, date, comments, rating });
    await newReview.save();
    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting review', error });
  }
};
