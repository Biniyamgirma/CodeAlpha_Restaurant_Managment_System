import express from 'express';
import {
    createDiningTable,
    getAllDiningTables,
    getDiningTableById,
    updateDiningTable,
    deleteDiningTable,
} from '../../controller/diningController/diningTableController.js';

const router = express.Router();

router.route('/')
    .post(createDiningTable)
    .get(getAllDiningTables);

router.route('/:id')
    .get(getDiningTableById)
    .patch(updateDiningTable) // Using PATCH for partial updates is more flexible than PUT
    .delete(deleteDiningTable);

export default router;
