export const digitsOnly=(v="")=>String(v??"").replace(/[^0-9]/g,"");
export const formatMoney=(v=0,prefix="MWK ")=>`${prefix}${Number(v||0).toLocaleString("en-MW")}`;
export const formatCurrencyInput=(v="")=>{const d=digitsOnly(v);return d?Number(d).toLocaleString("en-MW"):""};
