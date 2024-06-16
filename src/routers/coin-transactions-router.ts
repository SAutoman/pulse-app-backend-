import { Router } from 'express';

import express from 'express';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';

const router = Router();

import { body, param } from 'express-validator';
import {
  addCoinTransaction,
  getCoinTransactionsByUser,
} from '../controllers/coin-transactions-controller';

// Validation for creating a new coin transaction
const validateCoinTransaction = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isInt()
    .withMessage('Amount must be an integer'),
  body('type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['WEEKLY_POINTS', 'REWARD_REDEMPTION', 'MISSION_ACHIEVED'])
    .withMessage('Invalid transaction type specified'),
  body('description')
    .optional()
    .isObject()
    .withMessage('Description must be a JSON object'),
];

const userIdValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
];

router.get(
  '/user/:userId',
  [validateJWT, ...userIdValidation, validateFields],
  getCoinTransactionsByUser
);

router.post(
  '/',
  [validateJWT, ...validateCoinTransaction, validateFields],
  addCoinTransaction
);

export default router;
