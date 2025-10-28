const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validationMiddleware');

router.post('/register', validateRegistration, authCtrl.signup);
router.post('/login', validateLogin, authCtrl.login);
router.post('/forgot-password', validateForgotPassword, authCtrl.forgotPassword);
router.post('/reset-password', validateResetPassword, authCtrl.resetPassword);
router.get('/verify-reset-token/:token', authCtrl.verifyResetToken);

module.exports = router;
