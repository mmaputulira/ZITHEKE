const esc = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-MW", { dateStyle: "medium", timeStyle: "short" });
};

export const receiptHtml = (receipt) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(receipt?.receiptReference || "Zitheke Receipt")}</title>
<style>body{font-family:Arial,sans-serif;color:#172554;margin:0;background:#f8fafc}.sheet{max-width:760px;margin:30px auto;background:#fff;padding:38px;border:1px solid #dbe3ff;border-radius:18px}.brand{color:#2E3192;font-size:30px;font-weight:800}.sub{color:#64748b}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0}.item{padding:12px;border:1px solid #e2e8f0;border-radius:10px}.label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em}.value{font-weight:700;margin-top:5px}.status{padding:12px;background:#eef2ff;border-radius:10px}.foot{margin-top:30px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px}@media print{body{background:#fff}.sheet{border:0;margin:0;max-width:none}}</style></head>
<body><div class="sheet"><div class="brand">Zitheke</div><div class="sub">Payment Acknowledgement / Advert Boost Receipt</div>
<div class="grid">
<div class="item"><div class="label">Receipt ID</div><div class="value">${esc(receipt?.receiptReference)}</div></div>
<div class="item"><div class="label">Payment Reference</div><div class="value">${esc(receipt?.paymentReference)}</div></div>
<div class="item"><div class="label">Subscription ID</div><div class="value">${esc(receipt?.subscriptionReference)}</div></div>
<div class="item"><div class="label">Package</div><div class="value">${esc(receipt?.package?.name)} · ${esc(receipt?.package?.durationDays)} days</div></div>
<div class="item"><div class="label">Advert</div><div class="value">${esc(receipt?.advert?.title || "—")}</div></div>
<div class="item"><div class="label">Customer</div><div class="value">${esc(receipt?.customer?.name || receipt?.customer?.email)}</div></div>
<div class="item"><div class="label">Amount</div><div class="value">${esc(receipt?.currency)} ${Number(receipt?.amount || 0).toLocaleString("en-MW")}</div></div>
<div class="item"><div class="label">Payment Method</div><div class="value">${esc(receipt?.paymentMethod)}</div></div>
<div class="item"><div class="label">Created</div><div class="value">${esc(formatDate(receipt?.createdAt))}</div></div>
</div>
<div class="status"><strong>Payment:</strong> ${esc(receipt?.paymentStatus)} &nbsp; <strong>Verification:</strong> ${esc(receipt?.verificationStatus)} &nbsp; <strong>Boost:</strong> ${esc(receipt?.subscriptionStatus)}</div>
<div class="grid"><div class="item"><div class="label">Boost Starts</div><div class="value">${esc(formatDate(receipt?.subscriptionStartDate))}</div></div><div class="item"><div class="label">Boost Ends</div><div class="value">${esc(formatDate(receipt?.subscriptionEndDate))}</div></div></div>
<div class="foot">${esc(receipt?.disclaimer)}<br><br><strong>Powered by Restock Tech</strong></div></div></body></html>`;

export const downloadReceiptHtml = (receipt) => {
  const blob = new Blob([receiptHtml(receipt)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${receipt?.receiptReference || "zitheke-receipt"}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const printReceipt = (receipt) => {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(receiptHtml(receipt));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
};
