import express from 'express';
import { body, validationResult } from 'express-validator';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import { receivedHealthWorkouts } from '../controllers/device-health-controller';

const router = express.Router();

// Middleware to validate request body for receivedHealthWorkouts
const validateWorkouts = [
  body('workouts').isArray().withMessage('Workouts should be an array'),
  body('workouts.*.workoutId').notEmpty().withMessage('workoutId is required'),
  body('workouts.*.userId').notEmpty().withMessage('userId is required'),
  body('workouts.*.workoutType')
    .notEmpty()
    .withMessage('workoutType is required'),
  body('workouts.*.distance')
    .isNumeric()
    .withMessage('distance should be a number'),
  body('workouts.*.distanceUnit')
    .notEmpty()
    .withMessage('distanceUnit is required'),
  body('workouts.*.energyBurned')
    .isNumeric()
    .withMessage('energyBurned should be a number'),
  body('workouts.*.startDateUtc')
    .isISO8601()
    .withMessage('startDateUtc should be a valid ISO8601 date'),
  body('workouts.*.endDateUtc')
    .isISO8601()
    .withMessage('endDateUtc should be a valid ISO8601 date'),
  body('workouts.*.averageHeartRate')
    .optional()
    .isNumeric()
    .withMessage('averageHeartRate should be a number'),
  body('workouts.*.maxHeartRate')
    .optional()
    .isNumeric()
    .withMessage('maxHeartRate should be a number'),
  body('workouts.*.sourceName')
    .notEmpty()
    .withMessage('sourceName is required'),
];

// Define the route and apply the validation middleware
router.post(
  '/',
  [validateJWT, ...validateWorkouts, validateFields],
  receivedHealthWorkouts
);

export default router;
