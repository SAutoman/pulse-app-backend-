import { Router } from 'express';
import {
  createUserBadge,
  getAllUserBadges,
  getUserBadgeById,
  deleteUserBadge,
  getUserBadges,
} from '../controllers/user-badges-controller';
import { body, param } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt'; // Assuming you have JWT validation middleware
import { validateFields } from '../middlewares/validate-fields'; // Middleware to handle validation results

const router = Router();

// Post a UserBadge
router.post(
  '/',
  [
    validateJWT,
    body('user_id').notEmpty().withMessage('User ID is required').isMongoId(),
    body('badge_id').notEmpty().withMessage('Badge ID is required').isMongoId(),
    validateFields,
  ],
  createUserBadge
);

// Get all UserBadges
router.get('/', [validateJWT], getAllUserBadges);

// Get a single UserBadge by ID
router.get(
  '/:id',
  [
    validateJWT,
    param('id').notEmpty().withMessage('UserBadge ID is required').isMongoId(),
    validateFields,
  ],
  getUserBadgeById
);

// Update a UserBadge - No needed
// router.put(
//   '/:id',
//   [
//     validateJWT,
//     param('id').notEmpty().withMessage('UserBadge ID is required').isMongoId(),
//     body('badge_id')
//       .notEmpty()
//       .withMessage('New Badge ID is required')
//       .isMongoId(),
//     validateFields,
//   ],
//   updateUserBadge
// );

// Delete a UserBadge
router.delete(
  '/:id',
  [
    validateJWT,
    param('id').notEmpty().withMessage('UserBadge ID is required').isMongoId(),
    validateFields,
  ],
  deleteUserBadge
);

// Get all badges for a specific user
router.get(
  '/user/:userId',
  [
    validateJWT,
    param('userId').notEmpty().withMessage('User ID is required').isMongoId(),
    validateFields,
  ],
  getUserBadges
);

export default router;
