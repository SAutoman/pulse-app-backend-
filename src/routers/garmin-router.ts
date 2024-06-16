import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import { authGarmin, deauthGarmin, refreshGarminToken } from '../controllers/garmin-controller';

const router = Router();

router.post(
  '/garmin-auth',
  [
    validateJWT,
    check('garmin_access_token', 'Acess token is required').notEmpty(),
    check('garmin_refresh_token', 'Refresh token is required').notEmpty(),
    check('garmin_user_id', 'stravaUserId token is required').notEmpty(),
    check('garmin_access_expires_at', 'ExpiresAt token is required').notEmpty(),
    validateFields,
  ],
  authGarmin
);

router.post('/garmin-deauth', [validateJWT, validateFields], deauthGarmin);
router.post('/garmin-refreshToken', [validateJWT, validateFields], refreshGarminToken);

//Exports
export default router;
