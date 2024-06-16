import { Router } from 'express';
import {
  createMissionClub,
  deleteMissionClub,
  getMissionClubById,
  getMissionClubs,
  updateMissionClub,
} from '../controllers/mission-clubs-controller'; // Adjust the import path
import { validateJWT } from '../middlewares/validate-jwt'; // Assuming you have this middleware
import { validateFields } from '../middlewares/validate-fields'; // Assuming you have this middleware
import { check } from 'express-validator';

const router = Router();

// Create a MissionClub association
router.post(
  '/',
  [
    validateJWT,
    check('mission_id', 'mission_id is required and must be a valid ID')
      .notEmpty()
      .isMongoId(),
    check('club_id', 'club_id is required and must be a valid ID')
      .notEmpty()
      .isMongoId(),
    validateFields,
  ],
  createMissionClub
);

// Get all MissionClub associations
router.get('/', [validateJWT], getMissionClubs);

// Get a single MissionClub association by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'A valid ID is required').notEmpty().isMongoId(),
    validateFields,
  ],
  getMissionClubById
);

// Update a MissionClub association
router.put(
  '/:id',
  [
    validateJWT,
    check('id', 'A valid ID is required for update').notEmpty().isMongoId(),
    check('mission_id', 'mission_id must be a valid ID').optional().isMongoId(),
    check('club_id', 'club_id must be a valid ID').optional().isMongoId(),
    validateFields,
  ],
  updateMissionClub
);

// Delete a MissionClub association
router.delete(
  '/:id',
  [
    validateJWT,
    check('id', 'A valid ID is required for deletion').notEmpty().isMongoId(),
    validateFields,
  ],
  deleteMissionClub
);

export default router;
