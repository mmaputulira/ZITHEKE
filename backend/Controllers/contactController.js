import ContactMessage from "../models/ContactMessage.js";

const retentionDate = () => new Date(Date.now() + 30 * 86400000);

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ success:false, message:"All fields are mandatory" });
    const newMessage = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ success:true, message:"Message submitted successfully", data:newMessage });
  } catch (error) { res.status(500).json({ success:false, message:"Server error, please try again later" }); }
};

export const getAllContactMessages = async (req, res) => {
  try {
    const trash = String(req.query.trash || "false") === "true";
    const query = trash ? { trashedAt: { $ne: null } } : { trashedAt: null };
    const messages = await ContactMessage.find(query).sort({ createdAt:-1 });
    res.status(200).json({ success:true, count:messages.length, data:messages });
  } catch (error) { res.status(500).json({ success:false, message:"Failed to fetch messages" }); }
};

export const markMessageAsRead = async (req,res) => {
  try { const updated=await ContactMessage.findByIdAndUpdate(req.params.id,{isRead:true},{new:true}); if(!updated)return res.status(404).json({success:false,message:"Message not found"}); res.json({success:true,message:"Message marked as read",data:updated}); }
  catch { res.status(500).json({success:false,message:"Unable to update message"}); }
};

export const deleteContactMessage = async (req,res) => {
  try { const item=await ContactMessage.findByIdAndUpdate(req.params.id,{trashedAt:new Date(),purgeAfter:retentionDate()},{new:true}); if(!item)return res.status(404).json({success:false,message:"Message not found"}); res.json({success:true,message:"Message moved to Trash for 30 days",data:item}); }
  catch { res.status(500).json({success:false,message:"Unable to move message to Trash"}); }
};

export const restoreContactMessage = async (req,res) => {
  try { const item=await ContactMessage.findByIdAndUpdate(req.params.id,{trashedAt:null,purgeAfter:null},{new:true}); if(!item)return res.status(404).json({success:false,message:"Message not found"}); res.json({success:true,message:"Message restored",data:item}); }
  catch { res.status(500).json({success:false,message:"Unable to restore message"}); }
};

export const purgeContactMessage = async (req,res) => {
  try { const item=await ContactMessage.findOneAndDelete({_id:req.params.id,trashedAt:{$ne:null}}); if(!item)return res.status(404).json({success:false,message:"Trashed message not found"}); res.json({success:true,message:"Message permanently deleted"}); }
  catch { res.status(500).json({success:false,message:"Unable to permanently delete message"}); }
};
