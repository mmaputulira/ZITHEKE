import { activeMerchantUids } from "../Services/publicMerchants.service.js";
import { assertMerchantUid } from "../Services/marketplaceIdentity.service.js";
import { isPurchasable } from "../utils/marketplacePolicy.js";
import { expireActiveAdBoostForSale } from "../Services/payments/subscriptionExpiry.service.js";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import Ad from "../models/Ad.js";
import Subscription from "../models/Subscription.js";
import { SUBSCRIPTION_STATUSES } from "../constants/subscriptionStatuses.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { EmailService } from "../Services/email.service.js";
import { normalizeMalawiPhone, isValidMalawiPhone } from "../utils/phone.js";
import { optimizeImageFile } from "../utils/optimizeImage.js";
import {
  isLocalUploadUrl,
  localAbsolutePathFromUrl,
  publicPathFromFile,
  toPublicUrl,
} from "../utils/uploadPath.js";

const normalizePhone = (raw = "") => normalizeMalawiPhone(raw);
const isValidPhone = (phone) => isValidMalawiPhone(phone);
const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PROTECTED_AD_FIELDS = new Set([
  "_id",
  "__v",
  "ownerUid",
  "reservedOrderId",
  "userId",
  "ownerName",
  "ownerEmail",
  "ownerPhone",
  "status",
  "featured",
  "boostSubscriptionId",
  "boostPaymentId",
  "boostStartDate",
  "boostEndDate",
  "expiryDate",
  "reported",
  "reportReason",
  "rejectionReason",
  "views",
  "favouritesCount",
  "viewedBy",
  "deletedAt",
  "deletedBy",
  "createdAt",
  "updatedAt",
]);

const stripProtectedAdFields = (payload = {}) => {
  for (const key of PROTECTED_AD_FIELDS) {
    delete payload[key];
  }
  return payload;
};
const parseArrayField = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizeConditionInput = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: undefined };
  }

  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "new") return { ok: true, value: "New" };
  if (normalized === "used") return { ok: true, value: "Used" };
  if (normalized === "not applicable" || normalized === "condition off") {
    return { ok: true, value: "Not Applicable" };
  }

  return {
    ok: false,
    message: "Invalid condition. Allowed values are New, Used or Not Applicable.",
  };
};

const CATEGORY_HINTS = {
  Vehicles: ["vehicle", "car", "bike", "motorcycle", "pickup"],
  Electronics: ["electronics", "device", "gadget", "appliance"],
  Mobiles: ["mobile", "phone", "smartphone", "tablet"],
  Furniture: ["furniture", "home item", "office item"],
  Fashion: ["fashion item", "wear", "clothing"],
  "Real Estate": ["property", "space", "listing"],
  Agriculture: ["agriculture item", "farm product", "farm input"],
  Services: ["service offer", "service"],
  Jobs: ["job opening", "job listing"],
  Music: ["music item", "audio gear", "instrument"],
};

const toSentenceCase = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const normalizeWhitespace = (value = "") =>
  String(value || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const cleanTitle = (title = "", category = "") => {
  const normalized = normalizeWhitespace(title)
    .replace(/[|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-–—]+\s*/g, " - ");

  const words = normalized
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const cappedWords = words.slice(0, 12);
  let result = cappedWords.join(" ");

  if (result && category && cappedWords.length < 4) {
    const fallbackHint = CATEGORY_HINTS[category]?.[0];
    if (fallbackHint && !result.toLowerCase().includes(fallbackHint)) {
      result = `${result} ${fallbackHint}`;
    }
  }

  return toSentenceCase(result.replace(/\s+-\s+/g, " - "));
};

const uniqueLines = (lines = []) => {
  const seen = new Set();
  return lines.filter((line) => {
    const key = line.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const splitDescriptionLines = (description = "") => {
  const normalized = normalizeWhitespace(description);
  return normalized
    .split(/\n+/)
    .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+(?=[A-Z0-9*•\-])/))
    .map((line) =>
      line
        .replace(/^[•*\-–—\s]+/, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter(Boolean);
};

const formatDescription = ({ title, description, category = "" }) => {
  const rawLines = splitDescriptionLines(description);
  const lines = uniqueLines(rawLines);
  const cleanedTitle = cleanTitle(title, category);
  const intro =
    cleanedTitle && !lines.some((line) => line.toLowerCase() === cleanedTitle.toLowerCase())
      ? `${cleanedTitle}.`
      : "";

  const bulletLines = lines.slice(0, 8).map((line) => {
    let cleaned = line.replace(/[*]+/g, "").trim();
    cleaned = cleaned.replace(/\s*:\s*/g, ": ");
    if (!/[.!?]$/.test(cleaned)) cleaned += ".";
    return `• ${toSentenceCase(cleaned)}`;
  });

  const hint = category && CATEGORY_HINTS[category]?.[0]
    ? `Category: ${CATEGORY_HINTS[category][0]}.`
    : "";

  return [intro, hint, ...bulletLines].filter(Boolean).join("\n");
};

const optimizeListingCopyLocal = async ({ title, description, category }) => {
  return {
    title: cleanTitle(title, category),
    description: formatDescription({ title, description, category }),
  };
};

const optimizeListingCopy = async ({ title, description, category }) => {
  return optimizeListingCopyLocal({ title, description, category });
};

/* ================================
   🟢 CREATE AD (Pending by default)
================================ */
export const createAd = async (req, res) => {
  try {
    const authenticatedUid = req.user?.uid;
    if (!authenticatedUid) {
      return res.status(401).json({ success: false, message: "Login required." });
    }

    // The authenticated session is authoritative. Never trust ownership,
    // moderation, boost or analytics fields supplied by the browser.
    const body = stripProtectedAdFields({ ...req.body });
    body.ownerUid = authenticatedUid;
    body.userId = authenticatedUid;

    if (!body.title || !body.description || !body.category) {
      return res.status(400).json({
        success: false,
        message: "Title, description and category are required.",
      });
    }

    Object.keys(body).forEach((key) => {
      if (body[key] === "" || body[key] === null || body[key] === undefined) {
        delete body[key];
      }
    });

    const owner = await User.findOne({ uid: authenticatedUid }).select(
      "name email phone status"
    );
    if (!owner || ["Suspended", "Inactive"].includes(owner.status)) {
      return res.status(403).json({
        success: false,
        message: "This account cannot publish listings.",
      });
    }

    body.ownerName = owner.name || "";
    body.ownerEmail = owner.email || "";
    body.ownerPhone = owner.phone || body.ownerPhone || "";

    // 4.5️⃣ Ensure owner phone exists + Malawi format
    if (!body.ownerPhone) {
      return res.status(400).json({
        success: false,
        message: "Owner phone number is required",
      });
    }

    const normalizedOwnerPhone = normalizePhone(body.ownerPhone);
    if (!isValidPhone(normalizedOwnerPhone)) {
      return res.status(400).json({
        success: false,
        message: "Use phone number with country code like +265XXXXXXXXX",
      });
    }
    body.ownerPhone = normalizedOwnerPhone;

    // 5️⃣ Boolean normalization
    body.negotiable =
      body.negotiable === "true" || body.negotiable === true;

    body.deliveryAvailable =
      body.deliveryAvailable === "true" || body.deliveryAvailable === true;

    // 5.5️⃣ Condition normalization (schema-safe)
    const normalizedCondition = normalizeConditionInput(body.condition);
    if (!normalizedCondition.ok) {
      return res.status(400).json({
        success: false,
        message: normalizedCondition.message,
      });
    }
    if (normalizedCondition.value) {
      body.condition = normalizedCondition.value;
    }

    // 6️⃣ Images from local uploads (new uploads only)
    const imageFiles = req.files?.images || [];
    const imagePaths = [];

    for (const file of imageFiles) {
      try {
        const optimizedPath = await optimizeImageFile(file.path, file.mimetype);
        if (optimizedPath !== file.path) {
          file.path = optimizedPath;
          file.filename = optimizedPath.split(/[/\\]/).pop();
        }
        const publicPath = publicPathFromFile(file);
        imagePaths.push(toPublicUrl(req, publicPath));
      } catch (imgErr) {
        await fs.unlink(file.path).catch(() => {});
        return res.status(400).json({
          success: false,
          message: "Image optimization failed. Please upload a valid image.",
        });
      }
    }

    if (imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    /* ==================================================
       🔎 6.5️⃣ AUTO TAG GENERATION (ROOT SEARCH FIX)
       - category
       - subcategory
       - title keywords
       - existing tags (if any)
    ================================================== */
    const autoTags = new Set();

    // from title
    if (body.title) {
      body.title
        .toLowerCase()
        .split(" ")
        .forEach((word) => {
          if (word.length > 2) autoTags.add(word);
        });
    }

    // from category & subcategory
    if (body.category) autoTags.add(body.category.toLowerCase());
    if (body.subcategory) autoTags.add(body.subcategory.toLowerCase());

    // preserve incoming tags if any
    if (Array.isArray(body.tags)) {
      body.tags.forEach((t) => autoTags.add(t.toLowerCase()));
    }

    body.tags = Array.from(autoTags);

    // 7️⃣ 🎥 VIDEO UPLOAD (OPTIONAL)
    let videoData = {};

    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];
      const publicPath = publicPathFromFile(videoFile);

      videoData = {
        url: toPublicUrl(req, publicPath),
        thumbnail: "",
        duration: 0,
        size: videoFile.size || 0,
        format: "mp4",
        publicId: "",
      };
    }

    // 8️⃣ Create Ad
    const newAd = await Ad.create({
      ...body,
      images: imagePaths,
      video: videoData,
      featured: false,
      status: "Pending",
      reportReason: "",
    });

    // 8.5️⃣ Email: Ad posted (queued)
    if (newAd.ownerEmail || newAd.ownerPhone) {
      EmailService.sendTemplate({
        to: newAd.ownerEmail,
        template: "AD_POSTED",
        data: {
          name: newAd.ownerName || "there",
          title: newAd.title,
          recipientPhone: newAd.ownerPhone || "",
        },
      }).catch((err) => {
        console.error("Ad posted email failed:", err?.message || err);
      });
    }

    // 9️⃣ Update user city / location (safe)
    const updateFields = {};

    if (body.city && body.city.trim() !== "") {
      updateFields.city = body.city.trim();
    }

    if (body.location && body.location.trim() !== "") {
      updateFields.location = body.location.trim();
    }

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne({ uid: body.ownerUid }, { $set: updateFields });
    }

    // 9.5️⃣ If user profile phone is empty, store from ad
    if (body.ownerPhone) {
      await User.updateOne(
        { uid: body.ownerUid, $or: [{ phone: null }, { phone: "" }] },
        { $set: { phone: body.ownerPhone } }
      );
    }

    // 🔟 Final response
    return res.status(201).json({
      success: true,
      message: "Ad submitted successfully and is pending admin approval.",
      ad: newAd,
    });
  } catch (error) {
    console.error("❌ CREATE AD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating ad",
      error: error.message,
    });
  }
};

export const optimizeListingDraft = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const category = String(req.body?.category || "").trim();

    if (title.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters long.",
      });
    }

    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters long.",
      });
    }

    const result = await optimizeListingCopy({ title, description, category });

    if (!result.title || !result.description) {
      return res.status(502).json({
        success: false,
        message: "Optimizer returned an incomplete response.",
      });
    }

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("LISTING_OPTIMIZER_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to optimize listing.",
    });
  }
};


/* ================================
   👤 GET USER ADS
================================ */
export const getUserAds = async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ message: "Missing user uid" });
    }

    // Prevent cross-user reads when token uid and path uid differ.
    if (req.user?.uid && req.user.uid !== uid) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const {
      q = "",
      status = "All",
      sort = "newest",
      page = 1,
      limit = 18,
    } = req.query;

    const normalizedPage = Math.max(parseInt(page, 10) || 1, 1);
    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 18, 1), 100);
    const trimmedQuery = String(q || "").trim();
    const trimmedStatus = String(status || "All").trim();

    const filters = { ownerUid: uid };
    if (trimmedStatus && trimmedStatus !== "All") {
      filters.status = trimmedStatus;
    }
    if (trimmedQuery) {
      filters.title = { $regex: escapeRegex(trimmedQuery), $options: "i" };
    }

    let sortStage = { createdAt: -1 };
    if (sort === "oldest") sortStage = { createdAt: 1 };
    if (sort === "views_desc") sortStage = { views: -1, createdAt: -1 };
    if (sort === "views_asc") sortStage = { views: 1, createdAt: -1 };

    const skip = (normalizedPage - 1) * normalizedLimit;

    const [ads, total] = await Promise.all([
      Ad.find(filters).sort(sortStage).skip(skip).limit(normalizedLimit),
      Ad.countDocuments(filters),
    ]);

    const adIds = ads.map((ad) => ad._id).filter(Boolean);
    const kpiByAdId = {};

    if (adIds.length > 0) {
      const conversations = await Conversation.find({
        adId: { $in: adIds },
        participants: uid,
      }).select("_id adId");

      const convToAdMap = new Map();
      const conversationIds = [];
      for (const convo of conversations) {
        const convoId = String(convo._id);
        conversationIds.push(convo._id);
        convToAdMap.set(convoId, String(convo.adId));
      }

      let messageCountByConversation = {};
      if (conversationIds.length > 0) {
        const messageAgg = await Message.aggregate([
          { $match: { conversationId: { $in: conversationIds }, isDeleted: { $ne: true } } },
          { $group: { _id: "$conversationId", count: { $sum: 1 } } },
        ]);
        messageCountByConversation = messageAgg.reduce((acc, row) => {
          acc[String(row._id)] = row.count || 0;
          return acc;
        }, {});
      }

      for (const adId of adIds) {
        const key = String(adId);
        kpiByAdId[key] = { messageCount: 0 };
      }

      for (const convo of conversations) {
        const convoId = String(convo._id);
        const adKey = convToAdMap.get(convoId);
        if (!adKey) continue;
        const count = messageCountByConversation[convoId] || 0;
        kpiByAdId[adKey].messageCount += count;
      }
    }

    const adsWithKpis = ads.map((ad) => {
      const adObj = ad.toObject();
      const kpis = kpiByAdId[String(ad._id)] || { messageCount: 0 };
      return {
        ...adObj,
        messageCount: kpis.messageCount,
      };
    });

    return res.status(200).json({
      ads: adsWithKpis,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit),
        hasMore: normalizedPage * normalizedLimit < total,
      },
      filters: {
        q: trimmedQuery,
        status: trimmedStatus,
        sort,
      },
    });
  } catch (error) {
    console.error("Error fetching user ads:", {
      uid: req.params?.uid,
      message: error?.message,
      stack: error?.stack,
    });
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Server error" });
  }
};




/* ================================
   ⭐ GET PROMO ADS (HOMEPAGE)
   - Approved / Active only
   - Limited items
   - Lightweight fields
================================ */
export const getPromoAds = async (req, res) => {
  try {
    const { category, limit = 3 } = req.query;
    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 24);

    const filters = {
      status: "Approved",
      ownerUid:{ $in:await activeMerchantUids() },
      featured: true,
    };

    if (category) {
      filters.category = category;
    }

      const ads = await Ad.find(filters)
        .sort({ createdAt: -1 }) // latest featured first
        .limit(normalizedLimit)
       .select(
    "_id title price images condition category city location ownerName negotiable"
  );


    res.status(200).json({
      success: true,
      ads,
    });
  } catch (error) {
    console.error("PROMO ADS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo ads",
    });
  }
};



/* ================================
   🌍 GET ALL ADS
================================ */
export const getAllAds = async (req, res) => {
  try {
    let {
      q = "",
      location = "",
      category = "",
      subcategory = "",
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    q = String(q || "").trim();
    location = String(location || "").trim();
    category = String(category || "").trim();
    subcategory = String(subcategory || "").trim();

    const normalizedPage = Math.max(parseInt(page, 10) || 1, 1);
    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 80);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const filters = { status: "Approved", ownerUid:{ $in:await activeMerchantUids() } };

    if (location) {
      const safeLocation = escapeRegex(location);
      filters.$or = [
        { city: { $regex: safeLocation, $options: "i" } },
        { location: { $regex: safeLocation, $options: "i" } },
        { state: { $regex: safeLocation, $options: "i" } },
      ];
    }

    if (category) {
      filters.category = {
        $regex: `^${escapeRegex(category)}$`,
        $options: "i",
      };
    }

    if (subcategory) {
      filters.subcategory = {
        $regex: `^${escapeRegex(subcategory)}$`,
        $options: "i",
      };
    }

    if (q) {
      const safeQuery = escapeRegex(q);
      const searchFilters = [
        { title: { $regex: safeQuery, $options: "i" } },
        { description: { $regex: safeQuery, $options: "i" } },
        { category: { $regex: safeQuery, $options: "i" } },
        { subcategory: { $regex: safeQuery, $options: "i" } },
        { tags: { $regex: safeQuery, $options: "i" } },
      ];
      if (filters.$or) {
        filters.$and = [{ $or: filters.$or }, { $or: searchFilters }];
        delete filters.$or;
      } else {
        filters.$or = searchFilters;
      }
    }

    const sortMap = {
      newest: { featured: -1, createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
      popular: { views: -1, favouritesCount: -1, createdAt: -1 },
    };
    const sortBy = sortMap[String(sort || "").toLowerCase()] || sortMap.newest;

    const [ads, total] = await Promise.all([
      Ad.find(filters)
        .sort(sortBy)
        .skip(skip)
        .limit(normalizedLimit)
        .select(
          "title description price currency images category subcategory " +
            "city location state ownerUid ownerName status views favouritesCount negotiable featured createdAt " +
            "condition brand model storage year mileage fuelType warranty " +
            "partName partCategory originalType workingStatus accessoryType vehicleType accessoryCondition " +
            "bedrooms bathrooms area furnishing floorNumber totalFloors parking washroom roomType plotArea plotType facing " +
            "salary experience company quantity seedType variety fertilizerType form pesticideType targetCrop toolName powerType serviceType availability serviceArea sportType weight " +
            "size color type age breed gender fileType accessType"
        ),
      Ad.countDocuments(filters),
    ]);

    const pages = Math.max(1, Math.ceil(total / normalizedLimit));
    res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      pages,
      totalPages: pages,
      hasMore: normalizedPage < pages,
      ads,
    });
  } catch (err) {
    console.error("ADS FETCH ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
};


/* ================================
   ✏️ UPDATE AD
================================ */
export const updateAd = async (req, res) => {
  try {
    const updates = stripProtectedAdFields({ ...req.body });
    const MAX_IMAGES = 5;
    const existingAd = await Ad.findById(req.params.id);
    if (!existingAd) {
      return res.status(404).json({ message: "Ad not found" });
    }

    if (existingAd.reservedOrderId) return res.status(409).json({ message:"This listing has a reserved purchase. Manage it in Sales Orders before editing." });
    if (Object.prototype.hasOwnProperty.call(updates, "condition")) {
      const normalizedCondition = normalizeConditionInput(updates.condition);
      if (!normalizedCondition.ok) {
        return res.status(400).json({
          success: false,
          message: normalizedCondition.message,
        });
      }
      if (normalizedCondition.value) {
        updates.condition = normalizedCondition.value;
      } else {
        delete updates.condition;
      }
    }

    // 🖼️ Update images (local upload + sharp optimize)
    const imageFiles = req.files?.images || [];
    const imagePaths = [];
    for (const file of imageFiles) {
      try {
        const optimizedPath = await optimizeImageFile(file.path, file.mimetype);
        if (optimizedPath !== file.path) {
          file.path = optimizedPath;
          file.filename = optimizedPath.split(/[/\\]/).pop();
        }
        imagePaths.push(toPublicUrl(req, publicPathFromFile(file)));
      } catch (imgErr) {
        await fs.unlink(file.path).catch(() => {});
        return res.status(400).json({
          success: false,
          message: "Image optimization failed. Please upload a valid image.",
        });
      }
    }

    const keptImages = parseArrayField(updates.images);

    // Combine kept images + newly uploaded images
    const combinedImages = [...keptImages, ...imagePaths];

    if (combinedImages.length > MAX_IMAGES) {
      return res.status(400).json({
        success: false,
        message: `You can upload up to ${MAX_IMAGES} images in total.`,
      });
    }

    if (combinedImages.length > 0) {
      updates.images = combinedImages;
    } else {
      // If client explicitly sent empty images array, allow clearing images
      if (
        (Array.isArray(updates.images) && updates.images.length === 0) ||
        updates.images === "[]"
      ) {
        updates.images = [];
      } else {
        delete updates.images;
      }
    }

    /* ==================================================
       🔁 AUTO TAG UPDATE (IF TITLE / CATEGORY / SUBCATEGORY CHANGED)
    ================================================== */
    const updatedTags = new Set();

    // from title
    if (updates.title) {
      updates.title
        .toLowerCase()
        .split(" ")
        .forEach((word) => {
          if (word.length > 2) updatedTags.add(word);
        });
    }

    // from category & subcategory
    if (updates.category) updatedTags.add(updates.category.toLowerCase());
    if (updates.subcategory)
      updatedTags.add(updates.subcategory.toLowerCase());

    // preserve manual tags if any
    if (Array.isArray(updates.tags)) {
      updates.tags.forEach((t) => updatedTags.add(t.toLowerCase()));
    }

    if (updatedTags.size > 0) {
      updates.tags = Array.from(updatedTags);
    }

    // 🎥 Replace video if uploaded
    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];
      const publicPath = publicPathFromFile(videoFile);

      updates.video = {
        url: toPublicUrl(req, publicPath),
        thumbnail: "",
        duration: 0,
        size: videoFile.size || 0,
        format: "mp4",
        publicId: "",
      };

      if (isLocalUploadUrl(existingAd.video?.url)) {
        const oldVideoPath = localAbsolutePathFromUrl(existingAd.video.url);
        if (oldVideoPath) await fs.unlink(oldVideoPath).catch(() => {});
      }
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.status(200).json({
      message: "Ad updated successfully",
      ad: updatedAd,
    });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* ================================
   ❌ DELETE AD
================================ */
export const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    const session = await mongoose.startSession();
    try { await session.withTransaction(async () => {
      const removed = await Ad.findOneAndUpdate({_id:ad._id,reservedOrderId:null},{ $set:{status:"deleted",deletedAt:new Date(),deletedBy:req.user.uid,featured:false,boostSubscriptionId:null,boostPaymentId:null,boostStartDate:null,boostEndDate:null} },{session});
      if(!removed)throw Object.assign(new Error("Cancel or complete the reserved purchase before deleting."),{statusCode:409});
      await expireActiveAdBoostForSale({adId:ad._id,ownerUid:ad.ownerUid,session});
    }); } finally { await session.endSession(); }
    // Best-effort local file cleanup for local uploads only.
    if (Array.isArray(ad.images)) {
      for (const imgUrl of ad.images) {
        if (isLocalUploadUrl(imgUrl)) {
          const localPath = localAbsolutePathFromUrl(imgUrl);
          if (localPath) {
            const dir = path.dirname(localPath);
            const file = path.basename(localPath);
            const mediumPath = path.join(dir, "medium", file);
            const thumbPath = path.join(dir, "thumb", file);

            await fs.unlink(localPath).catch(() => {});
            await fs.unlink(mediumPath).catch(() => {});
            await fs.unlink(thumbPath).catch(() => {});
          }
        }
      }
    }
    if (ad.video?.url && isLocalUploadUrl(ad.video.url)) {
      const localVideoPath = localAbsolutePathFromUrl(ad.video.url);
      if (localVideoPath) await fs.unlink(localVideoPath).catch(() => {});
    }

    // Soft deletion retains listing references for historical orders.
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   💰 MARK AS SOLD
================================ */
export const markAsSold = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (ad.reservedOrderId) return res.status(409).json({ message: "Complete or cancel the reserved purchase in Sales Orders first." });
    const session = await mongoose.startSession();
    try { await session.withTransaction(async () => {
      const sold = await Ad.findOneAndUpdate({ _id:ad._id, reservedOrderId:null }, { $set:{ status:"Sold", featured:false, boostSubscriptionId:null, boostPaymentId:null, boostStartDate:null, boostEndDate:null } }, { session });
      if (!sold) throw Object.assign(new Error("This listing has a reserved purchase."), { statusCode:409 });
      await expireActiveAdBoostForSale({ adId:ad._id, ownerUid:ad.ownerUid, session });
    }); } finally { await session.endSession(); }
    ad.status = "Sold"; ad.featured = false;

    res.status(200).json({ message: "Ad marked as sold", ad });
  } catch (error) {
    console.error("Error marking ad as sold:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   ⭐ ENABLE FEATURED AD
================================ */
export const enableFeaturedAd = async (req, res) => {
  try {
    const ad = req.ad;
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    if (ad.status !== "Approved") return res.status(409).json({ message: "Only approved listings can be featured." });

    const activeBoost = await Subscription.findOne({
      adId: ad._id,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      endDate: { $gt: new Date() },
    }).populate("planId").populate("paymentId");

    if (!activeBoost) {
      return res.status(409).json({
        success: false,
        message: "This advert does not have an active paid boost. Choose a boost plan and complete payment first.",
      });
    }

    ad.featured = true;
    ad.boostSubscriptionId = activeBoost._id;
    ad.boostPaymentId = activeBoost.paymentId?._id || activeBoost.paymentId || null;
    ad.boostStartDate = activeBoost.startDate || activeBoost.activatedAt || new Date();
    ad.boostEndDate = activeBoost.endDate;
    await ad.save();

    return res.status(200).json({ success: true, message: "Ad boost activated", ad, subscription: activeBoost });
  } catch (error) {
    console.error("Error enabling featured ad:", error);
    return res.status(500).json({ success: false, message: "Server error while enabling featured ad", error: error.message });
  }
};

/* ================================
   ⭐ DISABLE FEATURED AD
================================ */
export const disableFeaturedAd = async (req, res) => {
  try {
    const ad = req.ad;
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    if (!ad.featured) {
      return res.status(200).json({
        success: true,
        message: "Ad is already not featured",
        ad,
      });
    }

    ad.featured = false;
    await ad.save();

    return res.status(200).json({
      success: true,
      message: "Ad removed from featured listings",
      ad,
    });
  } catch (error) {
    console.error("Error disabling featured ad:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while disabling featured ad",
      error: error.message,
    });
  }
};

/* ================================
   👁️ INCREMENT AD VIEW COUNT
================================ */
export const incrementView = async (req, res) => {
  try {
    const { userId, guestId } = req.body;
    const uniqueViewer = userId || guestId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Ad ID" });
    }

    const ad = await Ad.findById(id).select("ownerUid views viewedBy");
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (userId && ad.ownerUid === userId) {
      return res.json({ message: "Owner viewed — no increment" });
    }

    if (uniqueViewer) {
      const updatedAd = await Ad.findOneAndUpdate(
        { _id: id, viewedBy: { $ne: uniqueViewer } },
        {
          $inc: { views: 1 },
          $addToSet: { viewedBy: uniqueViewer },
        },
        {
          new: true,
          projection: { views: 1 },
        }
      );

      if (!updatedAd) {
        const currentAd = await Ad.findById(id).select("views");
        return res.json({
          message: "Already viewed",
          views: currentAd?.views ?? ad.views ?? 0,
        });
      }

      return res.json({
        message: "View incremented",
        views: updatedAd.views,
      });
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      {
        new: true,
        projection: { views: 1 },
      }
    );

    return res.json({
      message: "View incremented",
      views: updatedAd?.views ?? (ad.views || 0) + 1,
    });
  } catch (error) {
    console.error("❌ Error updating view count:", error);
    res.status(500).json({
      message: "Server error while updating view count",
      error: error.message,
    });
  }
};

/* ================================
   ⚙️ CHANGE AD STATUS
================================ */
export const changeAdStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Active", "Hidden", "Expired", "Sold"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    ad.status = status;
    await ad.save();

    res.status(200).json({ message: `Ad status changed to ${status}`, ad });
  } catch (error) {
    console.error("Error changing ad status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   🟣 GET SINGLE AD BY ID (WITH SELLER)
================================ */
export const getAdById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid advert ID" });
    }

    // Public listing pages must never expose pending/rejected/moderated adverts.
    const ad = await Ad.findOne({
      _id: req.params.id,
      status: { $in: ["Approved", "Sold"] },
    });
    if (!ad) return res.status(404).json({ message: "Advert not found" });
    await assertMerchantUid(ad.ownerUid);

    const seller = await User.findOne({ uid: ad.ownerUid }).select(
      "name phone photoURL city location verified createdAt"
    );

    res.status(200).json({
      ...ad.toObject(),
      canPurchase:isPurchasable(ad) && !ad.reservedOrderId,
      seller: seller || null,
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Server error" });
  }
};

/* ================================
   ❤️ FAVORITES COUNT
================================ */
export const updateFavoriteCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (action === "add") ad.favouritesCount = (ad.favouritesCount || 0) + 1;
    if (action === "remove" && ad.favouritesCount > 0)
      ad.favouritesCount -= 1;

    await ad.save();
    res.status(200).json({
      message: "Favorites updated",
      favouritesCount: ad.favouritesCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   🔎 SEARCH ADS
================================ */
export const searchAds = async (req, res) => {
  try {
    let { query = "", location = "", page = 1, limit = 20 } = req.query;
    query = String(query || "").trim();
    location = String(location || "").trim();
    const normalizedPage = Math.max(parseInt(page, 10) || 1, 1);
    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const filters = { status: "Approved", ownerUid:{ $in:await activeMerchantUids() } };
    if (query) {
      const safeQuery = escapeRegex(query);
      filters.$or = [
        { title: { $regex: safeQuery, $options: "i" } },
        { description: { $regex: safeQuery, $options: "i" } },
        { category: { $regex: safeQuery, $options: "i" } },
        { subcategory: { $regex: safeQuery, $options: "i" } },
        { tags: { $regex: safeQuery, $options: "i" } },
      ];
    }

    if (location && location !== "All Malawi") {
      const safeLocation = escapeRegex(location);
      filters.$and = [
        ...(filters.$and || []),
        {
          $or: [
            { city: { $regex: safeLocation, $options: "i" } },
            { location: { $regex: safeLocation, $options: "i" } },
            { state: { $regex: safeLocation, $options: "i" } },
          ],
        },
      ];
    }

    const [ads, total] = await Promise.all([
      Ad.find(filters)
        .sort({ featured: -1, createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit),
      Ad.countDocuments(filters),
    ]);

    res.json({
      success: true,
      ads,
      total,
      page: normalizedPage,
      totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search is temporarily unavailable." });
  }
};
