import express from 'express';
import {
    createReservation,
    getAllReservations,
    getReservationById,
    updateReservation,
    deleteReservation
} from '../../controller/reservationsController/reservationsController.js';

const router = express.Router();

router.route('/')
    .post(createReservation)
    .get(getAllReservations);

router.route('/:id')
    .get(getReservationById)
    .patch(updateReservation)
    .delete(deleteReservation);

export default router;

