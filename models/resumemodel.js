const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: true,
    },
    lname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    DOB: Date,
  },
  { timestamps: true }
);

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
