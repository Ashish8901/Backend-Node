const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ _id: decoded._id });

    if (!user && !(req.baseUrl === '/post' && req.method === 'GET')) {
      throw new Error();
    }

    if (user) {
      req.savedUser = user;
      req.accessToken = token;
    }

    next();

  } catch (e) {
    if (req.baseUrl === '/post' && req.method === 'GET') {
      next();
    } else {
      res.status(401).json({ success: false, error: 'Please authenticate!' });
    }
  }
};

module.exports = auth;
