import express from 'express';
import {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant
} from '../../controller/restaurantsController/restaurantsController.js';

const router = express.Router();

router.route('/')
    .post(createRestaurant)
    .get(getAllRestaurants);

router.route('/:id')
    .get(getRestaurantById)
    .put(updateRestaurant)
    .delete(deleteRestaurant);

export default router;