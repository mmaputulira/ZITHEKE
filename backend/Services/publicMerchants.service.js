import User from "../models/User.js";
export const eligibleMerchantQuery = {
  status:"Active", role:{ $ne:"admin" },
  $and:[{ $or:[{accountType:"merchant"},{accountType:{$exists:false}}] }, { $or:[{merchantStatus:"active"},{merchantStatus:{$exists:false}}] }],
};
export const activeMerchantUids = async () => (await User.find(eligibleMerchantQuery).select("uid").lean()).map(user=>user.uid);
