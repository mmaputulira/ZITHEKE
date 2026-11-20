import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, Store } from "lucide-react";
import { getUserAvatarSrc } from "../../utils/avatar.js";

/* =========================================================
   Animated role characters for the Customer / Seller choice.
   Original flat illustrations drawn in SVG, animated with
   framer-motion. They idle gently and get livelier when the
   card is hovered or selected. Motion is switched off for
   people who ask their device for reduced motion.
========================================================= */

const SKIN = "#9A5B34";
const SKIN_SHADE = "#83492A";
const HAIR = "#1F1A2E";
const NAVY = "#2E3192";
const NAVY_DARK = "#1F2370";
const GOLD = "#F4B400";

const loop = (duration, extra = {}) => ({ duration, repeat: Infinity, ease: "easeInOut", ...extra });

// Eyes that blink every few seconds.
function Eyes({ cx = 60, cy = 47, still }) {
  return (
    <motion.g
      style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
      animate={still ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
      transition={loop(4.2, { times: [0, 0.9, 0.93, 0.96, 1], ease: "linear" })}
    >
      <circle cx={cx - 6} cy={cy} r="2.1" fill={HAIR} />
      <circle cx={cx + 6} cy={cy} r="2.1" fill={HAIR} />
    </motion.g>
  );
}

function Head({ still, happy }) {
  return (
    <g>
      <rect x="55" y="56" width="10" height="9" rx="3" fill={SKIN_SHADE} />
      <circle cx="60" cy="45" r="15" fill={SKIN} />
      <path d="M45 44c0-11 7-17 15-17s15 6 15 17c-3-6-8-9-15-9s-12 3-15 9z" fill={HAIR} />
      <Eyes still={still} />
      <path
        d={happy ? "M53.5 52.5c3.5 4 9.5 4 13 0" : "M54.5 53c3 2.6 8 2.6 11 0"}
        stroke={HAIR}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="49.5" cy="50" r="2.4" fill="#E9806E" opacity="0.45" />
      <circle cx="70.5" cy="50" r="2.4" fill="#E9806E" opacity="0.45" />
    </g>
  );
}

export function CustomerCharacter({ size = 96, active = false, hovered = false }) {
  const reduce = useReducedMotion();
  const lively = active || hovered;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Customer"
      animate={reduce ? undefined : { y: lively ? [0, -4, 0] : [0, -1.5, 0] }}
      transition={loop(lively ? 1.1 : 2.8)}
    >
      <defs>
        <linearGradient id="zc-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8EAFF" />
          <stop offset="1" stopColor="#C9CEFF" />
        </linearGradient>
        <clipPath id="zc-clip">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#zc-bg)" />
      {/* Floating hearts */}
      {!reduce &&
        [0, 1].map((i) => (
          <motion.path
            key={i}
            d="M0 3c0-2 2.5-3.5 4-1.5C5.5-.5 8 1 8 3c0 3-4 5.5-4 5.5S0 6 0 3z"
            fill={i ? GOLD : "#EF5A7A"}
            initial={{ x: i ? 84 : 26, y: 40, opacity: 0, scale: 0.6 }}
            animate={{ y: [40, 14], opacity: [0, 1, 0], scale: [0.6, 1.1, 0.9] }}
            transition={loop(2.6, { delay: i * 1.3, ease: "easeOut" })}
          />
        ))}
      {/* Body */}
      <g clipPath="url(#zc-clip)">
        <path d="M31 122c0-28 13-50 29-50s29 22 29 50z" fill={NAVY} />
      </g>
      <path d="M52 73l8 9 8-9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Arm holding the bag */}
      <path d="M80 82c6 6 8 12 8 18" stroke={NAVY_DARK} strokeWidth="8" strokeLinecap="round" fill="none" />
      <motion.g
        style={{ transformOrigin: "88px 98px", transformBox: "view-box" }}
        animate={reduce ? undefined : { rotate: lively ? [-14, 12, -14] : [-6, 6, -6] }}
        transition={loop(lively ? 0.9 : 2.4)}
      >
        <path d="M82 104c0-6 3-9 6-9s6 3 6 9" stroke={GOLD} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <rect x="76" y="102" width="24" height="18" rx="4" fill={GOLD} />
        <rect x="76" y="102" width="24" height="4" rx="2" fill="#D99D00" />
        <path d="M84 111h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      <circle cx="88" cy="100" r="4" fill={SKIN} />
      <motion.g
        style={{ transformOrigin: "60px 58px", transformBox: "view-box" }}
        animate={reduce ? undefined : { rotate: lively ? [0, -5, 0, 4, 0] : [0, -2, 0] }}
        transition={loop(lively ? 1.6 : 3.4)}
      >
        <Head still={reduce} happy={lively} />
      </motion.g>
    </motion.svg>
  );
}

export function SellerCharacter({ size = 96, active = false, hovered = false }) {
  const reduce = useReducedMotion();
  const lively = active || hovered;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Seller"
      animate={reduce ? undefined : { y: lively ? [0, -4, 0] : [0, -1.5, 0] }}
      transition={loop(lively ? 1.1 : 2.8)}
    >
      <defs>
        <linearGradient id="zs-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4D1" />
          <stop offset="1" stopColor="#FFE08A" />
        </linearGradient>
        <clipPath id="zs-clip">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#zs-bg)" />
      <g clipPath="url(#zs-clip)">
        {/* Shop awning that ripples */}
        <motion.g
          style={{ transformOrigin: "60px 14px", transformBox: "view-box" }}
          animate={reduce ? undefined : { scaleY: lively ? [1, 1.12, 1] : [1, 1.04, 1] }}
          transition={loop(lively ? 0.8 : 2.2)}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <path
              key={i}
              d={`M${8 + i * 15} 4h15v18c0 4-3.4 7-7.5 7S${8 + i * 15} 26 ${8 + i * 15} 22z`}
              fill={i % 2 ? "#FFFFFF" : NAVY}
              stroke={NAVY}
              strokeWidth="1.2"
            />
          ))}
        </motion.g>
      </g>
      {/* Coin that pops up */}
      {!reduce && (
        <motion.g
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [38, 22, 38], opacity: [0, 1, 0], rotateY: [0, 180, 360] }}
          transition={loop(lively ? 1.4 : 2.8, { ease: "easeOut" })}
          style={{ transformOrigin: "24px 0px", transformBox: "view-box" }}
        >
          <circle cx="24" cy="0" r="7" fill={GOLD} stroke="#D99D00" strokeWidth="1.5" />
          <text x="24" y="3" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8A6300">K</text>
        </motion.g>
      )}
      {/* Body with apron */}
      <g clipPath="url(#zs-clip)">
        <path d="M31 122c0-28 13-50 29-50s29 22 29 50z" fill="#3F8E7E" />
        <path d="M46 84h28v40H46z" fill={GOLD} />
      </g>
      <path d="M48 84c0-5 5-8 12-8s12 3 12 8" stroke={GOLD} strokeWidth="3" fill="none" />
      <path d="M53 97h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      {/* Waving arm */}
      <motion.g
        style={{ transformOrigin: "36px 86px", transformBox: "view-box" }}
        animate={reduce ? undefined : { rotate: lively ? [0, -28, 0, -28, 0] : [0, -10, 0] }}
        transition={loop(lively ? 1.2 : 3)}
      >
        <path d="M37 86c-7-4-10-12-10-20" stroke="#2F7364" strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="27" cy="63" r="4.5" fill={SKIN} />
      </motion.g>
      {/* Swinging price tag */}
      <motion.g
        style={{ transformOrigin: "86px 84px", transformBox: "view-box" }}
        animate={reduce ? undefined : { rotate: lively ? [-16, 14, -16] : [-6, 6, -6] }}
        transition={loop(lively ? 0.9 : 2.4)}
      >
        <path d="M86 84v6" stroke={HAIR} strokeWidth="1.5" />
        <path d="M78 90h16l4 6-4 6H78z" fill="#EF5A7A" />
        <circle cx="94" cy="96" r="1.6" fill="#fff" />
        <path d="M81 96h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "60px 58px", transformBox: "view-box" }}
        animate={reduce ? undefined : { rotate: lively ? [0, 4, 0, -4, 0] : [0, 2, 0] }}
        transition={loop(lively ? 1.6 : 3.4)}
      >
        <Head still={reduce} happy={lively} />
      </motion.g>
    </motion.svg>
  );
}

export const RoleCharacter = ({ role, ...props }) =>
  role === "seller" ? <SellerCharacter {...props} /> : <CustomerCharacter {...props} />;

const initialsOf = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "Z";

/**
 * The person's own avatar with an animated gradient ring and a small badge
 * showing whether they are using Zitheke as a Customer or a Seller.
 */
export function LiveAvatar({ user, mode = "buyer", size = 56, showBadge = true, className = "" }) {
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState(false);
  const src = getUserAvatarSrc(user, "");
  const ring = mode === "seller"
    ? "conic-gradient(from 0deg, #F4B400, #FF8A3D, #3F8E7E, #F4B400)"
    : "conic-gradient(from 0deg, #2E3192, #6C72FF, #F4B400, #2E3192)";
  const badge = Math.max(16, Math.round(size * 0.36));

  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ background: ring }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <span className="absolute inset-[2.5px] overflow-hidden rounded-full bg-white p-[2px]">
        {src && !broken ? (
          <img src={src} alt="" onError={() => setBroken(true)} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
            style={{
              fontSize: size * 0.34,
              background: "linear-gradient(135deg, #2E3192 0%, #5B61E0 60%, #8B90FF 100%)",
            }}
          >
            {initialsOf(user?.name)}
          </span>
        )}
      </span>
      {showBadge && (
        <motion.span
          key={mode}
          initial={reduce ? false : { scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 16 }}
          className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full ring-2 ring-white shadow ${
            mode === "seller" ? "bg-[#F4B400] text-[#1A1D64]" : "bg-[#2E3192] text-white"
          }`}
          style={{ width: badge, height: badge }}
          title={mode === "seller" ? "Using Zitheke as a seller" : "Using Zitheke as a customer"}
        >
          {mode === "seller" ? <Store size={badge * 0.58} /> : <ShoppingBag size={badge * 0.58} />}
        </motion.span>
      )}
    </span>
  );
}
