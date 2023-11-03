const mongoose = require('mongoose');
const domPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const stripHtml = require('string-strip-html');
const htmlPurify = domPurifier(new JSDOM().window);
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);
const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    snippet: {
      type: String,
    },
    slug: {
      type: String,
      slug: 'title',
      slug_padding_size: 2,
      unique: true,
    },
    photo: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    SEOtitle: {
      type: String,
      required: true,
    },
    SEOdescription: {
      type: String,
      required: true,
    },
    SEOkeywords: [
      {
        type: String,
        required: true,
      },
    ],
    status: {
      type: String,
      default: 'Draft',
      enum: ['Publish', 'Draft', 'Deleted'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Generating Snippet of description

PostSchema.pre('validate', function (next) {
  if (this.description) {
    this.description = htmlPurify.sanitize(this.description);
    this.snippet = stripHtml(this.description.substring(0, 200)).result;
  }
  next();
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
