import mongoose from "mongoose";

// Website content that staff edit from the Admin panel (for example the footer).
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model("SiteContent", siteContentSchema);
