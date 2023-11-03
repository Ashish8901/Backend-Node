const express = require('express');
const router = express.Router();
const Auth = require('../utils/Authenticate');
const isAdminCheck = require('../utils/isAdminChecks');
const {
  createCategory,
  getCategory,
  getSingleCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

router.route('/postcategory').post(Auth,isAdminCheck,  createCategory);
router.route('/getcategory').get(getCategory);
router.route('/getcategory/:id').get(Auth,isAdminCheck,  getSingleCategory);
router.route('/updatecategory/:id').patch( Auth,isAdminCheck, updateCategory);
router.route('/delcategory/:id').patch(Auth,isAdminCheck,  deleteCategory);

module.exports = router;
