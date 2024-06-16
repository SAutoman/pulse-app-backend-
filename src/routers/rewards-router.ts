import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createReward,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getRedeemedRewardsByUser,
} from '../controllers/rewards-controller';
import { redeemReward } from '../controllers/user-rewards-controller';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';

const router = Router();

// Validations for Rewards
const rewardValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('points_cost')
    .isInt({ min: 0 })
    .withMessage('Points cost must be a non-negative integer'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('is_active')
    .isBoolean()
    .withMessage('Is active must be a boolean value'),
  body('available_from')
    .notEmpty()
    .isISO8601()
    .withMessage('Available from must be a valid date'),
  body('available_until')
    .notEmpty()
    .isISO8601()
    .withMessage('Available until must be a valid date'),
  body('image_url').isURL().withMessage('Image URL must be a valid URL'),
  body('badge_requirements.*')
    .optional()
    .isMongoId()
    .withMessage('Each badge requirement must be a valid MongoDB ObjectId'),
  body('is_public')
    .isBoolean()
    .withMessage('Is public must be a boolean value'),
  body('club_ids.*')
    .optional()
    .isMongoId()
    .withMessage('Each club ID must be a valid MongoDB ObjectId'),
];

const rewardIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('ID must be a valid MongoDB ObjectId'),
];

// Routes for managing rewards
router.post(
  '/',
  [validateJWT, ...rewardValidationRules, validateFields],
  createReward
);
router.get('/', [validateJWT, validateFields], getAllRewards);
router.get(
  '/:id',
  [validateJWT, ...rewardIdValidation, validateFields],
  getRewardById
);
router.put(
  '/:id',
  [...rewardIdValidation, ...rewardValidationRules],
  updateReward
);
router.delete(
  '/:id',
  [validateJWT, ...rewardIdValidation, validateFields],
  deleteReward
);

// Validations for User Rewards
const redeemRewardValidationRules = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  body('reward_id')
    .notEmpty()
    .withMessage('Reward ID is required')
    .isMongoId()
    .withMessage('Reward ID must be a valid MongoDB ObjectId'),
];

// Route for users to redeem a reward
router.post(
  '/redeem',
  [validateJWT, ...redeemRewardValidationRules, validateFields],
  redeemReward
);

// Validation for user ID
const userIdValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
];

// Route to get redeemed rewards by user
router.get(
  '/redeemed/:userId',
  [validateJWT, ...userIdValidation, validateFields],
  getRedeemedRewardsByUser
);

export default router;
