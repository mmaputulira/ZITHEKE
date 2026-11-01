import mongoose from "mongoose";
const schema = new mongoose.Schema({
  buyerUid: { type:String, required:true, unique:true },
  items: [{ type:mongoose.Schema.Types.ObjectId, ref:"Ad" }],
}, { timestamps:true });
export default mongoose.model("Cart", schema);
