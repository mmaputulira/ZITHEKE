import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Heart,
  HandCoins,
  Users,
  BellRing,
  Eye,
  Sparkles,
  MessageCircle,
  Rocket,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  Crown,
  CalendarDays,
  Megaphone,
  BadgeCheck,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import useMembershipAccess from "../../hooks/useMembershipAccess.js";

const Stat = ({ icon: Icon, label, value, hint, onClick }) => (
  <button
    onClick={onClick}
    className="text-left bg-white/90 border border-[#2E3192]/10 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
  >
    <div className="flex items-center justify-between">
      <span className="w-11 h-11 rounded-2xl bg-[#2E3192]/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#2E3192]" />
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </div>
    <p className="text-3xl font-bold text-[#1A1D64] mt-4">{value ?? "—"}</p>
    <p className="text-sm font-semibold text-gray-800">{label}</p>
    <p className="text-xs text-gray-500 mt-1">{hint}</p>
  </button>
);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-MW", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const GrowthCard = ({ icon: Icon, eyebrow, title, description, accent, children, actionLabel, onAction }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ type: "spring", stiffness: 220 }}
    className="relative overflow-hidden rounded-[30px] border border-[#2E3192]/10 bg-white p-6 shadow-sm md:p-7"
  >
    <div className={`absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${accent}`} />
    <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E3192]/55">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold text-[#1A1D64]">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">{description}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E3192] text-white shadow-lg shadow-[#2E3192]/20">
          <Icon size={22} />
        </span>
      </div>
      <div className="mt-6">{children}</div>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2E3192] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24277e]"
      >
        {actionLabel}
        <ChevronRight size={16} />
      </button>
    </div>
  </motion.div>
);

const MyMarketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { access, loading: membershipLoading } = useMembershipAccess();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/marketplace/summary"), api.get("/marketplace/analytics")])
      .then(([s, a]) => {
        setSummary(s.data);
        setAnalytics(a.data);
      })
      .catch((e) => console.error("Marketplace dashboard", e))
      .finally(() => setLoading(false));
  }, []);

  const firstName = (
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "there"
  ).split(" ")[0];

  const topAds = (analytics?.ads || [])
    .slice()
    .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
    .slice(0, 4);

  const activeBoosts = Array.isArray(analytics?.boosts) ? analytics.boosts : [];
  const membership = access?.subscription || null;
  const planName = access?.plan?.name || "FREE";
  const hasPaidPlan = Boolean(access?.hasActiveSubscription && access?.isPremium);

  return (
    <div className="min-h-screen bg-[#F6F7FF] -m-4 sm:-m-6 md:-m-8 p-4 sm:p-6 md:p-8 font-[Poppins] relative overflow-hidden">
      <div className="absolute -top-40 -right-32 w-[520px] h-[520px] bg-[#2E3192]/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] bg-gradient-to-br from-[#2E3192] to-[#1A1D64] text-white p-7 md:p-9 shadow-xl overflow-hidden relative"
        >
          <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold bg-white/10 border border-white/15 rounded-full px-3 py-1.5">
                <Sparkles size={14} /> My Marketplace
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mt-4">Welcome back, {firstName}</h1>
              <p className="text-white/75 mt-2 max-w-2xl">
                Manage your seller plan, promote individual adverts, track performance, negotiate offers and keep buyers engaged from one connected workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/pricing?mode=account")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#F9B233] text-[#1A1D64] font-semibold"
              >
                <Crown size={18} /> {hasPaidPlan ? "Manage Plan" : "Upgrade Account"}
              </button>
              <button
                onClick={() => navigate("/dashboard/my-ads")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 border border-white/20 font-semibold"
              >
                <Rocket size={18} /> Boost an Ad
              </button>
              <button
                onClick={() => navigate("/dashboard/createAd")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#2E3192] font-semibold"
              >
                <PlusCircle size={18} /> Post an Ad
              </button>
            </div>
          </div>
        </motion.section>

        <section>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2E3192]/55">Grow on Zitheke</p>
              <h2 className="mt-1 text-2xl font-bold text-[#1A1D64]">Two clear ways to grow your presence</h2>
            </div>
            <p className="max-w-xl text-sm text-gray-500">
              Your seller subscription applies to your account. Advert boosts are purchased separately for the specific listing you want to promote.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <GrowthCard
              icon={Crown}
              eyebrow="Seller Subscription"
              title="Upgrade My Seller Account"
              description="Unlock an account-level Zitheke plan without changing which individual adverts you choose to promote."
              accent="bg-[#F9B233]/25"
              actionLabel={hasPaidPlan ? "Manage Subscription" : "View Seller Plans"}
              onAction={() => navigate("/pricing?mode=account")}
            >
              <div className="rounded-2xl border border-[#E4E8FF] bg-[#F8F9FF] p-4">
                {membershipLoading ? (
                  <p className="text-sm text-gray-500">Checking your seller plan…</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2E3192]/50">Your Plan</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xl font-bold text-[#1A1D64]">{planName}</p>
                        {hasPaidPlan ? <BadgeCheck size={18} className="text-emerald-600" /> : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2E3192]/50">Active Until</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-[#1A1D64]">
                        <CalendarDays size={16} /> {hasPaidPlan ? formatDate(membership?.endDate) : "No paid plan"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </GrowthCard>

            <GrowthCard
              icon={Megaphone}
              eyebrow="Advert Promotion"
              title="Boost an Advert"
              description="Increase visibility for one specific product or service listing for the selected boost period."
              accent="bg-[#2E3192]/15"
              actionLabel={activeBoosts.length ? "Boost Another Ad" : "Choose an Advert to Boost"}
              onAction={() => navigate("/dashboard/my-ads")}
            >
              <div className="rounded-2xl border border-[#E4E8FF] bg-[#F8F9FF] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2E3192]/50">Your Boosted Ads</p>
                    <p className="mt-1 text-xl font-bold text-[#1A1D64]">{activeBoosts.length} active</p>
                  </div>
                  <Rocket className="text-[#F9B233]" />
                </div>
                <div className="mt-3 space-y-2">
                  {activeBoosts.slice(0, 2).map((boost) => (
                    <div key={boost._id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm">
                      <span className="min-w-0 truncate font-semibold text-gray-800">{boost.ad?.title || "Advert"}</span>
                      <span className="shrink-0 text-xs font-semibold text-[#2E3192]">{boost.daysRemaining ?? 0} days remaining</span>
                    </div>
                  ))}
                  {!activeBoosts.length ? (
                    <p className="text-sm text-gray-500">No adverts are currently boosted. Your normal listings remain active.</p>
                  ) : null}
                </div>
              </div>
            </GrowthCard>
          </div>
        </section>

        {loading ? (
          <div className="text-[#2E3192] font-semibold animate-pulse">Loading your marketplace…</div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              <Stat icon={Heart} label="Saved Items" value={summary?.savedItems} hint="Listings you want to revisit" onClick={() => navigate("/dashboard/favorites")} />
              <Stat icon={HandCoins} label="Offers Sent" value={summary?.openOffersSent} hint="Open negotiations" onClick={() => navigate("/dashboard/offers")} />
              <Stat icon={MessageCircle} label="Offers Received" value={summary?.openOffersReceived} hint="Buyer interest waiting" onClick={() => navigate("/dashboard/offers")} />
              <Stat icon={Users} label="Following" value={summary?.followedSellers} hint="Sellers on your watchlist" onClick={() => navigate("/dashboard/following")} />
              <Stat icon={BellRing} label="Price Alerts" value={summary?.priceAlerts} hint="Watching for price drops" onClick={() => navigate("/dashboard/price-alerts")} />
              <Stat icon={Eye} label="Listing Views" value={summary?.seller?.views} hint="Across your adverts" onClick={() => navigate("/dashboard/boost-performance")} />
              <Stat icon={TrendingUp} label="Active Boosts" value={summary?.seller?.activeBoosts} hint="Promoted right now" onClick={() => navigate("/dashboard/boost-performance")} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-3xl border border-[#2E3192]/10 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1D64]">Seller Analytics</h2>
                    <p className="text-sm text-gray-500">See which listings are creating attention.</p>
                  </div>
                  <button onClick={() => navigate("/dashboard/boost-performance")} className="text-sm font-semibold text-[#2E3192]">Full performance →</button>
                </div>
                {topAds.length ? (
                  <div className="space-y-3">
                    {topAds.map((ad) => (
                      <button key={ad._id} onClick={() => navigate(`/ad/${ad._id}`)} className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center text-left p-4 rounded-2xl bg-[#F7F8FF] hover:bg-[#EEF0FF] transition">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{ad.title}</p>
                          <p className="text-xs text-gray-500">{ad.status}{ad.featured ? " • Boost active" : ""}</p>
                        </div>
                        <div className="text-right"><p className="font-bold text-[#1A1D64]">{ad.views || 0}</p><p className="text-[11px] text-gray-400">views</p></div>
                        <div className="text-right"><p className="font-bold text-[#1A1D64]">{ad.favouritesCount || 0}</p><p className="text-[11px] text-gray-400">saves</p></div>
                        <div className="text-right hidden sm:block"><p className="font-bold text-[#1A1D64]">{ad.inquiries || 0}</p><p className="text-[11px] text-gray-400">inquiries</p></div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">Post your first advert to start seeing performance insights.</div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-[#2E3192]/10 p-6 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#F9B233]/15 flex items-center justify-center mb-4"><BarChart3 className="text-[#2E3192]" /></div>
                <h2 className="text-xl font-bold text-[#1A1D64]">Your marketplace pulse</h2>
                <p className="text-sm text-gray-500 mt-1">A quick snapshot of buyer engagement.</p>
                <div className="mt-6 space-y-4">
                  {[
                    ["Total saves", analytics?.totals?.saves || 0],
                    ["Inquiries", analytics?.totals?.inquiries || 0],
                    ["Offers", analytics?.totals?.offers || 0],
                    ["Followers", analytics?.totals?.followers || 0],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center border-b pb-3">
                      <span className="text-sm text-gray-600">{k}</span>
                      <span className="font-bold text-[#1A1D64]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default MyMarketplace;
