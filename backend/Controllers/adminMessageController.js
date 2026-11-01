import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

const retentionDate = () => new Date(Date.now() + 30 * 86400000);

export const getAllConversations = async (req, res) => {
  try {
    const trash = String(req.query.trash || "false") === "true";
    const conversations = await Conversation.find(trash ? { trashedAt: { $ne: null } } : { trashedAt: null })
      .sort({ updatedAtSort: -1 }).lean();
    if (!conversations.length) return res.json([]);
    const userIds = [...new Set(conversations.flatMap((c)=>c.participants||[]))];
    const users = await User.find({ uid:{ $in:userIds } }).select("uid name displayName email photoURL").lean();
    const userMap = Object.fromEntries(users.map((u)=>[u.uid,{ name:u.name||u.displayName||"Unknown", email:u.email||"", photo:u.photoURL||"" }]));
    return res.json(conversations.map((conv)=>({
      _id:conv._id,
      userA:userMap[conv.participants?.[0]]||{name:"User"},
      userB:userMap[conv.participants?.[1]]||{name:"User"},
      lastMessage:conv.lastMessage||"",
      updatedAt:conv.updatedAtSort||conv.updatedAt,
      trashedAt:conv.trashedAt,
      purgeAfter:conv.purgeAfter,
    })));
  } catch (error) { return res.status(500).json({ error:"Error fetching admin conversations" }); }
};

export const getMessagesForAdmin = async (req,res) => {
  try {
    const { conversationId }=req.params; if(!conversationId)return res.status(400).json({error:"Conversation ID required"});
    const query=mongoose.Types.ObjectId.isValid(conversationId)?{$or:[{conversationId:new mongoose.Types.ObjectId(conversationId)},{conversationId}]}:{conversationId};
    const msgs=await Message.find(query).sort({createdAt:1}).lean(); return res.json(msgs);
  } catch { return res.status(500).json({error:"Error fetching admin messages"}); }
};

export const deleteConversationForAdmin = async (req,res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.conversationId))return res.status(400).json({success:false,message:"Valid conversation ID is required"});
    const convo=await Conversation.findByIdAndUpdate(req.params.conversationId,{trashedAt:new Date(),purgeAfter:retentionDate()},{new:true});
    if(!convo)return res.status(404).json({success:false,message:"Conversation not found"});
    return res.json({success:true,message:"Conversation moved to Trash for 30 days",data:{conversationId:convo._id,purgeAfter:convo.purgeAfter}});
  } catch { return res.status(500).json({success:false,message:"Failed to move conversation to Trash"}); }
};

export const restoreConversationForAdmin = async (req,res) => {
  try { const convo=await Conversation.findByIdAndUpdate(req.params.conversationId,{trashedAt:null,purgeAfter:null},{new:true}); if(!convo)return res.status(404).json({success:false,message:"Conversation not found"}); return res.json({success:true,message:"Conversation restored"}); }
  catch { return res.status(500).json({success:false,message:"Failed to restore conversation"}); }
};

export const purgeConversationForAdmin = async (req,res) => {
  try {
    const id=req.params.conversationId; if(!mongoose.Types.ObjectId.isValid(id))return res.status(400).json({success:false,message:"Valid conversation ID is required"});
    const convo=await Conversation.findOne({_id:id,trashedAt:{$ne:null}}).lean(); if(!convo)return res.status(404).json({success:false,message:"Trashed conversation not found"});
    await Message.deleteMany({$or:[{conversationId:new mongoose.Types.ObjectId(id)},{conversationId:id}]}); await Conversation.deleteOne({_id:id});
    return res.json({success:true,message:"Conversation permanently deleted"});
  } catch { return res.status(500).json({success:false,message:"Failed to permanently delete conversation"}); }
};
