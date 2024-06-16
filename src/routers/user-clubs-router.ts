import { Router } from 'express';
import {
  createUserClub,
  deleteUserClub,
  deleteUserClubByUserIdClubId,
  getClubsForUserId,
  getUserClubById,
  getUserClubs,
  updateUserClub,
} from '../controllers/user-clubs-controller';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import { check } from 'express-validator';

const router = Router();

// Create a UserClub association
router.post(
  '/',
  [
    validateJWT,
    check('user_id', 'user_id is required and must be a valid ID')
      .notEmpty()
      .isMongoId(),
    check('club_id', 'club_id is required and must be a valid ID')
      .notEmpty()
      .isMongoId(),
    validateFields,
  ],
  createUserClub
);

// Get all UserClub associations
router.get('/', [validateJWT], getUserClubs);

// Get a single UserClub association by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'A valid ID is required').notEmpty().isMongoId(),
    validateFields,
  ],
  getUserClubById
);

//R - Get clubs related to a user ID
router.get(
  '/user/:userId',
  [
    validateJWT,
    check('userId', 'User ID is required').notEmpty(),
    check('userId', 'User ID is required').isMongoId(),
    validateFields,
  ],
  getClubsForUserId
);

// Delete a UserClub association
router.delete(
  '/:id',
  [
    validateJWT,
    check('id', 'A valid ID is required for deletion').notEmpty().isMongoId(),
    validateFields,
  ],
  deleteUserClub
);

// Delete a UserClub association by user ID and club ID
router.delete(
  '/',
  [
    validateJWT,
    check('user_id', 'A valid User ID is required for deletion').notEmpty().isMongoId(),
    check('club_id', 'A valid Club ID is required for deletion').notEmpty().isMongoId(),
    validateFields,
  ],
  deleteUserClubByUserIdClubId
);

export default router;
