import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import {
  deleteMissionAttemptById,
  getActiveMissionAttempts,
  getMissionAttemptById,
  signUserToMission,
} from '../controllers/mission-attempts-controller';

const router = Router();

// C - Sign up user for a mission
router.post(
  '/',
  [
    validateJWT,
    check('userId', 'User ID is mandatory').notEmpty(),
    check('userId', 'User ID must be a valid database ID').isMongoId(),
    check('missionId', 'Mission ID is mandatory').notEmpty(),
    check('missionId', 'Mission ID must be a valid database ID').isMongoId(),
    validateFields,
  ],
  signUserToMission
);

// R - Get mission attempt by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'Mission attempt ID is mandatory').notEmpty(),
    check('id', 'Mission attempt ID must be a valid database ID').isMongoId(),
    validateFields,
  ],
  getMissionAttemptById
);

// R - Get mission attempts ACTIVE or NOT
router.get(
  '/',
  [
    validateJWT,
    check('userId', 'User ID is mandatory').notEmpty(),
    check('userId', 'User ID must be a valid database ID').isMongoId(),
    
    validateFields,
  ],
  getActiveMissionAttempts
);

// D- Delete user from a mission
router.delete(
  '/',
  [
    validateJWT,
    check('missionAttemptId', 'Mission Attempt ID is mandatory').notEmpty(),
    check(
      'missionAttemptId',
      'Mission Attempt ID must be a valid database ID'
    ).isMongoId(),
    validateFields,
  ],
  deleteMissionAttemptById
);

//Export
export default router;
