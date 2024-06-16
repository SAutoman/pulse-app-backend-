import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import { authStrava, deauthStrava, refreshStravaToken } from '../controllers/strava-controller';

const router = Router();

router.post(
  '/auth',
  [
    validateJWT,
    check('strava_access_token', 'Acess token is required').notEmpty(),
    check('strava_refresh_token', 'Refresh token is required').notEmpty(),
    check('strava_user_id', 'stravaUserId token is required').notEmpty(),
    check('strava_access_expires_at', 'ExpiresAt token is required').notEmpty(),
    validateFields,
  ],
  authStrava
);

router.post('/deauth', [validateJWT, validateFields], deauthStrava);
router.post('/refreshToken', [validateJWT, validateFields], refreshStravaToken);

//Exports
export default router;
