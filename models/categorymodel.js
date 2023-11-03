const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      slug: 'name',
      slug_padding_size: 2,
      unique: true,
    },
    SEOtitle: {
      type: String,
      required: true,
    },
    SEOdescription: {
      type: String,
      required: true,
    },
    isActive:{
      type:Boolean,
      default:true
    },
    SEOkeywords: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true }
);
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;