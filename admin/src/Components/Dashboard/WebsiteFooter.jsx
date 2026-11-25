import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ArrowDown, ArrowUp, Facebook, Instagram, LoaderCircle, Mail, MapPin, Phone, Plus, RotateCcw, Save, Trash2, Twitter } from "lucide-react";
import { getWebsiteFooter, saveWebsiteFooter } from "../../api/adminOperationsApi.js";
import { useAdminAccess } from "../../AdminRoutes/AdminAccessContext.jsx";

const input = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2E3192]/40 focus:ring-4 focus:ring-[#2E3192]/10";
const card = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5";

function LinkList({ title, hint, links, onChange, disabled }) {
  const update = (index, field, value) => onChange(links.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  const move = (index, step) => {
    const next = [...links];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <section className={card}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#1A1D64]">{title}</h2>
          <p className="text-xs text-gray-500">{hint}</p>
        </div>
        <button type="button" disabled={disabled || links.length >= 12} onClick={() => onChange([...links, { label: "", url: "" }])} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#D8DEFF] bg-[#EEF2FF] px-3 py-2 text-xs font-semibold text-[#2E3192] hover:bg-[#E6EAFF] disabled:opacity-50">
          <Plus size={14} /> Add link
        </button>
      </div>
      <div className="space-y-2">
        {links.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">No links. This column is hidden on the website until you add one.</p>}
        {links.map((link, index) => (
          <div key={index} className="grid gap-2 rounded-xl bg-[#F8FAFF] p-2 sm:grid-cols-[1fr_1.3fr_auto] sm:items-center">
            <input aria-label="Link name" disabled={disabled} className={input} placeholder="Name, e.g. About Us" value={link.label} onChange={(e) => update(index, "label", e.target.value)} />
            <input aria-label="Link address" disabled={disabled} className={input} placeholder="/about or https://..." value={link.url} onChange={(e) => update(index, "url", e.target.value)} />
            <div className="flex justify-end gap-1">
              <button type="button" disabled={disabled || index === 0} onClick={() => move(index, -1)} className="rounded-lg p-2 text-gray-500 hover:bg-white disabled:opacity-30" aria-label="Move up"><ArrowUp size={16} /></button>
              <button type="button" disabled={disabled || index === links.length - 1} onClick={() => move(index, 1)} className="rounded-lg p-2 text-gray-500 hover:bg-white disabled:opacity-30" aria-label="Move down"><ArrowDown size={16} /></button>
              <button type="button" disabled={disabled} onClick={() => onChange(links.filter((_, i) => i !== index))} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove link"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WebsiteFooter() {
  const { can } = useAdminAccess();
  const canEdit = can("site.write");
  const [footer, setFooter] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [meta, setMeta] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getWebsiteFooter()
      .then((data) => { setFooter(data.footer); setDefaults(data.defaults); setMeta({ updatedAt: data.updatedAt, updatedBy: data.updatedBy }); })
      .catch((e) => setError(e.response?.data?.message || "Unable to load the footer."));
  }, []);

  const set = (patch) => setFooter((current) => ({ ...current, ...patch }));
  const setContact = (field, value) => setFooter((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
  const setSocial = (field, value) => setFooter((current) => ({ ...current, social: { ...current.social, [field]: value } }));

  const save = async () => {
    setSaving(true); setError("");
    try {
      const data = await saveWebsiteFooter(footer);
      setFooter(data.footer); setMeta({ updatedAt: data.updatedAt, updatedBy: data.updatedBy });
      Swal.fire({ toast: true, position: "top-end", timer: 2200, showConfirmButton: false, icon: "success", title: "Footer saved" });
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save the footer.");
    } finally { setSaving(false); }
  };

  const restoreDefaults = async () => {
    const answer = await Swal.fire({ icon: "question", title: "Restore the original footer?", text: "This fills the form with the original footer. Nothing changes on the website until you press Save.", showCancelButton: true, confirmButtonText: "Restore", confirmButtonColor: "#2E3192" });
    if (answer.isConfirmed && defaults) setFooter(JSON.parse(JSON.stringify(defaults)));
  };

  if (!footer) return <div className="flex items-center gap-2 p-6 text-gray-500">{error ? <p role="alert" className="text-red-600">{error}</p> : <><LoaderCircle className="h-4 w-4 animate-spin" /> Loading footer…</>}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2E3192] sm:text-3xl">Website footer</h1>
          <p className="mt-1 text-sm text-gray-500">Edit the links and contact details at the bottom of every Zitheke page.{meta.updatedAt ? ` Last saved ${new Date(meta.updatedAt).toLocaleString()}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}.` : ""}</p>
        </div>
        {canEdit && <button type="button" onClick={restoreDefaults} className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"><RotateCcw size={14} /> Restore original</button>}
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className={card}>
        <h2 className="mb-2 font-semibold text-[#1A1D64]">About Zitheke</h2>
        <textarea disabled={!canEdit} rows={3} maxLength={400} className={input} value={footer.about} onChange={(e) => set({ about: e.target.value })} />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[["facebook", Facebook], ["twitter", Twitter], ["instagram", Instagram]].map(([key, Icon]) => (
            <label key={key} className="space-y-1 text-xs font-medium capitalize text-gray-600">
              <span className="flex items-center gap-1.5"><Icon size={14} /> {key} page</span>
              <input disabled={!canEdit} className={input} placeholder="https://… (leave empty to hide)" value={footer.social?.[key] || ""} onChange={(e) => setSocial(key, e.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <LinkList title="Quick links" hint="Pages such as About Us or Terms." disabled={!canEdit} links={footer.quickLinks || []} onChange={(quickLinks) => set({ quickLinks })} />
        <LinkList title="Popular categories" hint="Use /category/Name for a category page." disabled={!canEdit} links={footer.popularCategories || []} onChange={(popularCategories) => set({ popularCategories })} />
      </div>

      <section className={card}>
        <h2 className="mb-3 font-semibold text-[#1A1D64]">Contact us</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs font-medium text-gray-600"><span className="flex items-center gap-1.5"><MapPin size={14} /> Address</span><input disabled={!canEdit} className={input} value={footer.contact?.address || ""} onChange={(e) => setContact("address", e.target.value)} /></label>
          <label className="space-y-1 text-xs font-medium text-gray-600"><span className="flex items-center gap-1.5"><Mail size={14} /> Email</span><input disabled={!canEdit} type="email" className={input} value={footer.contact?.email || ""} onChange={(e) => setContact("email", e.target.value)} /></label>
          <label className="space-y-1 text-xs font-medium text-gray-600"><span className="flex items-center gap-1.5"><Phone size={14} /> Phone</span><input disabled={!canEdit} className={input} value={footer.contact?.phone || ""} onChange={(e) => setContact("phone", e.target.value)} /></label>
        </div>
        <p className="mt-2 text-xs text-gray-400">Leave a field empty to hide it on the website.</p>
      </section>

      {canEdit && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-2xl bg-[#2E3192] px-6 py-3 text-sm font-semibold text-white shadow-xl hover:bg-[#242678] disabled:opacity-70">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save size={16} />} {saving ? "Saving…" : "Save footer"}
          </button>
        </div>
      )}
    </div>
  );
}
