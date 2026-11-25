import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import api from "../../api/axios";

// Shown while loading, and if the server can't be reached.
const DEFAULT_FOOTER = {
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
  contact: { address: "Lilongwe, Malawi", email: "support@zitheke.com", phone: "+265 980634536" },
};

let cachedFooter = null;

const FooterLink = ({ link }) => {
  const external = /^https?:\/\//i.test(link.url);
  return (
    <a
      href={link.url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="cursor-pointer hover:text-[#2E3192]"
    >
      {link.label}
    </a>
  );
};

const Footer = () => {
  const [footer, setFooter] = useState(cachedFooter || DEFAULT_FOOTER);

  useEffect(() => {
    if (cachedFooter) return undefined;
    let alive = true;
    api
      .get("/site/footer")
      .then(({ data }) => {
        if (!data?.footer) return;
        cachedFooter = { ...DEFAULT_FOOTER, ...data.footer };
        if (alive) setFooter(cachedFooter);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const socials = [
    { key: "facebook", Icon: Facebook, label: "Facebook" },
    { key: "twitter", Icon: Twitter, label: "Twitter" },
    { key: "instagram", Icon: Instagram, label: "Instagram" },
  ].filter(({ key }) => footer.social?.[key]);

  return (
    <footer className="relative bg-gradient-to-br from-[#ffffff] via-[#F8FAFC] to-[#F2F4FF] text-[#2E3192] pt-16 pb-8 overflow-hidden font-[Poppins]">
      {/* Floating background glows */}
      <div className="absolute -top-20 left-0 w-72 h-72 bg-[#F9B233]/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#2E3192]/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* 1️⃣ Brand Info */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-3">Zitheke</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {footer.about}
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-4">
                {socials.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={footer.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="p-2 bg-[#2E3192]/10 rounded-full hover:bg-[#2E3192]/20"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* 2️⃣ Quick Links */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              {(footer.quickLinks || []).map((link) => (
                <li key={`${link.label}-${link.url}`}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 3️⃣ Popular Categories */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="font-semibold text-lg mb-3">Popular Categories</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              {(footer.popularCategories || []).map((link) => (
                <li key={`${link.label}-${link.url}`}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 4️⃣ Contact */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9 }}
          >
            <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
            <ul className="space-y-3 text-gray-600 text-sm">
              {footer.contact?.address && (
                <li className="flex gap-2">
                  <MapPin size={16} className="shrink-0 mt-0.5" /> {footer.contact.address}
                </li>
              )}
              {footer.contact?.email && (
                <li className="flex gap-2">
                  <Mail size={16} className="shrink-0 mt-0.5" />
                  <a href={`mailto:${footer.contact.email}`} className="hover:text-[#2E3192] break-all">{footer.contact.email}</a>
                </li>
              )}
              {footer.contact?.phone && (
                <li className="flex gap-2">
                  <Phone size={16} className="shrink-0 mt-0.5" />
                  <a href={`tel:${footer.contact.phone.replace(/\s+/g, "")}`} className="hover:text-[#2E3192]">{footer.contact.phone}</a>
                </li>
              )}
            </ul>
          </motion.div>
        </div>

        <div className="border-t border-[#2E3192]/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Zitheke Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            <span>Powered by</span>
            <span className="relative block w-36 sm:w-44 overflow-hidden rounded-lg bg-white" style={{aspectRatio:"2.516"}}><img src="/branding/restock-tech-official.png" alt="Restock Tech" className="absolute max-w-none" style={{width:"126.18%",left:"-13.88%",top:"-100.8%"}} /></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


