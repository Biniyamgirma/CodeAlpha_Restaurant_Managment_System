import express from 'express';
import {
    createDiningZone,
    getAllDiningZones,
    getDiningZoneById,
    updateDiningZone,
    deleteDiningZone
} from '../../controller/diningController/diningZoneController.js';

const router = express.Router();

router.route('/')
    .post(createDiningZone)
    .get(getAllDiningZones);

router.route('/:id')
    .get(getDiningZoneById)
    .put(updateDiningZone)
    .delete(deleteDiningZone);

export default router;
