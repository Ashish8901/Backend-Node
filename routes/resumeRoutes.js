const express = require('express');
const router = express.Router();

const {
  UploadResume,
  getResume,
  upload,
} = require('../controllers/resumeController');

router.route('/uploadresume').post(upload.single('resume'), UploadResume);
router.route('/getresume').get(getResume);

module.exports = router;
