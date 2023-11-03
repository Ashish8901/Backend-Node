const express = require('express');
const router = express.Router();
const Auth = require('../utils/Authenticate');
const isAdminCheck = require('../utils/isAdminChecks');
const {
  createPost,
  getPosts,
  getSinglePost,
  updatePost,
  deletePost,
  UploadImage,
  upload,
} = require('../controllers/postControllers');

router
  .route('/create')
  .post(Auth, isAdminCheck, upload.single('photo'), createPost);
router.route('/getposts').get(Auth, getPosts);

router.route('/getsinglepost/:slug').get(getSinglePost);
router
  .route('/updatepost/:id')
  .patch(Auth, isAdminCheck, upload.single('photo'), updatePost);
router.route('/deletepost/:id').patch(Auth, isAdminCheck, deletePost);
router
  .route('/uploadimage')
  .post(Auth, isAdminCheck, upload.single('image'), UploadImage);

module.exports = router;

