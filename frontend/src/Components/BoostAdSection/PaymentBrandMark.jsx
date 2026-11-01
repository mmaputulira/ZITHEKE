import React from "react";

const SIZE_CLASSES = {
  card: "h-36 w-full rounded-[1.55rem]",
  panel: "h-24 w-full rounded-[1.35rem] sm:w-[15rem]",
  modal: "h-24 w-full rounded-[1.35rem]",
};

const IMAGE_CLASSES = {
  card: {
    square: "h-28 w-28 rounded-[1.45rem]",
    wide: "max-h-[5.4rem] w-[min(82%,15rem)]",
  },
  panel: {
    square: "h-20 w-20 rounded-[1.15rem]",
    wide: "max-h-[4.3rem] w-[min(82%,13rem)]",
  },
  modal: {
    square: "h-20 w-20 rounded-[1.15rem]",
    wide: "max-h-[4.3rem] w-[min(82%,13rem)]",
  },
};

const PaymentBrandMark = ({
  src,
  alt,
  variant = "wide",
  size = "card",
  selected = false,
  className = "",
}) => {
  const stageClass = SIZE_CLASSES[size] || SIZE_CLASSES.card;
  const imageClass = IMAGE_CLASSES[size]?.[variant] || IMAGE_CLASSES.card.wide;

  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden border bg-white ${stageClass} ${
        selected
          ? "border-[#2E3192]/25 shadow-[0_18px_44px_-30px_rgba(46,49,146,0.45)]"
          : "border-[#E6EAFF] shadow-[0_14px_36px_-32px_rgba(15,23,42,0.32)]"
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,49,146,0.075),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(244,180,0,0.07),_transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2E3192]/10 to-transparent" />
      <img
        src={src}
        alt={alt}
        className={`relative z-10 object-contain drop-shadow-[0_7px_15px_rgba(15,23,42,0.08)] ${imageClass}`}
      />
    </div>
  );
};

export default PaymentBrandMark;
