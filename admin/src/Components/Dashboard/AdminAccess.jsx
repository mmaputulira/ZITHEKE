import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  PencilLine,
  Phone,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import {
  applyStaffRoster,
  createStaff,
  getStaffAccess,
  setStaffPassword,
  updateAdminRole,
  updateStaff,
} from "../../api/adminOperationsApi.js";
import { useAdminAccess } from "../../AdminRoutes/AdminAccessContext.jsx";

const input =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2E3192]/40 focus:ring-4 focus:ring-[#2E3192]/10";
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const errorText = (e, fallback) => e?.response?.data?.message || fallback;

// A readable temporary password: letters and numbers, 14 characters.
const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(14);
  window.crypto.getRandomValues(values);
  let out = Array.from(values, (v) => chars[v % chars.length]).join("");
  if (!/[0-9]/.test(out)) out = out.slice(0, 13) + "7";
  if (!/[A-Za-z]/.test(out)) out = "Z" + out.slice(1);
  return out;
};

function PasswordField({ value, onChange, label = "Temporary password" }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block space-y-1 text-xs font-medium text-gray-600">
      <span>{label}</span>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            className={`${input} pr-10 font-mono`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="At least 12 letters and numbers"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-[#2E3192]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(generatePassword());
            setShow(true);
          }}
          className="shrink-0 rounded-xl border border-[#D8DEFF] bg-[#EEF2FF] px-3 text-xs font-semibold text-[#2E3192] hover:bg-[#E6EAFF]"
        >
          Generate
        </button>
      </div>
      <span className="block font-normal text-gray-400">
        Share it with the staff member privately. They must choose their own password the first time they sign in.
      </span>
    </label>
  );
}

function RolePicker({ labels, value, onChange, disabled }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(labels).map(([role, label]) => (
        <label
          key={role}
          className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            value.includes(role) ? "border-[#2E3192]/40 bg-[#EEF2FF] text-[#1A1D64]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <input
            type="checkbox"
            className="mt-0.5 accent-[#2E3192]"
            disabled={disabled}
            checked={value.includes(role)}
            onChange={(e) => onChange(e.target.checked ? [...new Set([...value, role])] : value.filter((r) => r !== role))}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1A1D64]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function AdminAccess() {
  const { labels, admin } = useAdminAccess();
  const [staff, setStaff] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [roleDrafts, setRoleDrafts] = useState({});
  const [modal, setModal] = useState(null); // {type:'add'|'edit'|'password', staff?}
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const data = await getStaffAccess();
      setStaff(data.staff);
      setRoster(data.roster);
      setRoleDrafts({});
      setError("");
    } catch (e) {
      setError(errorText(e, "Unable to load staff"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const missing = roster.filter((r) => !r.present);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => `${s.name} ${s.email} ${(s.roles || []).map((r) => labels[r]).join(" ")}`.toLowerCase().includes(q));
  }, [staff, query, labels]);

  const toast = (title) => Swal.fire({ toast: true, position: "top-end", timer: 2400, showConfirmButton: false, icon: "success", title });

  const openAdd = (prefill = {}) => {
    setForm({ name: prefill.name || "", email: prefill.email || "", phone: "", roles: prefill.roles || [], password: generatePassword() });
    setModal({ type: "add" });
  };
  const openEdit = (s) => {
    setForm({ name: s.name || "", phone: s.phone || "" });
    setModal({ type: "edit", staff: s });
  };
  const openPassword = (s) => {
    setForm({ password: generatePassword() });
    setModal({ type: "password", staff: s });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy("modal");
    try {
      if (modal.type === "add") {
        const res = await createStaff(form);
        await Swal.fire({
          icon: "success",
          title: "Staff member added",
          html: `<p style="margin-bottom:8px">${esc(res.message)}</p><p>Email: <b>${esc(form.email)}</b></p><p>Temporary password: <code style="font-size:15px">${esc(form.password)}</code></p>`,
          confirmButtonColor: "#2E3192",
        });
      } else if (modal.type === "edit") {
        await updateStaff(modal.staff._id, { name: form.name, phone: form.phone });
        toast("Details saved");
      } else if (modal.type === "password") {
        const res = await setStaffPassword(modal.staff._id, form.password);
        await Swal.fire({
          icon: "success",
          title: "Temporary password set",
          html: `<p style="margin-bottom:8px">${esc(res.message)}</p><p>Temporary password: <code style="font-size:15px">${esc(form.password)}</code></p>`,
          confirmButtonColor: "#2E3192",
        });
      }
      setModal(null);
      window.dispatchEvent(new Event("admin-access-updated"));
      await load();
    } catch (err) {
      Swal.fire("Not saved", errorText(err, "Please try again."), "error");
    } finally {
      setBusy("");
    }
  };

  const saveRoles = async (s) => {
    const roles = roleDrafts[s._id];
    if (!roles?.length) return Swal.fire("Choose a role", "Every staff member needs at least one job role.", "info");
    setBusy(`roles-${s._id}`);
    try {
      await updateAdminRole(s._id, { roles });
      window.dispatchEvent(new Event("admin-access-updated"));
      toast("Roles saved");
      await load();
    } catch (err) {
      Swal.fire("Roles not saved", errorText(err, "Please try again."), "error");
    } finally {
      setBusy("");
    }
  };

  const toggleActive = async (s) => {
    const turningOff = s.active !== false;
    const answer = await Swal.fire({
      icon: turningOff ? "warning" : "question",
      title: turningOff ? `Switch off ${s.name || s.email}?` : `Switch ${s.name || s.email} back on?`,
      text: turningOff ? "They are signed out straight away and cannot sign in until switched back on." : "They can sign in again with their current password.",
      showCancelButton: true,
      confirmButtonText: turningOff ? "Switch off" : "Switch on",
      confirmButtonColor: turningOff ? "#dc2626" : "#2E3192",
    });
    if (!answer.isConfirmed) return;
    setBusy(`active-${s._id}`);
    try {
      await updateStaff(s._id, { active: !turningOff });
      toast(turningOff ? "Account switched off" : "Account switched on");
      await load();
    } catch (err) {
      Swal.fire("Not changed", errorText(err, "Please try again."), "error");
    } finally {
      setBusy("");
    }
  };

  const applyRoster = async () => {
    const answer = await Swal.fire({
      icon: "question",
      title: "Apply the Zitheke job roles sheet?",
      text: "Each staff account on the sheet gets exactly the roles listed there. Accounts not on the sheet are not changed.",
      showCancelButton: true,
      confirmButtonText: "Apply job roles",
      confirmButtonColor: "#2E3192",
    });
    if (!answer.isConfirmed) return;
    setBusy("roster");
    try {
      const res = await applyStaffRoster();
      await Swal.fire({ icon: res.missing?.length ? "info" : "success", title: "Job roles applied", text: res.message, confirmButtonColor: "#2E3192" });
      window.dispatchEvent(new Event("admin-access-updated"));
      await load();
    } catch (err) {
      Swal.fire("Not applied", errorText(err, "Please try again."), "error");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <div className="flex items-center gap-2 p-6 text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading staff…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2E3192] sm:text-3xl">Staff access</h1>
          <p className="mt-1 text-sm text-gray-500">Add staff, set their temporary passwords and choose their job roles. Only the Super Administrator can change staff access.</p>
        </div>
        <button type="button" onClick={() => openAdd()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2E3192] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#242678]">
          <UserPlus size={17} /> Add staff member
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {roster.length > 0 && (
        <section className="rounded-2xl border border-[#D8DEFF] bg-[#F5F7FF] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[#2E3192]" />
              <div>
                <h2 className="font-semibold text-[#1A1D64]">Zitheke job roles sheet</h2>
                <p className="text-sm text-gray-600">
                  {roster.length - missing.length} of {roster.length} people on the sheet have a staff account.
                  {missing.length ? " Add the others, then apply the sheet." : " Apply the sheet to give everyone their listed roles."}
                </p>
              </div>
            </div>
            <button type="button" disabled={busy === "roster"} onClick={applyRoster} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2E3192]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#2E3192] hover:bg-[#EEF2FF] disabled:opacity-60">
              {busy === "roster" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw size={15} />} Apply job roles sheet
            </button>
          </div>
          {missing.length > 0 && (
            <ul className="mt-3 divide-y divide-[#D8DEFF] rounded-xl bg-white">
              {missing.map((m) => (
                <li key={m.email} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1A1D64]">{m.name} <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">No account yet</span></p>
                    <p className="truncate text-xs text-gray-500">{m.email} · {(m.roles || []).map((r) => labels[r] || r).join(", ")}</p>
                  </div>
                  <button type="button" onClick={() => openAdd(m)} className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-[#2E3192] px-3 py-2 text-xs font-semibold text-white sm:self-auto">
                    <UserPlus size={14} /> Add account
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input className={`${input} pl-9`} placeholder="Search staff by name, email or role" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((s) => {
          const roles = roleDrafts[s._id] || s.roles || [];
          const dirty = roleDrafts[s._id] && JSON.stringify([...roleDrafts[s._id]].sort()) !== JSON.stringify([...(s.roles || [])].sort());
          const isMe = String(s._id) === String(admin?.id || admin?._id);
          const off = s.active === false;
          return (
            <section key={s._id} className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${off ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-[#1A1D64]">{s.name || s.email}{isMe && <span className="ml-2 text-xs font-medium text-gray-400">(you)</span>}</h2>
                  <p className="flex items-center gap-1.5 truncate text-sm text-gray-500"><Mail size={13} /> {s.email}</p>
                  {s.phone && <p className="flex items-center gap-1.5 text-sm text-gray-500"><Phone size={13} /> {s.phone}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${off ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-700"}`}>{off ? "Switched off" : "Active"}</span>
                  {s.mustChangePassword ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Temporary password</span>
                  ) : s.passwordChangedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#2E3192]"><BadgeCheck size={12} /> Own password</span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <RolePicker labels={labels} value={roles} disabled={busy === `roles-${s._id}`} onChange={(next) => setRoleDrafts((d) => ({ ...d, [s._id]: next }))} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={!dirty || busy === `roles-${s._id}`} onClick={() => saveRoles(s)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E3192] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
                  {busy === `roles-${s._id}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck size={14} />} Save roles
                </button>
                <button type="button" onClick={() => openEdit(s)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8DEFF] bg-[#EEF2FF] px-3 py-2 text-xs font-semibold text-[#2E3192]"><PencilLine size={14} /> Edit details</button>
                {!isMe && <button type="button" onClick={() => openPassword(s)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8DEFF] bg-[#EEF2FF] px-3 py-2 text-xs font-semibold text-[#2E3192]"><KeyRound size={14} /> Set password</button>}
                {!isMe && (
                  <button type="button" disabled={busy === `active-${s._id}`} onClick={() => toggleActive(s)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${off ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                    <Power size={14} /> {off ? "Switch on" : "Switch off"}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {!filtered.length && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-gray-400">No staff match your search.</p>}

      <AnimatePresence>
        {modal && (
          <Modal
            title={modal.type === "add" ? "Add staff member" : modal.type === "edit" ? `Edit ${modal.staff.name || modal.staff.email}` : `Set a temporary password for ${modal.staff.name || modal.staff.email}`}
            onClose={() => busy !== "modal" && setModal(null)}
          >
            <form onSubmit={submit} className="space-y-4">
              {modal.type !== "password" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-gray-600"><span>Full name</span><input required className={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
                  {modal.type === "add" ? (
                    <label className="space-y-1 text-xs font-medium text-gray-600"><span>Email (used to sign in)</span><input required type="email" className={input} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
                  ) : (
                    <div className="space-y-1 text-xs font-medium text-gray-600"><span>Email</span><p className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-500">{modal.staff.email}</p></div>
                  )}
                  <label className="space-y-1 text-xs font-medium text-gray-600 sm:col-span-2"><span>Phone (optional)</span><input className={input} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></label>
                </div>
              )}
              {modal.type === "add" && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Job roles</p>
                  <RolePicker labels={labels} value={form.roles} onChange={(roles) => setForm((f) => ({ ...f, roles }))} />
                </div>
              )}
              {modal.type !== "edit" && <PasswordField value={form.password} onChange={(password) => setForm((f) => ({ ...f, password }))} />}
              {modal.type === "password" && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">This signs them out everywhere. Their old password stops working.</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setModal(null)} disabled={busy === "modal"} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={busy === "modal"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E3192] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {busy === "modal" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {modal.type === "add" ? "Add staff member" : modal.type === "edit" ? "Save details" : "Set password"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
