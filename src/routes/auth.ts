import { Router } from 'express';
import { register, login, refreshToken } from '../controllers/auth';
import { validateRequest } from '../middleware/validate';
const { body } = require('express-validator');
const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('role').optional().isString(),
    validateRequest
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
    validateRequest
  ],
  login
);

router.post('/refresh', refreshToken);

export default router;