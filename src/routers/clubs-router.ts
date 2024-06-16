import { Router } from 'express';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import {
  createClub,
  deleteClub,
  getAllClubs,
  getClubById,
  getClubDetails,
  getClubMembersPointsByPeriod,
  updateClub,
} from '../controllers/clubs-controller';
import { body, check, param, query } from 'express-validator';

const router = Router();

// C - Create a Club (ADMIN Only)
router.post(
  '/',
  [
    validateJWT,
    body('name', 'name is required').notEmpty(),
    body('image_url', 'image_url is required').notEmpty(),
    body('banner_url', 'image_url is required').notEmpty(),
    body('sport_type_id', 'sport_type_id is optional')
      .optional()
      .isString()
      .isMongoId(),
    validateFields,
  ],
  createClub
);

// R - Read Club by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'Club ID is required').notEmpty(),
    check('id', 'Club ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  getClubById
);

// R - Read Club Details
router.get(
  '/details/:id',
  [
    validateJWT,
    param('id', 'Club ID is required').notEmpty(),
    param('id', 'Club ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  getClubDetails
);

// R - Read all Clubs
router.get('/', [validateJWT, validateFields], getAllClubs);

// U - Update a Club
router.put(
  '/:id',
  [
    validateJWT,
    check('id', 'Club ID is required').notEmpty(),
    check('id', 'Club ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  updateClub
);

// D - Delete a Club
router.delete(
  '/:id',
  [
    validateJWT,
    check('id', 'Club ID is required').notEmpty(),
    check('id', 'Club ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  deleteClub
);

// R - Get Club Members Points by Period
router.get(
  '/points/:id',
  [
    validateJWT,
    check('id', 'Club ID is required').notEmpty(),
    check('id', 'Club ID needs to be a valid database ID').isMongoId(),
    query('period', 'Period is required').notEmpty(),
    query(
      'period',
      'Period must be one of: week, month, quarter, half, year'
    ).isIn([
      'week',
      'month',
      'quarter',
      'half',
      'year',
      'previousWeek',
      'previousMonth',
    ]),
    validateFields,
  ],
  getClubMembersPointsByPeriod
);

//Exports
export default router;
