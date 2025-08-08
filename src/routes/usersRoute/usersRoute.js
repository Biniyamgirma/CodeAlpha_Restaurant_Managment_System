import {Router} from 'express';
const router = Router();
import getUsers from '../../controller/userController/userController.js'

router.get('/',getUsers);

export default router;