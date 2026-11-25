import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 140,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Picture shown on the home page. Empty means the built-in default picture.
    image: { type: String, trim: true, default: "" },
    // True when an admin removed the picture on purpose, so no default is shown.
    imageHidden: { type: Boolean, default: false },
  },
  { _id: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 140,
    },
    keywords: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subcategories: {
      type: [subcategorySchema],
      default: [],
    },
  },
  { timestamps: true }
);


export default mongoose.model("Category", categorySchema);
