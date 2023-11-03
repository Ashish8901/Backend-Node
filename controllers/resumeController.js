const express = require('express');
const Resume = require('../models/resumemodel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Upload File Middleware

const constructFname = (filename) => {
  const date = new Date();
  return `${date.getTime()}-${filename}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Uploads');
  },
  filename: function (req, file, cb) {
    cb(null, constructFname(file.originalname));
  },
});

function checkFileType(file, cb) {
  const filetypes = /pdf|doc/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLocaleLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Please upload a document file!'));
  }
}

exports.upload = multer({
  storage,
  limits: {
    fileSize: 5000000,
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @desc Create resume
// @route POST '/resume/uploadresume'
// @access Public

exports.UploadResume = async (req, res) => {
  try {
    let dat = req.body.DOB;
    dob = new Date(dat).toLocaleDateString();

    const { fname, lname, email, jobRole } = req.body;

    if (!fname || !lname || !email || !dob || !jobRole) {
      return res.status(400).json({
        success: false,
        message: 'please fill all the fields',
      });
    }

    if (!req.file) {
      return res
        .status(404)
        .json({ success: false, message: 'Please upload a file' });
    }
    if (req.body) {
      fs.access('Uploads', (err) => {
        if (err) {
          fs.mkdirSync('/Uploads');
        }
      });
    }

    const newresumeUpload = await Resume.create({
      ...req.body,
      dob,
      resume: `Uploads/${req.file.filename}`,
    });

    res.status(200).json(newresumeUpload);
  } catch (error) {
    console.log(error);
    if (req.file) {
      fs.unlinkSync(path.resolve(`Uploads/${req.file.filename}`));
    }
    res.status(400).json({ success: false, message: 'Form not Filled' });
  }
};

// @desc List resume
// @route GET '/resume/getresume/'
// @access Public

exports.getResume = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const searchQuery = req.query.keyword || '';
    let startDate;
    let endDate;

    if (req.query.from) {
      startDate = new Date(req.query.from);
    }
    if (req.query.to) {
      endDate = new Date(req.query.to);
    }

    const skipDocs = (page - 1) * limit;

    let filter = {
      $and: [
        {
          $or: [
            { fname: { $regex: searchQuery, $options: 'i' } },
            { lname: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
          ],
        },
      ],
    };

    if (startDate && endDate) {
      filter = {
        ...filter,
        $or: [
          {
            createdAt: {
              $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
              $lt: new Date(new Date(endDate).setHours(23, 59, 59)),
            },
          },
        ],
      };
    } else if (endDate) {
      filter = {
        ...filter,
        createdAt: { $lte: new Date(new Date(endDate).setHours(23, 59, 59)) },
      };
    } else if (startDate) {
      filter = {
        ...filter,
        createdAt: { $gte: new Date(new Date(startDate).setHours(00, 00, 00)) },
      };
    }

    const total = await Resume.countDocuments(filter);
    const query = Resume.find(filter);
    const resume = await query
      .skip(skipDocs)
      .limit(limit)
      .sort('-createdAt')
      .exec();
    const lastPage = Math.ceil(total / limit);
    const data = {
      page,
      lastPage,
      resultPerPage: limit,
      resumeCount: total,
      UserResume: resume,
    };
    return res.json({ success: true, ...data });
  } catch (error) {
    console.log(error);
  }
};
