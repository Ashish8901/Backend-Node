const Category = require('../models/categorymodel');

// @desc Create Category
// @route POST '/category/postcategory'
// @access Admin

exports.createCategory = async (req, res) => {
  try {
    const user = req.savedUser;

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    const cate = new Category(req.body);
    await cate.save();
    res
      .status(200)
      .json({ success: true, message: 'Category Added Succesfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Category Not Created' });
  }
};

// @desc Get Category
// @route GET '/category/getcategory'
// @access Admin

exports.getCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const searchQuery = req.query.keyword || '';
    const skipDocs = (page - 1) * limit;

    let filter = {
      $and: [
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
          ],
        },
      ],
    };

    const total = await Category.countDocuments(filter);
    const query = Category.find(filter);
    const category = await query
      .skip(skipDocs)
      .limit(limit)
      .sort('-createdAt')
      .exec();
    const lastPage = Math.ceil(total / limit);
    const data = {
      page,
      lastPage,
      resultPerPage: limit,
      categoryCount: total,
      cate: category,
    };
    return res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc Get single category
// @route GET '/category/getcategory/:id'
// @access Admin

exports.getSingleCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(400).json({ message: 'category not found' });
    }
    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Cannot get category' });
  }
};

// @desc Update Category
// @route PATCH '/category/updatecategory/:id'
// @access Admin

exports.updateCategory = async (req, res) => {
  try {
    const _id = req.params.id;
    const updateCategory = await Category.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    res.status(200).json({
      success: true,
      updateCategory,
    });
  } catch (e) {
    res.status(500).send(e);
  }
};

// @desc Delete Category
// @route GET '/category/delcategory/:id'
// @access Admin

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: 'Category not found!' });

    if (category.isActive === true) {
      category.isActive = false;
    } else {
      category.isActive = true;
    }

    await category.save();
    res.json({
      success: true,
      message: 'Category status updated',
      category,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
