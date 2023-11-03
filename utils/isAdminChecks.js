const isAdminCheck = async (req, res, next) => {
  if (req.savedUser.role !== 'admin') {
    res.status(401).json({
      success: false,
      message: 'Unauthorized access',
    });
  } else {
    next();
  }
};

module.exports = isAdminCheck;
