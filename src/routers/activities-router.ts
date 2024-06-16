import { Router } from 'express';
import { validateJWT } from '../middlewares/validate-jwt';
import {
  deleteActivityById,
  getActivitiesByUserId,
  getAllActivities,
  reCalculateWeekPointsByUser,
  updateActivityById,
} from '../controllers/activities-controller';
import { validateFields } from '../middlewares/validate-fields';
import { check } from 'express-validator';

const router = Router();

//R - Get all activities
router.get('/', [validateJWT], getAllActivities);

//R - Get all activities by user ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'The userId is mandatory').notEmpty(),
    check('id', 'The userId must be in valid format').isMongoId(),
    validateFields,
  ],
  getActivitiesByUserId
);

//U - Update activity by ID
router.put(
  '/:id',
  [
    validateJWT,
    check('id', 'The activityId is mandatory').notEmpty(),
    check('id', 'The activityId must be in valid format').isMongoId(),
    validateFields,
  ],
  updateActivityById
);

//D- Delete activity by ID
router.delete(
  '/:id',
  [
    check('id', 'The activityId is mandatory').notEmpty(),
    check('id', 'The activityId must be in valid format').isMongoId(),
    validateFields,
  ],
  deleteActivityById
);

//ADMIN ONLY - Re-calculate week/year points based on saved activities
router.post(
  '/recalculateWeek',
  [
    validateJWT,
    check('week', 'Week number is required').notEmpty(),
    check('week', 'Week number must be a number').isNumeric(),
    check('year', 'Year is required').notEmpty(),
    check('year', 'Year must be a number').isNumeric(),
    check('userId', 'UserId is required').notEmpty(),
    check('userId', 'UserId must be a valid database ID').isMongoId(),
    validateFields,
  ],
  reCalculateWeekPointsByUser
);

export default router;
