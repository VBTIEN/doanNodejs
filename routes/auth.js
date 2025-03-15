const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { redirectToGoogle, handleGoogleCallback, selectRole } = require('../controllers/googleController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.get('/password/validate-token', authController.validateToken);
router.get('/user', auth, authController.getUser);

router.get('/status', (req, res) => { res.json({ status: 'ok', backend: 'js' }); });

router.get('/auth/google', redirectToGoogle);
router.get('/auth/google/callback', handleGoogleCallback);
router.post('/select-role', express.json(), selectRole);

module.exports = router;