const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: 'String',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: 'admin',
    },
    otp: {
      value: { type: String },
      expire: { type: Date },
    },
  },
  { timestamps: true }
);

// Defining function for hiding private data of users

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  delete userObject.otp;

  return userObject;
};

// hashing password before saving the user

UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified(' ')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
  next();
});

// Validating password before Login

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate Token for Authentication

UserSchema.methods.generateAuthToken = async function () {
  try {
    let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY, {
      expiresIn: '30d',
    });
    return token;
  } catch (e) {
    console.log(e);
  }
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
