import express from 'express';
import {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff
} from '../../controller/staffController/staffController.js';

const router = express.Router();

router.route('/')
    .post(createStaff)
    .get(getAllStaff);

router.route('/:id')
    .get(getStaffById)
    .put(updateStaff)
    .delete(deleteStaff);

export default router;
