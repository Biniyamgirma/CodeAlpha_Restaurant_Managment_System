import express from 'express';
import {
    createModifier,
    getAllModifiers,
    getModifierById,
    updateModifier,
    deleteModifier,
    createModifierOption,
    getAllModifierOptions,
    updateModifierOption,
    deleteModifierOption,
} from '../../controller/menuController/modifiersController.js';

const router = express.Router();

// Routes for Modifiers
router.route('/').post(createModifier).get(getAllModifiers);
router.route('/:id').get(getModifierById).patch(updateModifier).delete(deleteModifier);

// Nested Routes for Modifier Options
router.route('/:modifierId/options')
    .post(createModifierOption)
    .get(getAllModifierOptions);

router.route('/:modifierId/options/:optionId').patch(updateModifierOption).delete(deleteModifierOption);

export default router;
