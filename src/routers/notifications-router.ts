import { Router } from 'express';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import {
  deleteNotificationById,
  getNotificationsByUserId,
  updateReadNotification,
  updateReadNotifications,
} from '../controllers/notifications-controller';
import { body, check } from 'express-validator';

const router = Router();

//R - Get all notifications by user ID
router.get('/', [validateJWT, validateFields], getNotificationsByUserId);

//U - Update a notfication by ID as READ
router.put(
  '/mark-read/:id',
  [
    validateJWT,
    check('id', 'The notification ID is required').notEmpty(),
    check('id', 'The notification ID must be a valid ID').isMongoId(),
    validateFields,
  ],
  updateReadNotification
);

// U - Update multiple notifications as READ
router.put(
  '/mark-read', // Changed from '/:id' to a more appropriate endpoint for bulk updates
  [
    validateJWT,
    body('notificationIds', 'Notification IDs are required').notEmpty(), // Validate that the notificationIds array is not empty
    body('notificationIds', 'Notification IDs must be an array').isArray(), // Validate that the input is an array
    body(
      'notificationIds.*',
      'Each notification ID must be a valid ID'
    ).isMongoId(), // Validate each ID in the array
    validateFields,
  ],
  updateReadNotifications
);

//D - Delete a notfication by ID
router.delete(
  '/:id',
  [
    validateJWT,
    check('id', 'The notification ID is required').notEmpty(),
    check('id', 'The notification ID must be a valid ID').isMongoId(),
    validateFields,
  ],
  deleteNotificationById
);

//Export
export default router;
