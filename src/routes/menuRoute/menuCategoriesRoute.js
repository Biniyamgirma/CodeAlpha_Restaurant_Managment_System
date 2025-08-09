import express from 'express';
import {
    createMenuCategory,
    getAllMenuCategories,
    getMenuCategoryById,
    updateMenuCategory,
    deleteMenuCategory,
} from '../../controller/menuController/menuCategoriesController.js';
import multer from 'multer';
import storage from '../../config/fileStorageConfig.js';

const upload = multer({ storage });
const router = express.Router();

router.route('/')
    .post(upload.single('image'),createMenuCategory)
    .get(getAllMenuCategories);

router.route('/:id')
    .get(getMenuCategoryById)
    .patch(upload.single('image'), updateMenuCategory) // Use PATCH and handle file uploads
    .delete(deleteMenuCategory);

export default router;