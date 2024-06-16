import { Router } from 'express';
import {
  deleteUserById,
  getAllUsers,
  getUserById,
  getUsersRankingByWeek,
  testingEndpoint,
  updateUserById,
} from '../controllers/users-contoller';
import { validateJWT } from '../middlewares/validate-jwt';
import { validateFields } from '../middlewares/validate-fields';
import { check, query } from 'express-validator';

const router = Router();

//Get users ranking in the current week
router.get(
  '/ranking',
  [
    validateJWT,
    query('rankingLeagueId')
      .notEmpty()
      .withMessage('rankingLeagueId is required')
      .isMongoId()
      .withMessage('rankingLeagueId must be a valid MongoID'),
    validateFields,
  ],
  getUsersRankingByWeek
);

//R - Get All Users
router.get('/', [validateJWT, validateFields], getAllUsers);

//R - Get User by ID
router.get(
  '/:id',
  [
    validateJWT,
    check('id', 'The userId is mandatory').notEmpty(),
    check('id', 'The userId must be in valid format').isMongoId(),
    validateFields,
  ],
  getUserById
);

//U - Edit User
router.put(
  '/:id',
  [
    validateJWT,
    //TODO: The authenticated  user must be the same updated or admin user
    check('id', 'The userId is mandatory').notEmpty(),
    check('id', 'The userId must be in valid format').isMongoId(),
    validateFields,
  ],
  updateUserById
);

//D - Delete User
router.delete(
  '/:id',
  [
    validateJWT,
    check('id', 'The userId is mandatory').notEmpty(),
    check('id', 'The userId must be in valid format').isMongoId(),
    validateFields,
  ],
  deleteUserById
);

//Testing endpoint
router.get('/other/test', [], testingEndpoint);

//Exports
export default router;
