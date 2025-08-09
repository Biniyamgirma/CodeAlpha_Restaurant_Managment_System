import express from 'express';
import { getDailySalesSummary } from '../../controller/reportsController/reportsController.js';

const router = express.Router();

router.get('/daily-sales-summary', getDailySalesSummary);

export default router;

