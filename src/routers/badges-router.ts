import { Router } from 'express';
import { check, body } from 'express-validator';
import {
  createBadge,
  deleteBadge,
  getAllBadges,
  getBadgeById,
  getBadgesByIds,
  getBadgesByUserId,
  getEvaluateDisciplineBadge,
  getEvaluateDistanceBadge,
  getEvaluateMissionBadge,
  getEvaluateRankingBadge,
  getEvaluateTimeBadge,
  updateBadge,
} from '../controllers/badges-controller';
import { validateFields } from '../middlewares/validate-fields';
import { validateJWT } from '../middlewares/validate-jwt';

const router = Router();

// POST: Create a new badge
router.post(
  '/',
  [
    validateJWT,
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('available_from').notEmpty().withMessage('available_from is required'),
    body('available_until').notEmpty().withMessage('available_until is required'),
    body('criteria')
      .isJSON()
      .withMessage('Criteria must be a valid JSON string'),
    body('type').notEmpty().withMessage('Type is required'),
    body('level')
      .optional()
      .isNumeric()
      .withMessage('Level must be a numeric value'),
    body('expires_at')
      .optional()
      .isString()
      .withMessage('Expires at must be a valid date string'),
    body('visibility').notEmpty().withMessage('Visibility is required'),
    body('points_value')
      .optional()
      .isNumeric()
      .withMessage('Points value must be a numeric value'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('prerequisites')
      .optional()
      .isArray()
      .withMessage('Prerequisites must be an array of strings'),
    body('sport_types')
      .optional()
      .isArray()
      .withMessage('Sport Types must be an array of strings'),
    validateFields,
  ],
  createBadge
);

// GET: Read all badges
router.get('/allbadges', validateJWT, getAllBadges);

// GET: Read a single badge by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getBadgeById
);

// PUT: Update a badge
router.put(
  '/:id',
  [
    validateJWT,
    check('id').isMongoId().withMessage('A valid MongoDB ID is required'),
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('description')
      .optional()
      .notEmpty()
      .withMessage('Description is required'),
    body('criteria')
      .optional()
      .isJSON()
      .withMessage('Criteria must be a valid JSON string'),
    body('type').optional().notEmpty().withMessage('Type is required'),
    body('level')
      .optional()
      .isNumeric()
      .withMessage('Level must be a numeric value'),
    body('expires_at')
      .optional()
      .isString()
      .withMessage('Expires at must be a valid date string'),
    body('visibility')
      .optional()
      .notEmpty()
      .withMessage('Visibility is required'),
    body('points_value')
      .optional()
      .isNumeric()
      .withMessage('Points value must be a numeric value'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('prerequisites')
      .optional()
      .isArray()
      .withMessage('Prerequisites must be an array of strings'),
    validateFields,
  ],
  updateBadge
);

// DELETE: Delete a badge
router.delete(
  '/:id',
  [
    validateJWT,
    check('id').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  deleteBadge
);

//GET badges from array
router.post(
  '/get-by-ids',
  [
    validateJWT,
    body('badgeIds')
      .isArray()
      .withMessage('badgeIds must be an array of badge IDs'),
    body('badgeIds.*')
      .isMongoId()
      .withMessage('Each item must be a valid MongoDB ObjectId'),
    validateFields,
  ],
  getBadgesByIds
);

// GET: Read badges by user ID
router.get(
  '/user/:userId',
  [
    validateJWT,
    check('userId').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getBadgesByUserId
);

router.post(
  '/getEvaluateDistanceBadge',
  [
    validateJWT,
    body('userId').isMongoId().withMessage('A valid MongoDB ID is required'),
    body('badgeId').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getEvaluateDistanceBadge
);

router.post(
  '/getEvaluateDisciplineBadge',
  [
    validateJWT,
    body('userId').isMongoId().withMessage('A valid MongoDB ID is required'),
    body('badgeId').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getEvaluateDisciplineBadge
);

router.post(
  '/getEvaluateMissionBadge',
  [
    validateJWT,
    body('userId').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getEvaluateMissionBadge
);

router.post(
  '/getEvaluateRankingBadge',
  [
    validateJWT,
    body('userId').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getEvaluateRankingBadge
);

router.post(
  '/getEvaluateTimeBadge',
  [
    validateJWT,
    body('userId').isMongoId().withMessage('A valid MongoDB ID is required'),
    body('badgeId').isMongoId().withMessage('A valid MongoDB ID is required'),
    validateFields,
  ],
  getEvaluateTimeBadge
);

export default router;
