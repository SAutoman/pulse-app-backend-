import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import {
  createLeague,
  deleteLeague,
  getAllLeagues,
  getLeagueById,
  updateLeague,
} from '../controllers/ranking-leagues-controller';

const router = Router();

// C - Create a League
router.post(
  '/',
  [
    validateJWT,
    body('level', 'League level is required').isInt(),
    body('category_id', 'Category ID is required').isMongoId(),
    validateFields,
  ],
  createLeague
);

// R - Read all Leagues
router.get('/', [validateJWT, validateFields], getAllLeagues);

// R - Read a Single League by ID
router.get(
  '/:id',
  [
    validateJWT,
    param('id', 'League ID is required').notEmpty(),
    param('id', 'League ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  getLeagueById
);

// U - Update a League
router.put(
  '/:id',
  [
    validateJWT,
    param('id', 'League ID is required').notEmpty(),
    param('id', 'League ID needs to be a valid database ID').isMongoId(),
    body('level', 'League level is required').isInt(),
    body('category_id', 'Category ID is required').isMongoId(),
    validateFields,
  ],
  updateLeague
);

// D - Delete a League
router.delete(
  '/:id',
  [
    validateJWT,
    param('id', 'League ID is required').notEmpty(),
    param('id', 'League ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  deleteLeague
);

export default router;
