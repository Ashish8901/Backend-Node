const express = require('express');
const Post = require('../models/postModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const User = require('../models/userModel');

// Image upload Middleware

const constructFname = (filename) => {
  const date = new Date();
  return `${date.getTime()}-${filename}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Images');
  },
  filename: function (req, file, callback) {
    callback(null, constructFname(file.originalname));
  },
});

function checkFileType(file, cb) {
  console.log(file);
  const filetypes = /jpg|jpeg|png|gif/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLocaleLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Please upload an image file!'));
  }
}
exports.upload = multer({
  storage,
  limits: {
    fileSize: 2000000,
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @desc Create Post
// @route POST '/post/create'
// @access Admin

exports.createPost = async (req, res) => {
  const date = new Date();

  try {
    const {
      title,
      description,
      category,
      SEOtitle,
      SEOdescription,
      SEOkeywords,
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !SEOtitle ||
      !SEOdescription ||
      !SEOkeywords
    ) {
      return res.status(400).json({
        success: false,
        message: 'please fill all the fields',
      });
    }
    console.log(req.body);
    const user = req.savedUser;

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (!req.file) {
      return res
        .status(404)
        .json({ success: false, error: 'please upload an image' });
    }
    fs.access('Images', (err) => {
      if (err) {
        fs.mkdirSync('/Images');
      }
    });

    const newPost = await Post.create({
      ...req.body,
      photo: `Images/${req.file.filename}`,
    });

    res.status(200).json(newPost);
  } catch (error) {
    console.log(error);
    if (req.file) {
      fs.unlinkSync(path.resolve(`Images/${req.file.filename}`));
    }
    res.status(400).json({ success: false, message: 'Post Not Created' });
  }
};

// @desc Upload Image
// @route POST '/post/uploadimage'
// @access Admin

exports.UploadImage = async (req, res) => {
  try {
    const user = req.savedUser;

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    fs.access('Images', (err) => {
      if (err) {
        fs.mkdirSync('/Images');
      }
    });
    const filepath = `Images/${req.file.filename}`;
    const filename = `${req.file.filename}`;

    res.status(200).json({ success: true, filepath, filename });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(path.resolve(`Images/${req.file.filename}`));
    }
    res.status(400).json({ success: false, message: 'Image not Uploaded' });
  }
};

// @desc Update Posts with Image
// @route Patch '/post/updatepost/:id'
// @access Admin

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const updates = Object.keys(req.body);
    updates.forEach((update) => (post[update] = req.body[update]));

    fs.access('Images', (err) => {
      if (err) {
        fs.mkdirSync('/Images');
      }
    });
    if (req.file) {
      if (fs.existsSync(post.photo)) {
        fs.unlinkSync(path.resolve(post.photo));
      }
      post.photo = `Images/${req.file.filename}`;
    }
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated',
      post,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(path.resolve(`Images/${req.file.filename}`));
    }
    res.status(400).json({ success: false, message: 'Post Updation Failed' });
  }
};

// @desc List All Posts
// @route GET '/post/getposts'
// @access Public

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const searchQuery = req.query.keyword || '';
    const status = req.query.status;
    const skipDocs = (page - 1) * limit;
    let modifiedAfter;

    let allowedStatus = [];
    if (req.savedUser) {
      if (req.query.status === 'Draft') {
        allowedStatus = ['Draft'];
      } else if (req.query.status === 'Publish') {
        allowedStatus = ['Publish'];
      } else {
        allowedStatus = ['Publish', 'Draft'];
      }
    } else {
      allowedStatus = ['Publish'];
    }

    let filter = {
      $and: [{ status: { $in: allowedStatus } }],
    };

    if (req.query.category) {
      filter['$and'].push({ category: req.query.category });
    }
    if (searchQuery) {
      filter['$and'].push({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ],
      });
    }

    if (req.query.modifiedAfter) {
      modifiedAfter = new Date(req.query.modifiedAfter);
      filter['$and'].push({ updatedAt: { $gte: modifiedAfter } });
    }



    const total = await Post.countDocuments(filter);
    const query = Post.find(filter).populate('category', 'name');
    const posts = await query
      .skip(skipDocs)
      .limit(limit)
      .sort('-createdAt')
      .exec();
    const lastPage = Math.ceil(total / limit);
    const data = {
      page,
      lastPage,
      resultPerPage: limit,
      postCount: total,
      UserPost: posts,
    };
    return res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc List Single Posts
// @route GET '/post/getsinglepost/:slug'
// @access Public

exports.getSinglePost = async (req, res) => {
  try {
    const UserPost = await Post.findOne({ slug: req.params.slug }).populate(
      'category',
      'name'
    );
    if (!UserPost) {
      return next('Post not found', 404);
    }
    res.json({ success: true, UserPost });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Not fetched' });
  }
};

// @desc Delete Posts
// @route GET '/post/deletepost/:id'
// @access Admin

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found!' });

    if (post.isActive === true) {
      post.isActive = false;
      post.status = 'Deleted';
    } else {
      post.isActive = true;
      post.status = 'Draft';
    }
    await post.save();
    res.json({
      success: true,
      message: 'Post status updated',
      post,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
