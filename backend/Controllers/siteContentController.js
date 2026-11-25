import SiteContent from "../models/SiteContent.js";
import { FOOTER_DEFAULTS } from "../constants/footerDefaults.js";

const MAX_LINKS = 12;
const text = (value, max) => String(value ?? "").trim().slice(0, max);

// Links may point inside Zitheke ("/about") or to a full web address.
const cleanUrl = (value) => {
  const url = text(value, 300);
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https?:\/\/[^\s]+$/i.test(url)) return url;
  if (/^(mailto|tel):[^\s]+$/i.test(url)) return url;
  return null;
};

const cleanLinks = (rows, field) => {
  if (!Array.isArray(rows)) return { error: `${field} must be a list of links.` };
  if (rows.length > MAX_LINKS) return { error: `${field} can have at most ${MAX_LINKS} links.` };
  const links = [];
  for (const [index, row] of rows.entries()) {
    const label = text(row?.label, 60);
    const url = cleanUrl(row?.url);
    if (!label && !row?.url) continue;
    if (!label) return { error: `${field}: link ${index + 1} needs a name.` };
    if (!url) return { error: `${field}: "${label}" needs a web address starting with / or https://.` };
    links.push({ label, url });
  }
  return { links };
};

export const normalizeFooter = (input = {}) => {
  const quick = cleanLinks(input.quickLinks ?? FOOTER_DEFAULTS.quickLinks, "Quick links");
  if (quick.error) return { error: quick.error };
  const popular = cleanLinks(input.popularCategories ?? FOOTER_DEFAULTS.popularCategories, "Popular categories");
  if (popular.error) return { error: popular.error };

  const social = {};
  for (const network of ["facebook", "twitter", "instagram"]) {
    const raw = input.social?.[network];
    if (!raw) { social[network] = ""; continue; }
    const url = cleanUrl(raw);
    if (!url || !/^https?:\/\//i.test(url)) return { error: `The ${network} link must be a full web address starting with https://.` };
    social[network] = url;
  }

  const email = text(input.contact?.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid contact email address." };

  return {
    footer: {
      about: text(input.about ?? FOOTER_DEFAULTS.about, 400),
      social,
      quickLinks: quick.links,
      popularCategories: popular.links,
      contact: {
        address: text(input.contact?.address, 160),
        email,
        phone: text(input.contact?.phone, 40),
      },
    },
  };
};

const readFooter = async () => {
  const row = await SiteContent.findOne({ key: "footer" }).lean();
  return { footer: { ...FOOTER_DEFAULTS, ...(row?.data || {}) }, updatedAt: row?.updatedAt || null, updatedBy: row?.updatedBy || "" };
};

export const getPublicFooter = async (req, res) => {
  try {
    const { footer } = await readFooter();
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ success: true, footer });
  } catch (error) {
    console.error("getPublicFooter", error);
    return res.json({ success: true, footer: FOOTER_DEFAULTS });
  }
};

export const getAdminFooter = async (req, res) => {
  try {
    return res.json({ success: true, ...(await readFooter()), defaults: FOOTER_DEFAULTS });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load the footer." });
  }
};

export const updateAdminFooter = async (req, res) => {
  try {
    const { footer, error } = normalizeFooter(req.body?.footer || req.body || {});
    if (error) return res.status(400).json({ success: false, message: error });
    const row = await SiteContent.findOneAndUpdate(
      { key: "footer" },
      { $set: { data: footer, updatedBy: req.admin?.email || "" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json({ success: true, footer: row.data, updatedAt: row.updatedAt, updatedBy: row.updatedBy, message: "Footer saved. The website shows the changes within a minute." });
  } catch (error) {
    console.error("updateAdminFooter", error);
    return res.status(500).json({ success: false, message: "Unable to save the footer." });
  }
};
