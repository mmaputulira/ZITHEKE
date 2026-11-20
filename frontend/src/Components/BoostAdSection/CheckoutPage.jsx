import { formatAmount } from "../../utils/formatPrice.js";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Landmark,
  Loader2,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Crown,
  Rocket,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AirtelPaymentModal from "./AirtelPaymentModal.jsx";
import BankTransferPayment from "./BankTransferPayment.jsx";
import {
  createNepgPaymentIntent,
  createSubscriptionIntent,
  getAdForBoost,
  getPlanBySlug,
} from "../../services/membership.service.js";
import useMembershipAccess from "../../hooks/useMembershipAccess.js";
import airtelLogo from "../../assets/payments/airtel-money.jpg";
import nationalBankLogo from "../../assets/payments/national-bank-lockup.png";
import PaymentBrandMark from "./PaymentBrandMark.jsx";

const getDisplayPlanPrice = (plan) => formatAmount(plan?.price || 0);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { refreshAccess } = useMembershipAccess();
  const [plan, setPlan] = useState(null);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [airtelOpen, setAirtelOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [nepgLoading, setNepgLoading] = useState(false);
  const [nepgError, setNepgError] = useState("");

  const params = new URLSearchParams(search);
  const planSlug = params.get("plan") || "";
  const adId = params.get("adId") || "";
  const mode = params.get("mode") === "account" ? "account" : "boost";
  const isAccountMode = mode === "account";
  const subscriptionScope = isAccountMode ? "seller_membership" : "ad_boost";
  const nepgEnabled = String(import.meta.env.VITE_NEPG_ENABLED || "false").toLowerCase() === "true";

  useEffect(() => {
    let mounted = true;
    const fetchSelection = async () => {
      if (!planSlug) {
        setError("Select a plan first.");
        setLoading(false);
        return;
      }
      if (!isAccountMode && !adId) {
        setError("Select an advert and a boost plan first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (isAccountMode) {
          const result = await getPlanBySlug(planSlug);
          if (!mounted) return;
          setPlan(result);
          setAd(null);
        } else {
          const [result, advert] = await Promise.all([
            getPlanBySlug(planSlug),
            getAdForBoost(adId),
          ]);
          if (!mounted) return;
          setPlan(result);
          setAd(advert);
        }
        setError("");
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || err?.message || "Failed to load your selected plan.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSelection();
    return () => { mounted = false; };
  }, [planSlug, adId, isAccountMode]);

  const createIdempotencyKey = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `nepg-${plan?._id || "plan"}-${crypto.randomUUID()}`;
    }
    return `nepg-${plan?._id || "plan"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const handleNepgPayment = async () => {
    if (!plan?._id || nepgLoading) return;
    try {
      setSelectedMethod("nepg");
      setNepgError("");
      setNepgLoading(true);
      const subscription = await createSubscriptionIntent(
        plan._id,
        isAccountMode ? null : adId,
        subscriptionScope
      );
      const result = await createNepgPaymentIntent({
        subscriptionId: subscription._id,
        idempotencyKey: createIdempotencyKey(),
      });
      const redirectUrl = result?.initiation?.redirectUrl || result?.initiation?.formUrl;
      if (!redirectUrl) throw new Error("NEPG did not return a secure payment page.");
      window.location.assign(redirectUrl);
    } catch (err) {
      setNepgLoading(false);
      setNepgError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not start the NEPG payment. Please try another payment option."
      );
    }
  };

  const backToPricing = () => {
    if (isAccountMode) {
      navigate("/pricing?mode=account");
      return;
    }
    navigate(adId ? `/pricing?mode=boost&adId=${encodeURIComponent(adId)}` : "/dashboard/my-ads");
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8f9ff] via-white to-[#f4f6ff] px-4 py-24 text-[#14213d] sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#2E3192]/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#F4B400]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-[2rem] border border-[#DFE5FF] bg-white p-6 shadow-[0_24px_70px_-38px_rgba(46,49,146,0.2)] md:p-8">
          <button type="button" onClick={backToPricing} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100">
            <ArrowLeft size={16} /> Back to pricing
          </button>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2E3192]/10 bg-[#EEF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#2E3192]">
                {isAccountMode ? <Crown size={14} className="text-[#F4B400]" /> : <Rocket size={14} className="text-[#F4B400]" />}
                {isAccountMode ? "Secure Seller Subscription Payment" : "Secure Advert Boost Payment"}
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#1c2454] md:text-5xl">Choose how you want to pay</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {isAccountMode
                  ? "Choose NEPG, Airtel Money, or National Bank. Electronic payments are confirmed automatically, while bank transfers are activated after your Proof of Payment is reviewed."
                  : "Choose NEPG, Airtel Money, or National Bank. Electronic payments are confirmed automatically, while bank transfers are activated after your Proof of Payment is reviewed."}
              </p>
              <div className="mt-7 grid gap-3 text-sm text-slate-700">
                <Step text="Choose how you would like to pay." />
                <Step text={isAccountMode ? "A unique payment reference and subscription number will be created for your purchase." : "A unique payment reference and boost number will be created for your purchase."} />
                <Step text={isAccountMode ? "Your seller plan will be activated once your payment has been confirmed." : "Your selected advert will be boosted once your payment has been confirmed."} />
                <Step text="Your payment acknowledgement will always be available in My Payments." />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-[#E3E8FF] bg-[#F8FAFF] p-5">
              {loading ? (
                <div className="flex min-h-[18rem] items-center justify-center gap-3 text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-[#2E3192]" />Loading plan...</div>
              ) : error ? (
                <div className="min-h-[18rem] rounded-[1.3rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E3192]/60">{isAccountMode ? "Seller Plan Summary" : "Boost Summary"}</p>
                  {!isAccountMode && ad ? (
                    <div className="mt-4 rounded-[1.4rem] border border-[#E3E8FF] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2E3192]/55">Selected advert</p>
                      <p className="mt-2 text-lg font-bold text-[#1c2454]">{ad.title}</p>
                      <p className="mt-1 text-sm text-slate-500">This payment will boost only this listing.</p>
                    </div>
                  ) : null}
                  {isAccountMode ? (
                    <div className="mt-4 rounded-[1.4rem] border border-[#E3E8FF] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2E3192]/55">Account-level subscription</p>
                      <p className="mt-2 text-lg font-bold text-[#1c2454]">Applies to your seller account</p>
                      <p className="mt-1 text-sm text-slate-500">Advert boosts remain separate and can still be purchased from My Ads.</p>
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-[1.4rem] border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xl font-semibold text-[#1c2454]">{plan?.name}</p><p className="mt-1 text-sm text-slate-500">{plan?.durationDays} days</p></div>
                      <div className="rounded-2xl bg-[#EEF2FF] px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.22em] text-[#2E3192]/60">Amount</p><p className="mt-1 text-2xl font-semibold text-[#1c2454]">MWK {getDisplayPlanPrice(plan)}</p></div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <InfoChip icon={BadgeCheck} text="Your selected package and payment amount are confirmed before payment." />
                    <InfoChip icon={ShieldCheck} text={isAccountMode ? "Your subscription is activated only after your payment has been successfully confirmed." : "Your advert boost is activated only after your payment has been successfully confirmed."} />
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {!loading && !error && plan ? (
          <>
            <div className={`mt-7 grid gap-5 ${nepgEnabled ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {nepgEnabled ? <PaymentCard selected={selectedMethod === "nepg"} brandLabel="NEPG" title="NEPG" description="Pay through the National Electronic Payment Gateway. You will be redirected to the secure hosted payment page, then returned to Zitheke for confirmation." icon={CreditCard} button={nepgLoading ? "Connecting to NEPG..." : "Pay with NEPG"} disabled={nepgLoading} onClick={handleNepgPayment} /> : null}
              <PaymentCard selected={selectedMethod === "airtel"} logo={airtelLogo} title="Airtel Money" description="Pay instantly from your Airtel Money wallet. Zitheke will confirm your payment automatically." icon={Smartphone} button="Pay with Airtel Money" onClick={() => { setSelectedMethod("airtel"); setNepgError(""); setAirtelOpen(true); }} />
              <PaymentCard selected={selectedMethod === "bank"} logo={nationalBankLogo} title="National Bank" description="Transfer or deposit into the National Bank account, then upload your Proof of Payment for review." icon={Landmark} button="Pay via National Bank" onClick={() => { setSelectedMethod("bank"); setNepgError(""); }} />
            </div>
            {nepgError ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{nepgError}</div> : null}
          </>
        ) : null}

        {selectedMethod === "bank" && plan ? (
          <div className="mt-7">
            <BankTransferPayment plan={plan} adId={adId} ad={ad} scope={subscriptionScope} />
          </div>
        ) : null}
      </div>

      {nepgLoading ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#11183a]/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white p-8 text-center shadow-2xl">
            <Loader2 className="mx-auto h-11 w-11 animate-spin text-[#2E3192]" />
            <h2 className="mt-5 text-2xl font-black text-[#1c2454]">Connecting to NEPG</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">We are preparing your secure payment page. Please do not close this window.</p>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Powered by Restock Tech</p>
          </div>
        </div>
      ) : null}

      {plan ? (
        <AirtelPaymentModal
          open={airtelOpen}
          onOpenChange={setAirtelOpen}
          plan={plan}
          adId={adId}
          ad={ad}
          scope={subscriptionScope}
          onSuccess={async () => { await refreshAccess(); }}
        />
      ) : null}
    </section>
  );
};

const PaymentCard = ({ selected, logo, brandLabel, title, description, icon: Icon, button, disabled = false, onClick }) => {
  const logoVariant = title === "Airtel Money" ? "square" : "wide";
  return (
    <motion.button type="button" whileHover={disabled ? undefined : { y: -5 }} whileTap={disabled ? undefined : { scale: 0.995 }} disabled={disabled} onClick={onClick} className={`group relative overflow-hidden rounded-[1.9rem] border bg-white p-4 text-left shadow-[0_18px_46px_-34px_rgba(15,23,42,0.35)] transition sm:p-5 disabled:cursor-wait disabled:opacity-80 ${selected ? "border-[#2E3192] ring-4 ring-[#2E3192]/10" : "border-[#E3E8FF] hover:border-[#2E3192]/30 hover:shadow-[0_24px_54px_-34px_rgba(46,49,146,0.32)]"}`}>
      <div className="relative">
        {logo ? (
          <PaymentBrandMark src={logo} alt={`${title} logo`} variant={logoVariant} size="card" selected={selected} />
        ) : (
          <div className={`relative isolate flex h-36 w-full items-center justify-center overflow-hidden rounded-[1.55rem] border bg-white ${selected ? "border-[#2E3192]/25" : "border-[#E6EAFF]"}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,49,146,0.10),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(244,180,0,0.10),_transparent_38%)]" />
            <div className="relative rounded-2xl border border-[#2E3192]/15 bg-[#EEF2FF] px-7 py-4 text-center">
              <p className="text-3xl font-black tracking-[0.12em] text-[#2E3192]">{brandLabel || title}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2E3192]/55">National Electronic Payment Gateway</p>
            </div>
          </div>
        )}
        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#2E3192] shadow-sm backdrop-blur"><Icon size={20} /></div>
        {selected ? <span className="absolute left-4 top-4 rounded-full bg-[#2E3192] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">Selected</span> : null}
      </div>
      <div className="px-1 pb-1 pt-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#1c2454] sm:text-2xl">{title}</h2><span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2E3192]/45">Payment</span></div>
        <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-500">{description}</p>
        <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2E3192] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_-16px_rgba(46,49,146,0.75)] transition group-hover:bg-[#25287f]">{button}</span>
      </div>
    </motion.button>
  );
};

const Step = ({ text }) => <div className="rounded-2xl border border-[#E8ECFF] bg-[#F8FAFF] px-4 py-3 shadow-sm">{text}</div>;
const InfoChip = ({ icon: Icon, text }) => <div className="flex items-start gap-3 rounded-2xl border border-[#E8ECFF] bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"><Icon size={16} className="mt-0.5 shrink-0 text-[#2E3192]" /><span>{text}</span></div>;

export default CheckoutPage;
