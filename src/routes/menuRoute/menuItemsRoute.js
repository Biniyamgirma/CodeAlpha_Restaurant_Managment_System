import express from 'express';
import {
    createMenuItem,
    getAllMenuItems,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    addModifierToItem,
    removeModifierFromItem,
} from '../../controller/menuController/menuItemsController.js';
import multer from 'multer';
import storage from '../../config/fileStorageConfig.js';

const upload = multer({ storage });
const router = express.Router();

router.route('/')
    .post(upload.single('image'), createMenuItem)
    .get(getAllMenuItems);

router.route('/:id')
    .get(getMenuItemById)
    .patch(upload.single('image'), updateMenuItem)
    .delete(deleteMenuItem);

router.route('/:itemId/modifiers').post(addModifierToItem);
router.route('/:itemId/modifiers/:modifierId').delete(removeModifierFromItem);

export default router;
