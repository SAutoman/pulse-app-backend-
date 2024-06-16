// routes/sportTypes-router.js

import { Router } from 'express';
import {
  createSportType,
  deleteSportTypeById,
  getAllSportTypes,
  getSportTypeById,
  updateSportTypeById,
} from '../controllers/sports-type-controller';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import { body, param } from 'express-validator';

const router = Router();

// C - Create a SportType
router.post(
  '/',
  [
    validateJWT,
    body('name', 'The name is required').notEmpty(),
    body('description').optional().isString(),
    validateFields,
  ],
  createSportType
);

// R - Get all SportTypes
router.get('/', [validateJWT, validateFields], getAllSportTypes);

// R - Get SportType by ID
router.get(
  '/:id',
  [
    validateJWT,
    param('id', 'A valid ID is required').notEmpty().isMongoId(),
    validateFields,
  ],
  getSportTypeById
);

// U - Update SportType by ID
router.put(
  '/:id',
  [
    validateJWT,
    param('id', 'A valid ID is required').notEmpty().isMongoId(),
    body('name').optional().isString(),
    body('description').optional().isString(),
    validateFields,
  ],
  updateSportTypeById
);

// D - Delete SportType by ID
router.delete(
  '/:id',
  [
    validateJWT,
    param('id', 'A valid ID is required').notEmpty().isMongoId(),
    validateFields,
  ],
  deleteSportTypeById
);

export default router;
