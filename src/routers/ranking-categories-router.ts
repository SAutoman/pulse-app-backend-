import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from '../controllers/ranking-categories-controller';

const router = Router();

// C - Create a Category
router.post(
  '/',
  [
    validateJWT,
    body('name', 'Category name is required').notEmpty(),
    body('order', 'Category order is required').isInt(),
    validateFields,
  ],
  createCategory
);

// R - Read all Categories
router.get('/', [validateJWT, validateFields], getAllCategories);

// R - Read a Single Category by ID
router.get(
  '/:id',
  [
    validateJWT,
    param('id', 'Category ID is required').notEmpty(),
    param('id', 'Category ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  getCategoryById
);

// U - Update a Category
router.put(
  '/:id',
  [
    validateJWT,
    param('id', 'Category ID is required').notEmpty(),
    param('id', 'Category ID needs to be a valid database ID').isMongoId(),
    body('name', 'Category name is required').notEmpty(),
    body('order', 'Category order is required').isInt(),
    validateFields,
  ],
  updateCategory
);

// D - Delete a Category
router.delete(
  '/:id',
  [
    validateJWT,
    param('id', 'Category ID is required').notEmpty(),
    param('id', 'Category ID needs to be a valid database ID').isMongoId(),
    validateFields,
  ],
  deleteCategory
);

export default router;
