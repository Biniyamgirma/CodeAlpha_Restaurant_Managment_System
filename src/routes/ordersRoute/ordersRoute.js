import express from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    updateOrderItemStatus
} from '../../controller/ordersController/ordersController.js';

const router = express.Router();

router.route('/').post(createOrder).get(getAllOrders);
router.route('/:id').get(getOrderById).patch(updateOrder);

// New route for updating a specific order item's status
router.route('/:orderId/items/:itemId').patch(updateOrderItemStatus);

export default router;
