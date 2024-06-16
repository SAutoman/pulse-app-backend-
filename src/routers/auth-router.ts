import { Router } from 'express';
import { body, check } from 'express-validator';
import {
  createUser,
  forgotPassword,
  loginUser,
  resetPassword,
  validateLogin,
} from '../controllers/auth-controller';
import { validateFields } from '../middlewares/validate-fields';
import { userEmailExists } from '../helpers/db-validators';
import { validateJWT } from '../middlewares/validate-jwt';

const router = Router();

//Sign up a user with email and password
router.post(
  '/signup',
  [
    check('email', 'email is mandatory').notEmpty().isEmail(),
    check('email').custom(userEmailExists),
    check('password', 'password is mandatory').notEmpty(),
    check('first_name', 'first_name is mandatory').notEmpty(),
    check('last_name', 'last_name is mandatory').notEmpty(),
    check('country', 'country is mandatory').notEmpty(),
    check('timezone', 'timezone is mandatory').notEmpty(),
    validateFields,
  ],
  createUser
);

//Login user
router.post(
  '/login',
  [
    check('email', 'email is mandatory').notEmpty().isEmail(),
    check('password', 'password is mandatory').notEmpty(),
    validateFields,
  ],
  loginUser
);

//Validate Login token
router.post('/validateLogin', [validateJWT], validateLogin);

router.get('/', (req, res) => {
  res.send('Server deployed');
});

// Forgot password route
router.post(
  '/forgot-password',
  [body('email', 'Please include a valid email').isEmail(), validateFields],
  forgotPassword
);

// Reset password route
router.post(
  '/reset-password',
  [
    check('token', 'Token is required').notEmpty(),
    check('newPassword', 'Password is required').notEmpty(),
    check('email', 'Email is required').notEmpty().isEmail(),
    validateFields,
  ],
  resetPassword
);

module.exports = router;

//Exports
export default router;
