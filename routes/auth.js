const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.get('/password/validate-token', authController.validateToken);
router.get('/user', auth, authController.getUser);

router.get('/status', (req, res) => {
    res.json({ status: 'ok', backend: 'js' });
});

module.exports = router;