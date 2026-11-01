import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Check, Star, Crown, Rocket } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { listMembershipPlans } from "../../services/membership.service.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useMembershipAccess from "../../hooks/useMembershipAccess.js";

const getDisplayPlanPrice = (plan) => {
  const price = Number(plan?.price || 0);
  if (price === 0) return "FREE";
  return `MWK ${price.toLocaleString("en-MW")}`;
};

const getPlanSubline = (plan) => {
  const durationDays = Number(plan?.durationDays || 0);
  if (durationDays <= 0) return "Always available by default";
  if (durationDays % 7 === 0) {
    const weeks = durationDays / 7;
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  return `${durationDays} days`;
};

const ACCOUNT_FEATURES = {
  free: ["Standard marketplace access", "Post and manage normal listings", "Use My Marketplace dashboard", "Upgrade whenever you are ready"],
  basic: ["Account-level seller plan", "7-day membership period", "Seller plan status on My Marketplace", "Works independently from advert boosts"],
  essentials: ["Account-level seller plan", "14-day membership period", "Seller plan status on My Marketplace", "Keep boosting selected adverts separately"],
  plus: ["Account-level seller plan", "21-day membership period", "Seller plan status on My Marketplace", "Designed for active marketplace sellers"],
  advanced: ["Account-level seller plan", "28-day membership period", "Highest seller membership tier", "Advert boosts remain separately selectable"],
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const adId = params.get("adId") || "";
  const requestedMode = params.get("mode") || "";
  const mode = requestedMode === "account" ? "account" : "boost";
  const isAccountMode = mode === "account";
  const { user } = useAuth();
  const { access } = useMembershipAccess();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const result = await listMembershipPlans();
        if (!mounted) return;
        setPlans(result);
        setPlansError("");
      } catch (err) {
        if (!mounted) return;
        setPlans([]);
        setPlansError(err?.response?.data?.message || err?.message || "Failed to load pricing plans.");
      } finally {
        if (mounted) setPlansLoading(false);
      }
    };
    fetchPlans();
    return () => { mounted = false; };
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a?.priorityLevel || 0) - Number(b?.priorityLevel || 0)),
    [plans]
  );

  const handleSelectPlan = (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const slug = String(plan?.slug || "").trim();
    if (!slug || slug === "free") return;

    if (isAccountMode) {
      navigate(`/checkout?mode=account&plan=${encodeURIComponent(slug)}`);
      return;
    }

    if (!adId) {
      navigate("/dashboard/my-ads");
      return;
    }
    navigate(`/checkout?mode=boost&plan=${encodeURIComponent(slug)}&adId=${encodeURIComponent(adId)}`);
  };

  const currentPlanSlug = String(access?.plan?.slug || "free").toLowerCase();
  const hasActiveMembership = Boolean(access?.hasActiveSubscription && access?.isPremium);
  const visiblePlans = isAccountMode
    ? sortedPlans
    : sortedPlans.filter((plan) => String(plan?.slug || "").toLowerCase() !== "free");

  return (
    <section className="relative min-h-screen overflow-hidden bg-white px-6 py-24">
      <div className="absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#2E3192]/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#F9B233]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-10 flex max-w-xl rounded-full border border-[#DFE5FF] bg-[#F7F8FF] p-1.5 shadow-sm">
          <button type="button" onClick={() => navigate("/pricing?mode=account")} className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${isAccountMode ? "bg-[#2E3192] text-white shadow" : "text-[#2E3192]"}`}>
            Seller Subscription
          </button>
          <button type="button" onClick={() => navigate(adId ? `/pricing?mode=boost&adId=${encodeURIComponent(adId)}` : "/dashboard/my-ads")} className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${!isAccountMode ? "bg-[#2E3192] text-white shadow" : "text-[#2E3192]"}`}>
            Boost an Advert
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16 text-center">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2E3192]">
            {isAccountMode ? <Crown size={15} /> : <Rocket size={15} />}
            {isAccountMode ? "Seller Account Plans" : "Advert Promotion"}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#2E3192] md:text-5xl">
            {isAccountMode ? "Upgrade your seller account" : "Choose a boost plan for this advert"}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-500">
            {isAccountMode
              ? "Your seller subscription applies to your Zitheke account. It does not automatically boost every advert, so you remain free to promote individual listings separately."
              : "The plan you choose here applies only to the selected product or service listing. Your seller account plan remains separate."}
          </p>
          {!isAccountMode && !adId ? (
            <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Start from <strong>My Ads → Boost Ad</strong> so Zitheke can link the payment to the correct listing.
            </div>
          ) : null}
          {isAccountMode && hasActiveMembership ? (
            <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Your current seller plan is <strong>{access?.plan?.name}</strong>. You can review the available tiers below; a new paid plan can be selected after the current one expires.
            </div>
          ) : null}
        </motion.div>

        {plansLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[30rem] animate-pulse rounded-3xl border border-[#dbe2ff] bg-white shadow-md" />)}
          </div>
        ) : plansError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700">{plansError}</div>
        ) : (
          <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${isAccountMode ? "lg:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-4"}`}>
            {visiblePlans.map((plan) => {
              const slug = String(plan?.slug || "").toLowerCase();
              const isPopular = slug === "plus";
              const isCurrent = isAccountMode && slug === currentPlanSlug;
              const features = isAccountMode ? ACCOUNT_FEATURES[slug] || [] : Array.isArray(plan.features) ? plan.features : [];

              return (
                <PriceCard
                  key={plan._id || slug}
                  title={plan.name}
                  price={getDisplayPlanPrice(plan)}
                  subline={getPlanSubline(plan)}
                  bestValue={isPopular ? "Best value" : ""}
                  features={features}
                  popular={isPopular}
                  current={isCurrent}
                  buttonLabel={isAccountMode ? "Choose seller plan" : "Choose boost plan"}
                  currentLabel="Current seller plan"
                  disabled={isAccountMode && (isCurrent || hasActiveMembership)}
                  helperText={isAccountMode ? "Account-level seller subscription. Advert boosts are purchased separately." : "This plan applies only to the advert you selected."}
                  onClick={() => handleSelectPlan(plan)}
                />
              );
            })}
          </div>
        )}

        <div className="mt-20 rounded-[28px] border border-[#E1E6FF] bg-[#F8F9FF] p-6 text-center md:p-8">
          <p className="font-semibold text-[#1A1D64]">
            Seller Subscription and Advert Boosting work side by side — one grows your account presence, the other promotes a specific listing.
          </p>
        </div>
      </div>
    </section>
  );
};

const PriceCard = ({ title, price, subline, features, bestValue, popular = false, current = false, buttonLabel, currentLabel, helperText, disabled = false, onClick }) => (
  <motion.div whileHover={{ y: disabled ? 0 : -8, scale: disabled ? 1 : popular ? 1.03 : 1.015 }} transition={{ type: "spring", stiffness: 220 }} className={`relative rounded-3xl border bg-white p-8 ${popular ? "border-[#93c5fd] shadow-lg" : "border-gray-200 shadow-md"}`} style={{ borderTopWidth: "5px", borderTopColor: popular ? "#F9B233" : "#2E3192" }}>
    {popular ? <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#FFF7E2] px-4 py-1 text-xs font-bold text-[#7A5600] shadow-sm ring-1 ring-[#F9B233]/30"><Star size={14} />Most Popular</div> : null}
    <h3 className="text-center text-xl font-bold text-[#2E3192]">{title}</h3>
    <div className="mt-4 text-center"><span className="text-3xl font-bold text-[#2E3192]">{price}</span><p className="mt-2 text-sm text-[#2E3192]/60">{subline}</p>{popular && bestValue ? <p className="mt-1 text-xs font-semibold text-[#8B6500]">{bestValue}</p> : null}</div>
    {current ? (
      <div className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 font-semibold text-emerald-700"><BadgeCheck size={16} />{currentLabel}</div>
    ) : (
      <button type="button" onClick={onClick} disabled={disabled} className="mt-6 w-full rounded-xl bg-[#2E3192] py-3 font-semibold text-white transition hover:bg-[#232780] disabled:cursor-not-allowed disabled:bg-slate-300">{disabled ? "Current plan active" : buttonLabel}</button>
    )}
    <div className="mt-6 space-y-2">{features.map((item, index) => <div key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-[#2E3192]/80"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF1FF]"><Check size={12} className="text-[#2E3192]" /></span><span>{item}</span></div>)}</div>
    {helperText ? <p className="mt-5 text-center text-xs leading-5 text-slate-400">{helperText}</p> : null}
  </motion.div>
);

export default PricingPage;
