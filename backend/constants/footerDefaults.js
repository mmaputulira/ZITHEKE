// What the footer showed before it became editable. Used until an admin saves changes.
export const FOOTER_DEFAULTS = Object.freeze({
  about:
    "Your trusted marketplace to buy, sell, and connect locally with people around you. Safe, simple, and smart.",
  social: { facebook: "", twitter: "", instagram: "" },
  quickLinks: [
    { label: "About Us", url: "/about" },
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Terms & Conditions", url: "/terms" },
    { label: "Contact Support", url: "/contact" },
  ],
  popularCategories: [
    { label: "Mobiles & Tablets", url: "/category/Mobiles" },
    { label: "Electronics", url: "/category/Electronics" },
    { label: "Vehicles", url: "/category/Vehicles" },
    { label: "Furniture", url: "/category/Furniture" },
  ],
  contact: {
    address: "Lilongwe, Malawi",
    email: "support@zitheke.com",
    phone: "+265 980634536",
  },
});
