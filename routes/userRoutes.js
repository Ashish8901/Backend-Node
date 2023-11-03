const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  singleUser,
  forgotPassword,
  resetPassword,
  changePassword,
  contactUs,
} = require('../controllers/userController');
const Auth = require('../utils/Authenticate');
const isAdminCheck = require('../utils/isAdminChecks');

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/me').post(Auth, isAdminCheck, singleUser);
router.route('/forgotpassword').post(forgotPassword);
router.route('/resetpassword').put(resetPassword);
router.route('/changepassword').patch(Auth,isAdminCheck, changePassword);
router.route('/contact').post(contactUs);

module.exports = router;
