import { Router } from 'express';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import {
  createMission,
  deleteMissionById,
  finalizeAllMissionsBeforeToday,
  finalizeMissionByID,
  getActiveMissionsForUser,
  getAllActiveMissions,
  getMissionById,
  updateMissionById,
} from '../controllers/missions-controller';
import { check } from 'express-validator';

const router = Router();

// C - Create a Mission (ADMIN Only)
router.post(
  '/',
  [
    validateJWT,
    check('name', 'name is required').notEmpty(),
    check('description', 'description is required').notEmpty(),
    check('goal_type', 'goal_type is required').notEmpty(),
    check('goal_value', 'goal_value is required').notEmpty(),
    check('measure_unit', 'measure_unit is required').notEmpty(),
    check('initial_day', 'initial_date is required as YYYY-MM-DD').notEmpty(),
    check('end_day', 'end_date is requiredas YYYY-MM-DD').notEmpty(),
    check('sport_type', 'sport_type is required as YYYY-MM-DD').notEmpty(),
    check('image_url', 'image_url is required as YYYY-MM-DD').notEmpty(),
    check('is_public', 'is_public is required').notEmpty().isBoolean(),

    validateFields,
  ],
  createMission
);

// R - Read Mission by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'Mission ID is required').notEmpty(),
    check('id', 'Mission ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  getMissionById
);

// R - Read all active Mission
router.get('/', [validateJWT, validateFields], getAllActiveMissions);

//R - Read all ACTIVE missions available to a specific user
router.get(
  '/user/:userId',
  [
    validateJWT,
    check('userId', 'User ID is required to get the missions').notEmpty(),
    check('userId', 'User ID is must be a valid database ID').isMongoId(),
    validateFields,
  ],
  getActiveMissionsForUser
);

router.put(
  '/:id',
  [
    validateJWT,
    check('id', 'Mission ID is required').notEmpty(),
    check('id', 'Mission ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  updateMissionById
);

router.delete(
  '/:id',
  [
    validateJWT,
    check('id', 'Mission ID is required').notEmpty(),
    check('id', 'Mission ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  deleteMissionById
);

// P - Finalize all missions before today
router.post(
  '/finalize-missions',
  [validateJWT, validateFields],
  finalizeAllMissionsBeforeToday
);

// P - Finalize a mission by ID
router.post(
  '/finalize-missions/:missionId',
  [
    validateJWT,
    check(
      'missionId',
      'missionId is required as a valid database ID'
    ).isMongoId(),
    validateFields,
  ],
  finalizeMissionByID
);

//Exports
export default router;
