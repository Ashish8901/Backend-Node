const bcrypt = require('bcrypt');
const { authSchema, loginSchema } = require('../utils/validation_schema');
const User = require('../models/userModel');
const sendMail = require('../utils/sendEmail');

// @desc Register user
// @route POST '/user/register'
// @access Private

exports.registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res
      .status(400)
      .json({ success: false, message: 'Please Fill all the fields' });
  }
  try {
    const result = await authSchema.validateAsync(req.body);
    console.log('result', result);

    const exist = await User.findOne({ email: result.email });
    if (exist) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already Exists' });
    }

    const user = new User(result);
    const savedUser = await user.save();
    const accessToken = await savedUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Registration Successfull',
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: 'Internal server error' });
  }
};

// @desc Login user
// @route POST '/user/login'
// @access Admin

exports.loginUser = async (req, res) => {
  try {
    const result = await loginSchema.validateAsync(req.body);

    const savedUser = await User.findOne({ email: result.email });

    if (!savedUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User Not Registered' });
    }

    const isMatch = await bcrypt.compare(result.password, savedUser.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: 'Wrong credentials' });
    }
    const accessToken = await savedUser.generateAuthToken();
    res
      .status(201)
      .json({ message: 'Login Successfully', accessToken, savedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid Credentials' });
  }
};

// @desc Get single user
// @route POST '/user/me'
// @access Admin

exports.singleUser = async (req, res) => {
  try {
    const user = await User.findById(req.savedUser.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (e) {
    res.send(e);
  }
};

// @desc Forgot password api
// @route POST '/user/forgotpassword'
// @access Admin
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: 'Email does not exist' });
    }
    const otp = Array.from(Array(12), () =>
      Math.floor(Math.random() * 36).toString(36)
    )
      .join('')
      .match(/.{1,4}/g)
      .join('-');
    const currentDate = new Date();
    const expire = currentDate.setMinutes(currentDate.getMinutes() + 5);

    user.otp = {
      value: otp,
      expire,
    };

    const mail = await sendMail({
      from: `"Revanatech" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Forgot Password',
      text: `Your OTP is ${otp}. Do not share it with anyone.`,
      html: `<p>Your OTP <strong>${otp}</strong><br/>Do not share it with anyone.</p>`,
    });
    if (mail === 'success') {
      res.json({ success: true, message: 'OTP sent!', email });
      await user.save();
    }
    if (mail === 'error') {
      res.status(400).json({ success: false, error: 'OTP not sent', email });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc Reset Password api
// @route PUT '/user/resetpassword'
// @access Admin
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found ' });
    }

    if (user.otp.value !== otp) {
      return res.status(404).json({ success: false, error: 'Incorrect OTP ' });
    }
    if (user.otp.expire < new Date()) {
      user.otp = undefined;
      await user.save();
      return res.status(403).json({ success: false, error: 'OTP expired' });
    }
    user.password = password;
    user.otp = undefined;
    await user.save();
    return res.status(200).json({ success: true, message: 'Password Changed' });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

// @desc Change Password api
// @route Patch '/user/changepassword'
// @access Admin
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const match = await bcrypt.compare(oldPassword, req.savedUser.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, error: 'invalid current password!' });
    req.savedUser.password = newPassword;

    if (newPassword != confirmPassword) {
      return res
        .status(401)
        .json({ success: false, error: 'password does not match' });
    }
    await req.savedUser.save();
    res.json({ success: true, message: 'password changed successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc ContactUs api
// @route POST '/user/contact'
// @access Public

exports.contactUs = async (req, res) => {
  console.log('first');
  try {
    const { name, email, message } = req.body;
    const user = await User.findOne({ email });

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: 'Please Fill all the fields' });
    }
    if (user == null) {
      const mail = await sendMail({
        from: `Revanatech<${email}>`,
        to: `<${email}>`,
        subject: 'Greetings from RevanaTech',
        html: `
        <strong>Thank you for contacting us. We will get back to you soon.</strong><br/>
        <b>RevanTech@support.com</b>
      
        `,
      });
    }
    const mail = await sendMail({
      from: `${name}< ${email}>`,
      to: `<${process.env.SMTP_EMAIL}>`,
      subject: 'New Contact Recieved',
      html: `
      <b>Name<b/>: <strong>${name}</strong><br/><br/>
      <b>Email<b/> :${email}<br/><br/>
      <b>Message<b/>: <strong>${message}</strong>`,
    });
    if (mail === 'success') {
      res.json({
        success: true,
        message: 'Thank You for Contacting us! We will get back to you soon.',
        email,
      });
    }
    if (mail === 'error') {
      res.status(400).json({
        success: false,
        error: 'There is some error, Please try again',
        email,
      });
    }
  } catch (error) {}
};
