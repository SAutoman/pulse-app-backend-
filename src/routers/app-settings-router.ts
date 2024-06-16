import { Router } from 'express';
import { getMaintenanceMode } from '../controllers/app-settings';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';

const router = Router();

router.get('/', [validateJWT, validateFields], getMaintenanceMode);

export default router;
