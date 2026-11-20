import Order from "../models/Order.js";
import { createPurchaseRequest, transitionOrder } from "../Services/orders.service.js";
const populateOrder = query => query.populate("adId", "title price currency images ownerUid status city location");
const fail = (res,error) => res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Unable to process purchase request" });
export const createOrder = async (req,res) => {
  try { const result = await createPurchaseRequest({ buyer: req.user, adId:req.body.adId, offerId:req.body.offerId, note:req.body.note }); res.status(result.reused ? 200 : 201).json(result); }
  catch(error) { fail(res,error); }
};
export const listMyOrders = async (req,res) => {
  try { // One account can both buy and sell, so the caller picks which history to view.
    const role = req.query.role === "seller" || (!req.query.role && req.user.accountType === "merchant") ? "seller" : "buyer";
    const seller = role === "seller";
    const query = seller ? { sellerUid: req.user.uid } : { buyerUid: req.user.uid };
    res.json({ orders: await populateOrder(Order.find(query).sort({ createdAt:-1 }).limit(200)), role });
  } catch(error) { fail(res,error); }
};
export const updateOrderStatus = async (req,res) => {
  try { const order = await transitionOrder({ principal:req.user, orderId:req.params.orderId, action:String(req.body.action || "").toLowerCase(), note:req.body.note }); res.json({ order:await populateOrder(Order.findById(order._id)) }); }
  catch(error) { fail(res,error); }
};
export const listAdminOrders = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = String(req.query.status).toUpperCase();
    if (req.query.sellerUid) query.sellerUid = String(req.query.sellerUid);
    if (req.query.buyerUid) query.buyerUid = String(req.query.buyerUid);
    const orders = await populateOrder(Order.find(query).sort({ createdAt: -1 }).limit(500));
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load marketplace orders" });
  }
};
